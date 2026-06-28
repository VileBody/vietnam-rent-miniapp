package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Listing struct {
	ID                 string    `json:"id"`
	Title              string    `json:"title"`
	Area               string    `json:"area"`
	City               string    `json:"city"`
	Type               string    `json:"type"`
	Price              int       `json:"price"`
	Score              int       `json:"score"`
	Source             string    `json:"source"`
	Fresh              string    `json:"fresh"`
	Specs              []string  `json:"specs"`
	Details            []string  `json:"details"`
	Tags               []string  `json:"tags"`
	About              string    `json:"about"`
	Contact            Contact   `json:"contact"`
	FBURL              string    `json:"fbUrl"`
	Photos             []string  `json:"photos"`
	PetFriendly        bool      `json:"petFriendly"`
	ListingStatus      string    `json:"listingStatus"`
	AvailabilityStatus string    `json:"availabilityStatus"`
	FirstSeenAt        time.Time `json:"firstSeenAt"`
	LastSeenAt         time.Time `json:"lastSeenAt"`
}

type Contact struct {
	Name  string `json:"name"`
	Line  string `json:"line"`
	Value string `json:"value"`
}

type ScrapeSource struct {
	ID              int64          `json:"id"`
	CitySlug        string         `json:"citySlug"`
	CityName        string         `json:"cityName"`
	Name            string         `json:"name"`
	BaseURL         string         `json:"baseUrl"`
	Category        string         `json:"category"`
	Query           *string        `json:"query,omitempty"`
	MinPrice        *int           `json:"minPrice,omitempty"`
	MaxPrice        *int           `json:"maxPrice,omitempty"`
	MinBedrooms     *int           `json:"minBedrooms,omitempty"`
	MaxBedrooms     *int           `json:"maxBedrooms,omitempty"`
	RadiusKM        *int           `json:"radiusKm,omitempty"`
	SortBy          string         `json:"sortBy"`
	DaysSinceListed *int           `json:"daysSinceListed,omitempty"`
	Params          map[string]any `json:"params"`
	Enabled         bool           `json:"enabled"`
}

type Server struct {
	db *pgxpool.Pool
}

func main() {
	ctx := context.Background()
	databaseURL := getenv("DATABASE_URL", "postgres://vietnest:vietnest@127.0.0.1:5433/mock-marketplace?sslmode=disable")
	addr := listenAddr()

	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("connect postgres: %v", err)
	}
	defer db.Close()

	if err := waitForDB(ctx, db, 20*time.Second); err != nil {
		log.Fatalf("postgres is not ready: %v", err)
	}
	if err := migrate(ctx, db); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := seed(ctx, db); err != nil {
		log.Fatalf("seed: %v", err)
	}

	srv := &Server{db: db}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", srv.handleHealth)
	mux.HandleFunc("GET /api/listings", srv.handleListings)
	mux.HandleFunc("GET /api/listings/{id}", srv.handleListing)
	mux.HandleFunc("GET /api/scrape-sources", srv.handleScrapeSources)
	mux.HandleFunc("GET /", handleStatic)

	log.Printf("VietNest API listening on http://%s", addr)
	if err := http.ListenAndServe(addr, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func getenv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func listenAddr() string {
	if addr := strings.TrimSpace(os.Getenv("HTTP_ADDR")); addr != "" {
		return addr
	}
	if port := strings.TrimSpace(os.Getenv("PORT")); port != "" {
		return ":" + port
	}
	return "127.0.0.1:8080"
}

func waitForDB(ctx context.Context, db *pgxpool.Pool, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	var lastErr error
	for time.Now().Before(deadline) {
		if err := db.Ping(ctx); err == nil {
			return nil
		} else {
			lastErr = err
		}
		time.Sleep(500 * time.Millisecond)
	}
	return lastErr
}

func migrate(ctx context.Context, db *pgxpool.Pool) error {
	_, err := db.Exec(ctx, `
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS locations (
  id bigserial PRIMARY KEY,
  country_code text NOT NULL DEFAULT 'VN',
  city_slug text NOT NULL UNIQUE,
  city_name text NOT NULL,
  region_name text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scrape_sources (
  id bigserial PRIMARY KEY,
  location_id bigint REFERENCES locations(id),
  name text NOT NULL,
  base_url text NOT NULL,
  category text NOT NULL,
  query text,
  min_price int,
  max_price int,
  min_bedrooms int,
  max_bedrooms int,
  min_bathrooms int,
  max_bathrooms int,
  radius_km int,
  sort_by text NOT NULL DEFAULT 'creation_time_descend',
  days_since_listed int,
  params jsonb NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scrape_runs (
  id bigserial PRIMARY KEY,
  source_id bigint REFERENCES scrape_sources(id),
  apify_actor_id text,
  apify_run_id text UNIQUE,
  apify_dataset_id text,
  status text NOT NULL DEFAULT 'created',
  started_at timestamptz,
  finished_at timestamptz,
  items_found int NOT NULL DEFAULT 0,
  items_imported int NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id text PRIMARY KEY,
  title text NOT NULL,
  area text NOT NULL,
  city text NOT NULL,
  home_type text NOT NULL CHECK (home_type IN ('apartment', 'villa')),
  price_usd int NOT NULL CHECK (price_usd > 0),
  match_score int NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  source text NOT NULL,
  fresh text NOT NULL,
  specs text[] NOT NULL DEFAULT '{}',
  details text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  about text NOT NULL,
  contact_name text NOT NULL,
  contact_line text NOT NULL,
  contact_value text NOT NULL,
  fb_url text NOT NULL,
  photos text[] NOT NULL DEFAULT '{}',
  pet_friendly boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_id bigint REFERENCES locations(id);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_status text NOT NULL DEFAULT 'active';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_currency text NOT NULL DEFAULT 'USD';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_period text NOT NULL DEFAULT 'month';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deposit_amount int;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bedrooms numeric(4,1);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bathrooms numeric(4,1);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS area_sqm numeric(8,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS floor int;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS latitude numeric(9,6);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS longitude numeric(9,6);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS furnished boolean;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_pool boolean;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_gym boolean;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_balcony boolean;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_parking boolean;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_security boolean;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS normalized jsonb NOT NULL DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS first_seen_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE listings ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS stale_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS removed_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS check_fail_count int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS raw_marketplace_items (
  id bigserial PRIMARY KEY,
  run_id bigint REFERENCES scrape_runs(id),
  source_id bigint REFERENCES scrape_sources(id),
  listing_id text REFERENCES listings(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'facebook_marketplace',
  external_id text NOT NULL,
  source_url text NOT NULL,
  raw jsonb NOT NULL,
  raw_hash text NOT NULL,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE TABLE IF NOT EXISTS listing_photos (
  id bigserial PRIMARY KEY,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  position int NOT NULL,
  source_url text NOT NULL,
  storage_url text,
  width int,
  height int,
  blurhash text,
  checksum text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, position)
);

CREATE TABLE IF NOT EXISTS listing_contacts (
  id bigserial PRIMARY KEY,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  contact_type text NOT NULL DEFAULT 'unknown',
  name text,
  phone text,
  messenger_url text,
  facebook_profile_url text,
  raw_contact text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listing_price_history (
  id bigserial PRIMARY KEY,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  price_amount int,
  price_currency text NOT NULL DEFAULT 'USD',
  price_period text NOT NULL DEFAULT 'month',
  observed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, price_amount, price_currency, price_period, observed_at)
);

CREATE TABLE IF NOT EXISTS listing_availability_checks (
  id bigserial PRIMARY KEY,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  run_id bigint REFERENCES scrape_runs(id),
  checked_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL,
  http_status int,
  source_url text,
  evidence jsonb NOT NULL DEFAULT '{}',
  error text
);

CREATE TABLE IF NOT EXISTS app_users (
  id bigserial PRIMARY KEY,
  telegram_user_id bigint UNIQUE,
  username text,
  first_name text,
  language_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id bigint NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS listings_city_idx ON listings (city);
CREATE INDEX IF NOT EXISTS listings_home_type_idx ON listings (home_type);
CREATE INDEX IF NOT EXISTS listings_price_idx ON listings (price_usd);
CREATE INDEX IF NOT EXISTS listings_tags_idx ON listings USING gin (tags);
CREATE INDEX IF NOT EXISTS listings_location_idx ON listings (location_id);
CREATE INDEX IF NOT EXISTS listings_status_idx ON listings (listing_status);
CREATE INDEX IF NOT EXISTS listings_availability_idx ON listings (availability_status);
CREATE INDEX IF NOT EXISTS listings_last_seen_idx ON listings (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS listings_active_city_price_idx ON listings (city, price_usd) WHERE listing_status = 'active';
CREATE INDEX IF NOT EXISTS listings_amenities_idx ON listings USING gin (amenities);
CREATE INDEX IF NOT EXISTS listings_normalized_idx ON listings USING gin (normalized);
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx ON listings USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listings_about_trgm_idx ON listings USING gin (about gin_trgm_ops);
CREATE INDEX IF NOT EXISTS scrape_sources_location_idx ON scrape_sources (location_id);
CREATE INDEX IF NOT EXISTS scrape_sources_enabled_idx ON scrape_sources (enabled);
CREATE UNIQUE INDEX IF NOT EXISTS scrape_sources_name_unique_idx ON scrape_sources (name);
CREATE INDEX IF NOT EXISTS scrape_runs_source_idx ON scrape_runs (source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS raw_items_source_idx ON raw_marketplace_items (source_id, scraped_at DESC);
CREATE INDEX IF NOT EXISTS raw_items_raw_idx ON raw_marketplace_items USING gin (raw);
CREATE INDEX IF NOT EXISTS photos_listing_idx ON listing_photos (listing_id, position);
CREATE INDEX IF NOT EXISTS contacts_listing_idx ON listing_contacts (listing_id);
CREATE INDEX IF NOT EXISTS price_history_listing_idx ON listing_price_history (listing_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS availability_listing_idx ON listing_availability_checks (listing_id, checked_at DESC);
`)
	return err
}

func seed(ctx context.Context, db *pgxpool.Pool) error {
	if err := seedLocations(ctx, db); err != nil {
		return err
	}
	if err := seedScrapeSources(ctx, db); err != nil {
		return err
	}
	if err := seedListingsData(ctx, db); err != nil {
		return err
	}
	return seedListingChildren(ctx, db)
}

func seedLocations(ctx context.Context, db *pgxpool.Pool) error {
	batch := &pgx.Batch{}
	for _, location := range seedLocationsData {
		batch.Queue(`
INSERT INTO locations (city_slug, city_name, region_name, latitude, longitude)
VALUES (@city_slug, @city_name, @region_name, @latitude, @longitude)
ON CONFLICT (city_slug) DO UPDATE SET
  city_name = excluded.city_name,
  region_name = excluded.region_name,
  latitude = excluded.latitude,
  longitude = excluded.longitude;
`, pgx.NamedArgs{
			"city_slug":   location.CitySlug,
			"city_name":   location.CityName,
			"region_name": location.RegionName,
			"latitude":    location.Latitude,
			"longitude":   location.Longitude,
		})
	}

	results := db.SendBatch(ctx, batch)
	defer results.Close()
	for range seedLocationsData {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}
	return nil
}

func seedScrapeSources(ctx context.Context, db *pgxpool.Pool) error {
	batch := &pgx.Batch{}
	for _, source := range seedScrapeSourcesData {
		batch.Queue(`
INSERT INTO scrape_sources (
  location_id, name, base_url, category, query, min_price, max_price,
  min_bedrooms, max_bedrooms, radius_km, sort_by, days_since_listed, params, enabled
) VALUES (
  (SELECT id FROM locations WHERE city_slug = @city_slug),
  @name, @base_url, @category, @query, @min_price, @max_price,
  @min_bedrooms, @max_bedrooms, @radius_km, @sort_by, @days_since_listed, @params::jsonb, @enabled
)
ON CONFLICT (name) DO UPDATE SET
  location_id = excluded.location_id,
  base_url = excluded.base_url,
  category = excluded.category,
  query = excluded.query,
  min_price = excluded.min_price,
  max_price = excluded.max_price,
  min_bedrooms = excluded.min_bedrooms,
  max_bedrooms = excluded.max_bedrooms,
  radius_km = excluded.radius_km,
  sort_by = excluded.sort_by,
  days_since_listed = excluded.days_since_listed,
  params = excluded.params,
  enabled = excluded.enabled,
  updated_at = now();
`, pgx.NamedArgs{
			"city_slug":         source.CitySlug,
			"name":              source.Name,
			"base_url":          source.BaseURL,
			"category":          source.Category,
			"query":             source.Query,
			"min_price":         source.MinPrice,
			"max_price":         source.MaxPrice,
			"min_bedrooms":      source.MinBedrooms,
			"max_bedrooms":      source.MaxBedrooms,
			"radius_km":         source.RadiusKM,
			"sort_by":           source.SortBy,
			"days_since_listed": source.DaysSinceListed,
			"params":            source.Params,
			"enabled":           source.Enabled,
		})
	}

	results := db.SendBatch(ctx, batch)
	defer results.Close()
	for range seedScrapeSourcesData {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}
	return nil
}

func seedListingsData(ctx context.Context, db *pgxpool.Pool) error {
	batch := &pgx.Batch{}
	for _, listing := range seedListings {
		batch.Queue(`
INSERT INTO listings (
  id, location_id, title, area, city, home_type, property_type, price_usd, match_score, source, fresh,
  specs, details, tags, about, contact_name, contact_line, contact_value,
  fb_url, source_url, photos, pet_friendly, amenities,
  listing_status, availability_status, last_seen_at, last_checked_at, updated_at
) VALUES (
  @id, (SELECT id FROM locations WHERE city_slug = @city), @title, @area, @city, @home_type, @home_type, @price_usd, @match_score, @source, @fresh,
  @specs, @details, @tags, @about, @contact_name, @contact_line, @contact_value,
  @fb_url, @fb_url, @photos, @pet_friendly, @tags,
  'active', 'available', now(), now(), now()
)
ON CONFLICT (id) DO UPDATE SET
  location_id = excluded.location_id,
  title = excluded.title,
  area = excluded.area,
  city = excluded.city,
  home_type = excluded.home_type,
  property_type = excluded.property_type,
  price_usd = excluded.price_usd,
  match_score = excluded.match_score,
  source = excluded.source,
  fresh = excluded.fresh,
  specs = excluded.specs,
  details = excluded.details,
  tags = excluded.tags,
  about = excluded.about,
  contact_name = excluded.contact_name,
  contact_line = excluded.contact_line,
  contact_value = excluded.contact_value,
  fb_url = excluded.fb_url,
  source_url = excluded.source_url,
  photos = excluded.photos,
  pet_friendly = excluded.pet_friendly,
  amenities = excluded.amenities,
  listing_status = 'active',
  availability_status = 'available',
  last_seen_at = now(),
  last_checked_at = now(),
  check_fail_count = 0,
  updated_at = now();
`, pgx.NamedArgs{
			"id":            listing.ID,
			"title":         listing.Title,
			"area":          listing.Area,
			"city":          listing.City,
			"home_type":     listing.Type,
			"price_usd":     listing.Price,
			"match_score":   listing.Score,
			"source":        listing.Source,
			"fresh":         listing.Fresh,
			"specs":         listing.Specs,
			"details":       listing.Details,
			"tags":          listing.Tags,
			"about":         listing.About,
			"contact_name":  listing.Contact.Name,
			"contact_line":  listing.Contact.Line,
			"contact_value": listing.Contact.Value,
			"fb_url":        listing.FBURL,
			"photos":        listing.Photos,
			"pet_friendly":  listing.PetFriendly,
		})
	}

	results := db.SendBatch(ctx, batch)
	defer results.Close()
	for range seedListings {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}
	return nil
}

func seedListingChildren(ctx context.Context, db *pgxpool.Pool) error {
	batch := &pgx.Batch{}
	for _, listing := range seedListings {
		for index, photo := range listing.Photos {
			batch.Queue(`
INSERT INTO listing_photos (listing_id, position, source_url, is_primary)
VALUES (@listing_id, @position, @source_url, @is_primary)
ON CONFLICT (listing_id, position) DO UPDATE SET
  source_url = excluded.source_url,
  is_primary = excluded.is_primary;
`, pgx.NamedArgs{
				"listing_id": listing.ID,
				"position":   index,
				"source_url": photo,
				"is_primary": index == 0,
			})
		}

		batch.Queue(`
INSERT INTO listing_contacts (listing_id, contact_type, name, phone, raw_contact)
SELECT @listing_id, @contact_type, @name, @phone, @raw_contact
WHERE NOT EXISTS (
  SELECT 1 FROM listing_contacts WHERE listing_id = @listing_id AND raw_contact = @raw_contact
);
`, pgx.NamedArgs{
			"listing_id":   listing.ID,
			"contact_type": "unknown",
			"name":         listing.Contact.Name,
			"phone":        phoneOrNil(listing.Contact.Value),
			"raw_contact":  fmt.Sprintf("%s: %s", listing.Contact.Name, listing.Contact.Line),
		})

		batch.Queue(`
INSERT INTO listing_price_history (listing_id, price_amount, price_currency, price_period, observed_at)
SELECT @listing_id, @price_amount, 'USD', 'month', now()
WHERE NOT EXISTS (
  SELECT 1 FROM listing_price_history
  WHERE listing_id = @listing_id AND price_amount = @price_amount AND observed_at > now() - interval '1 day'
);
`, pgx.NamedArgs{
			"listing_id":   listing.ID,
			"price_amount": listing.Price,
		})

		batch.Queue(`
INSERT INTO listing_availability_checks (listing_id, status, source_url, evidence)
SELECT @listing_id, 'seen', @source_url, @evidence::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM listing_availability_checks
  WHERE listing_id = @listing_id AND status = 'seen' AND checked_at > now() - interval '1 day'
);
`, pgx.NamedArgs{
			"listing_id": listing.ID,
			"source_url": listing.FBURL,
			"evidence":   `{"seed": true}`,
		})

		raw, hash, err := rawSeedPayload(listing)
		if err != nil {
			return err
		}
		batch.Queue(`
INSERT INTO raw_marketplace_items (listing_id, source, external_id, source_url, raw, raw_hash)
VALUES (@listing_id, 'facebook_marketplace', @external_id, @source_url, @raw::jsonb, @raw_hash)
ON CONFLICT (source, external_id) DO UPDATE SET
  listing_id = excluded.listing_id,
  source_url = excluded.source_url,
  raw = excluded.raw,
  raw_hash = excluded.raw_hash,
  scraped_at = now();
`, pgx.NamedArgs{
			"listing_id":  listing.ID,
			"external_id": listing.ID,
			"source_url":  listing.FBURL,
			"raw":         string(raw),
			"raw_hash":    hash,
		})
	}

	results := db.SendBatch(ctx, batch)
	defer results.Close()
	for i := 0; i < queuedListingChildren(); i++ {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}
	return nil
}

func queuedListingChildren() int {
	total := 0
	for _, listing := range seedListings {
		total += len(listing.Photos) + 4
	}
	return total
}

func phoneOrNil(value string) *string {
	if strings.HasPrefix(value, "+") {
		return &value
	}
	return nil
}

func rawSeedPayload(listing Listing) ([]byte, string, error) {
	raw, err := json.Marshal(map[string]any{
		"id":          listing.ID,
		"title":       listing.Title,
		"price":       listing.Price,
		"location":    listing.Area,
		"url":         listing.FBURL,
		"photos":      listing.Photos,
		"description": listing.About,
		"contact":     listing.Contact,
		"seed":        true,
	})
	if err != nil {
		return nil, "", err
	}
	sum := sha256.Sum256(raw)
	return raw, fmt.Sprintf("%x", sum[:]), nil
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := s.db.Ping(ctx); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"ok": false, "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *Server) handleListings(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	where := []string{"true"}
	args := pgx.NamedArgs{}

	if r.URL.Query().Get("include_inactive") != "true" {
		where = append(where, "listing_status = 'active'")
	}
	if status := strings.TrimSpace(r.URL.Query().Get("status")); status != "" && status != "all" {
		where = append(where, "listing_status = @status")
		args["status"] = status
	}

	if city := strings.TrimSpace(r.URL.Query().Get("city")); city != "" && city != "all" {
		where = append(where, "city = @city")
		args["city"] = city
	}
	if homeType := strings.TrimSpace(r.URL.Query().Get("type")); homeType != "" && homeType != "all" {
		where = append(where, "home_type = @home_type")
		args["home_type"] = homeType
	}
	if maxPrice := strings.TrimSpace(r.URL.Query().Get("max_price")); maxPrice != "" {
		value, err := strconv.Atoi(maxPrice)
		if err != nil || value <= 0 {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "max_price must be a positive integer"})
			return
		}
		where = append(where, "price_usd <= @max_price")
		args["max_price"] = value
	}
	if pet := strings.TrimSpace(r.URL.Query().Get("pet_friendly")); pet == "true" {
		where = append(where, "pet_friendly = true")
	}

	query := listingSelectSQL + " WHERE " + strings.Join(where, " AND ") + " ORDER BY match_score DESC, price_usd ASC"
	rows, err := s.db.Query(ctx, query, args)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	listings, err := scanListings(rows)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, listings)
}

func (s *Server) handleListing(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	row := s.db.QueryRow(ctx, listingSelectSQL+" WHERE id = @id", pgx.NamedArgs{"id": r.PathValue("id")})
	listing, err := scanListing(row)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "listing not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, listing)
}

func (s *Server) handleScrapeSources(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	rows, err := s.db.Query(ctx, `
SELECT
  ss.id,
  l.city_slug,
  l.city_name,
  ss.name,
  ss.base_url,
  ss.category,
  ss.query,
  ss.min_price,
  ss.max_price,
  ss.min_bedrooms,
  ss.max_bedrooms,
  ss.radius_km,
  ss.sort_by,
  ss.days_since_listed,
  ss.params,
  ss.enabled
FROM scrape_sources ss
JOIN locations l ON l.id = ss.location_id
ORDER BY l.city_slug, ss.category, ss.name;
`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	sources := []ScrapeSource{}
	for rows.Next() {
		var source ScrapeSource
		var params []byte
		var query sql.NullString
		var minPrice sql.NullInt64
		var maxPrice sql.NullInt64
		var minBedrooms sql.NullInt64
		var maxBedrooms sql.NullInt64
		var radiusKM sql.NullInt64
		var daysSinceListed sql.NullInt64
		if err := rows.Scan(
			&source.ID,
			&source.CitySlug,
			&source.CityName,
			&source.Name,
			&source.BaseURL,
			&source.Category,
			&query,
			&minPrice,
			&maxPrice,
			&minBedrooms,
			&maxBedrooms,
			&radiusKM,
			&source.SortBy,
			&daysSinceListed,
			&params,
			&source.Enabled,
		); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		if len(params) > 0 {
			if err := json.Unmarshal(params, &source.Params); err != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
				return
			}
		}
		source.Query = nullStringPtr(query)
		source.MinPrice = nullIntPtr(minPrice)
		source.MaxPrice = nullIntPtr(maxPrice)
		source.MinBedrooms = nullIntPtr(minBedrooms)
		source.MaxBedrooms = nullIntPtr(maxBedrooms)
		source.RadiusKM = nullIntPtr(radiusKM)
		source.DaysSinceListed = nullIntPtr(daysSinceListed)
		sources = append(sources, source)
	}
	if err := rows.Err(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, sources)
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func nullIntPtr(value sql.NullInt64) *int {
	if !value.Valid {
		return nil
	}
	next := int(value.Int64)
	return &next
}

const listingSelectSQL = `
SELECT
  id, title, area, city, home_type, price_usd, match_score, source, fresh,
  specs, details, tags, about, contact_name, contact_line, contact_value,
  fb_url, photos, pet_friendly, listing_status, availability_status, first_seen_at, last_seen_at
FROM listings`

type scanner interface {
	Scan(dest ...any) error
}

func scanListings(rows pgx.Rows) ([]Listing, error) {
	listings := []Listing{}
	for rows.Next() {
		listing, err := scanListing(rows)
		if err != nil {
			return nil, err
		}
		listings = append(listings, listing)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return listings, nil
}

func scanListing(row scanner) (Listing, error) {
	var listing Listing
	err := row.Scan(
		&listing.ID,
		&listing.Title,
		&listing.Area,
		&listing.City,
		&listing.Type,
		&listing.Price,
		&listing.Score,
		&listing.Source,
		&listing.Fresh,
		&listing.Specs,
		&listing.Details,
		&listing.Tags,
		&listing.About,
		&listing.Contact.Name,
		&listing.Contact.Line,
		&listing.Contact.Value,
		&listing.FBURL,
		&listing.Photos,
		&listing.PetFriendly,
		&listing.ListingStatus,
		&listing.AvailabilityStatus,
		&listing.FirstSeenAt,
		&listing.LastSeenAt,
	)
	return listing, err
}

func handleStatic(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/")
	if path == "" {
		path = "index.html"
	}
	switch path {
	case "index.html", "styles.css", "app.js":
		http.ServeFile(w, r, path)
	default:
		http.NotFound(w, r)
		return
	}
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("write json: %v", err)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

type locationSeed struct {
	CitySlug   string
	CityName   string
	RegionName string
	Latitude   float64
	Longitude  float64
}

type scrapeSourceSeed struct {
	CitySlug        string
	Name            string
	BaseURL         string
	Category        string
	Query           *string
	MinPrice        *int
	MaxPrice        *int
	MinBedrooms     *int
	MaxBedrooms     *int
	RadiusKM        *int
	SortBy          string
	DaysSinceListed *int
	Params          string
	Enabled         bool
}

func strPtr(value string) *string {
	return &value
}

func intPtr(value int) *int {
	return &value
}

var seedLocationsData = []locationSeed{
	{CitySlug: "danang", CityName: "Da Nang", RegionName: "Central Vietnam", Latitude: 16.054407, Longitude: 108.202167},
	{CitySlug: "nhatrang", CityName: "Nha Trang", RegionName: "Khanh Hoa", Latitude: 12.238791, Longitude: 109.196749},
	{CitySlug: "hcmc", CityName: "Ho Chi Minh City", RegionName: "Southern Vietnam", Latitude: 10.823099, Longitude: 106.629664},
	{CitySlug: "hoian", CityName: "Hoi An", RegionName: "Quang Nam", Latitude: 15.880058, Longitude: 108.338047},
	{CitySlug: "hanoi", CityName: "Hanoi", RegionName: "Northern Vietnam", Latitude: 21.027764, Longitude: 105.834160},
	{CitySlug: "phuquoc", CityName: "Phu Quoc", RegionName: "Kien Giang", Latitude: 10.289879, Longitude: 103.984020},
}

var seedScrapeSourcesData = []scrapeSourceSeed{
	{
		CitySlug:        "danang",
		Name:            "Da Nang apartments fresh",
		BaseURL:         "https://www.facebook.com/marketplace/danang/apartments-for-rent/",
		Category:        "apartments-for-rent",
		Query:           strPtr("apartment"),
		MinPrice:        intPtr(500),
		MaxPrice:        intPtr(2000),
		MinBedrooms:     intPtr(1),
		MaxBedrooms:     intPtr(3),
		RadiusKM:        intPtr(40),
		SortBy:          "creation_time_descend",
		DaysSinceListed: intPtr(7),
		Params:          `{"exact": false}`,
		Enabled:         true,
	},
	{
		CitySlug:        "danang",
		Name:            "Da Nang villas fresh",
		BaseURL:         "https://www.facebook.com/marketplace/danang/propertyrentals/",
		Category:        "propertyrentals",
		Query:           strPtr("villa"),
		MinPrice:        intPtr(800),
		MaxPrice:        intPtr(3500),
		RadiusKM:        intPtr(45),
		SortBy:          "creation_time_descend",
		DaysSinceListed: intPtr(7),
		Params:          `{"exact": false, "propertyType": "house"}`,
		Enabled:         true,
	},
	{
		CitySlug:        "nhatrang",
		Name:            "Nha Trang rentals fresh",
		BaseURL:         "https://www.facebook.com/marketplace/nhatrang/propertyrentals/",
		Category:        "propertyrentals",
		Query:           strPtr("apartment"),
		MinPrice:        intPtr(400),
		MaxPrice:        intPtr(1800),
		MinBedrooms:     intPtr(1),
		MaxBedrooms:     intPtr(3),
		RadiusKM:        intPtr(35),
		SortBy:          "creation_time_descend",
		DaysSinceListed: intPtr(10),
		Params:          `{"exact": false}`,
		Enabled:         true,
	},
	{
		CitySlug:        "hcmc",
		Name:            "Ho Chi Minh City apartments",
		BaseURL:         "https://www.facebook.com/marketplace/hochiminhcity/apartments-for-rent/",
		Category:        "apartments-for-rent",
		Query:           strPtr("apartment"),
		MinPrice:        intPtr(600),
		MaxPrice:        intPtr(2500),
		MinBedrooms:     intPtr(1),
		MaxBedrooms:     intPtr(3),
		RadiusKM:        intPtr(30),
		SortBy:          "creation_time_descend",
		DaysSinceListed: intPtr(7),
		Params:          `{"exact": false}`,
		Enabled:         true,
	},
	{
		CitySlug:        "hanoi",
		Name:            "Hanoi rentals fresh",
		BaseURL:         "https://www.facebook.com/marketplace/hanoi/propertyrentals/",
		Category:        "propertyrentals",
		Query:           strPtr("apartment"),
		MinPrice:        intPtr(500),
		MaxPrice:        intPtr(2200),
		MinBedrooms:     intPtr(1),
		MaxBedrooms:     intPtr(3),
		RadiusKM:        intPtr(35),
		SortBy:          "creation_time_descend",
		DaysSinceListed: intPtr(7),
		Params:          `{"exact": false}`,
		Enabled:         true,
	},
}

var seedListings = []Listing{
	{
		ID:          "dn-mykhe-condo",
		Title:       "Светлый кондо у My Khe",
		Area:        "An Thuong, Da Nang",
		City:        "danang",
		Type:        "apartment",
		Price:       920,
		Score:       92,
		Source:      "FB Marketplace",
		Fresh:       "сегодня",
		Specs:       []string{"2 спальни", "72 м²", "7 мин море"},
		Details:     []string{"депозит 1 мес", "контракт от 3 мес", "12 этаж", "заезд сейчас"},
		Tags:        []string{"бассейн", "спортзал", "балкон", "pet ok"},
		About:       "Уютный апартамент в районе An Thuong: много света, рабочий стол у окна, быстрый Wi-Fi и кухня для нормальной жизни, а не только завтраков.",
		Contact:     Contact{Name: "Linh Tran", Line: "+84 93 822 1044 · владелец", Value: "+84938221044"},
		FBURL:       "https://www.facebook.com/marketplace/",
		Photos:      []string{"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=82"},
		PetFriendly: true,
	},
	{
		ID:          "dn-sontra-villa",
		Title:       "Тихая вилла с садом в Son Tra",
		Area:        "Son Tra, Da Nang",
		City:        "danang",
		Type:        "villa",
		Price:       1650,
		Score:       88,
		Source:      "FB Marketplace",
		Fresh:       "2 часа назад",
		Specs:       []string{"3 спальни", "180 м²", "сад"},
		Details:     []string{"депозит 2 мес", "контракт от 6 мес", "2 этажа", "парковка"},
		Tags:        []string{"частный двор", "ванна", "pet ok", "тихо"},
		About:       "Дом в спокойной улице рядом с Son Tra. Много места для гостей, отдельная зона под кабинет и небольшой сад для вечерних посиделок.",
		Contact:     Contact{Name: "Minh Homes", Line: "+84 90 533 7711 · агент", Value: "+84905337711"},
		FBURL:       "https://www.facebook.com/marketplace/",
		Photos:      []string{"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=82"},
		PetFriendly: true,
	},
	{
		ID:          "nt-seaview-studio",
		Title:       "Sea view студия в центре",
		Area:        "Loc Tho, Nha Trang",
		City:        "nhatrang",
		Type:        "apartment",
		Price:       680,
		Score:       84,
		Source:      "FB Marketplace",
		Fresh:       "вчера",
		Specs:       []string{"студия", "42 м²", "вид море"},
		Details:     []string{"депозит 1 мес", "контракт от 1 мес", "24 этаж", "ресепшн"},
		Tags:        []string{"sea view", "центр", "уборка", "кондиционер"},
		About:       "Компактная студия для одного человека: панорамное окно, отдельный рабочий угол и все рядом пешком. Хорошо для первого месяца в городе.",
		Contact:     Contact{Name: "Anna Rentals", Line: "Messenger · агент", Value: "Anna Rentals"},
		FBURL:       "https://www.facebook.com/marketplace/",
		Photos:      []string{"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=82"},
		PetFriendly: false,
	},
	{
		ID:          "hcm-thaodien-loft",
		Title:       "Лофт с рабочей зоной",
		Area:        "Thao Dien, Ho Chi Minh City",
		City:        "hcmc",
		Type:        "apartment",
		Price:       1180,
		Score:       81,
		Source:      "FB Marketplace",
		Fresh:       "сегодня",
		Specs:       []string{"1 спальня", "64 м²", "кафе рядом"},
		Details:     []string{"депозит 1 мес", "контракт от 3 мес", "8 этаж", "заезд 10 июля"},
		Tags:        []string{"рабочий стол", "охрана", "прачечная", "кофейни"},
		About:       "Современный лофт в районе с кафе, сервисами и комьюнити. Внутри спокойно, достаточно розеток и нормальный свет для созвонов.",
		Contact:     Contact{Name: "Saigon Living", Line: "+84 77 120 8810 · агентство", Value: "+84771208810"},
		FBURL:       "https://www.facebook.com/marketplace/",
		Photos:      []string{"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=82"},
		PetFriendly: false,
	},
	{
		ID:          "hoian-garden-house",
		Title:       "Дом у рисовых полей",
		Area:        "Cam Chau, Hoi An",
		City:        "hoian",
		Type:        "villa",
		Price:       1250,
		Score:       90,
		Source:      "FB Marketplace",
		Fresh:       "3 часа назад",
		Specs:       []string{"2 спальни", "120 м²", "терраса"},
		Details:     []string{"депозит 1 мес", "контракт от 3 мес", "1 этаж", "заезд 5 июля"},
		Tags:        []string{"терраса", "кухня", "велосипеды", "тихий район"},
		About:       "Небольшой дом между старым городом и пляжем. Очень спокойный вайб, много зелени, есть терраса для ужинов и место под рабочий стол.",
		Contact:     Contact{Name: "Hanh Nguyen", Line: "+84 91 402 7788 · владелец", Value: "+84914027788"},
		FBURL:       "https://www.facebook.com/marketplace/",
		Photos:      []string{"https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=1200&q=82"},
		PetFriendly: true,
	},
	{
		ID:          "nt-family-apart",
		Title:       "Семейный апарт у Hon Chong",
		Area:        "Hon Chong, Nha Trang",
		City:        "nhatrang",
		Type:        "apartment",
		Price:       860,
		Score:       86,
		Source:      "FB Marketplace",
		Fresh:       "сегодня",
		Specs:       []string{"2 спальни", "78 м²", "детская"},
		Details:     []string{"депозит 1 мес", "контракт от 2 мес", "15 этаж", "бассейн"},
		Tags:        []string{"детская", "кухня", "море рядом", "pet ok"},
		About:       "Практичный апартамент для семьи: две отдельные спальни, хороший холодильник, закрытая территория и быстрый выход к набережной.",
		Contact:     Contact{Name: "Blue Coast Homes", Line: "Messenger · агент", Value: "Blue Coast Homes"},
		FBURL:       "https://www.facebook.com/marketplace/",
		Photos:      []string{"https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1617103996702-96ff29b1c467?auto=format&fit=crop&w=1200&q=82", "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=82"},
		PetFriendly: true,
	},
}
