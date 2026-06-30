package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const vndPerUSD = 25000
const batchSize = 50

type item struct {
	ExternalID string          `json:"external_id"`
	City       string          `json:"city"`
	Source     string          `json:"source"`
	RunID      string          `json:"run_id"`
	Title      string          `json:"title"`
	Price      string          `json:"price"`
	Location   string          `json:"location"`
	URL        string          `json:"url"`
	Media      []media         `json:"media"`
	Raw        json.RawMessage `json:"raw"`
}

type media struct {
	Kind        string `json:"kind"`
	SourceURL   string `json:"source_url"`
	LocalPath   string `json:"local_path"`
	Bytes       int64  `json:"bytes"`
	Checksum    string `json:"checksum"`
	ContentType string `json:"content_type"`
}

type listing struct {
	ID              string
	ExternalID      string
	RunID           string
	Title           string
	Area            string
	City            string
	HomeType        string
	PropertyType    string
	PriceUSD        int
	MatchScore      int
	Source          string
	Fresh           string
	Specs           []string
	Details         []string
	Tags            []string
	About           string
	ContactName     string
	ContactLine     string
	ContactValue    string
	FBURL           string
	SourceURL       string
	Photos          []string
	PetFriendly     bool
	Amenities       []string
	Normalized      []byte
	Raw             []byte
	RawHash         string
	Bedrooms        *float64
	Bathrooms       *float64
	Furnished       *bool
	HasPool         *bool
	HasGym          *bool
	HasBalcony      *bool
	HasParking      *bool
	HasSecurity     *bool
	StorageBySource map[string]string
	ChecksumByURL   map[string]string
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "import failed: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		return errors.New("DATABASE_URL is required")
	}
	if len(os.Args) != 2 {
		return errors.New("usage: go run ./scripts/import_apify_dataset.go <items.normalized.json>")
	}

	path := os.Args[1]
	payload, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var items []item
	if err := json.Unmarshal(payload, &items); err != nil {
		return err
	}

	listings, skipped, err := buildListings(items)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	var before int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM listings WHERE source = 'Facebook Marketplace'`).Scan(&before); err != nil {
		return err
	}

	imported, err := importListings(ctx, pool, listings)
	if err != nil {
		return err
	}

	var after int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM listings WHERE source = 'Facebook Marketplace'`).Scan(&after); err != nil {
		return err
	}

	fmt.Printf("dataset=%s\n", filepath.Clean(path))
	fmt.Printf("input=%d importable=%d skipped=%d upserted=%d fbm_before=%d fbm_after=%d\n", len(items), len(listings), skipped, imported, before, after)
	return nil
}

func buildListings(items []item) ([]listing, int, error) {
	listings := make([]listing, 0, len(items))
	skipped := 0
	for _, it := range items {
		next, ok, err := normalizeItem(it)
		if err != nil {
			return nil, 0, err
		}
		if !ok {
			skipped++
			continue
		}
		listings = append(listings, next)
	}
	return listings, skipped, nil
}

func normalizeItem(it item) (listing, bool, error) {
	id := strings.TrimSpace(it.ExternalID)
	title := cleanText(it.Title)
	url := strings.TrimSpace(it.URL)
	if id == "" || title == "" || url == "" {
		return listing{}, false, nil
	}

	priceUSD, ok := parsePriceUSD(it.Price)
	if !ok || priceUSD < 120 || priceUSD > 6000 {
		return listing{}, false, nil
	}

	raw := []byte(it.Raw)
	if len(raw) == 0 || string(raw) == "null" {
		raw = []byte("{}")
	}
	hash := sha256.Sum256(raw)

	homeType := inferHomeType(it)
	bedrooms, bathrooms := parseBedsBaths(string(raw) + " " + title)
	tags, amenities := inferTags(title, it.Location, it.Source)
	photos, storage, checksums := normalizeMedia(it.Media)
	if len(photos) == 0 {
		return listing{}, false, nil
	}

	furnished := boolPtr(hasAny(title, "furnished", "fully furnished", "меблир", "furniture"))
	hasPool := boolPtr(hasAny(title, "pool", "swimming"))
	hasGym := boolPtr(hasAny(title, "gym", "fitness"))
	hasBalcony := boolPtr(hasAny(title, "balcony"))
	hasParking := boolPtr(hasAny(title, "parking", "bike"))
	hasSecurity := boolPtr(hasAny(title, "security", "guard"))

	specs := []string{fmt.Sprintf("$%d/mo", priceUSD)}
	if bedrooms != nil {
		specs = append(specs, trimNumber(*bedrooms)+" bed")
	}
	if bathrooms != nil {
		specs = append(specs, trimNumber(*bathrooms)+" bath")
	}
	specs = append(specs, cityLabel(it.City))

	details := []string{"Facebook Marketplace", "Seen in latest Apify import"}
	if cleanText(it.Location) != "" {
		details = append(details, cleanText(it.Location))
	}

	normalized := map[string]any{
		"external_id":         id,
		"source":              it.Source,
		"run_id":              it.RunID,
		"source_price":        it.Price,
		"price_usd":           priceUSD,
		"price_normalization": "vnd_marketplace_heuristic_2026_06_30",
		"location":            it.Location,
		"media":               it.Media,
	}
	normalizedJSON, err := json.Marshal(normalized)
	if err != nil {
		return listing{}, false, err
	}

	return listing{
		ID:              "fbm-" + id,
		ExternalID:      id,
		RunID:           it.RunID,
		Title:           title,
		Area:            areaLabel(it),
		City:            it.City,
		HomeType:        homeType,
		PropertyType:    homeType,
		PriceUSD:        priceUSD,
		MatchScore:      matchScore(priceUSD, photos, tags),
		Source:          "Facebook Marketplace",
		Fresh:           "seen today",
		Specs:           specs,
		Details:         details,
		Tags:            tags,
		About:           aboutText(it, priceUSD),
		ContactName:     "Facebook Marketplace",
		ContactLine:     "Open original listing",
		ContactValue:    url,
		FBURL:           url,
		SourceURL:       url,
		Photos:          photos,
		PetFriendly:     hasAny(title, "pet", "pets", "dog", "cat"),
		Amenities:       amenities,
		Normalized:      normalizedJSON,
		Raw:             raw,
		RawHash:         hex.EncodeToString(hash[:]),
		Bedrooms:        bedrooms,
		Bathrooms:       bathrooms,
		Furnished:       furnished,
		HasPool:         hasPool,
		HasGym:          hasGym,
		HasBalcony:      hasBalcony,
		HasParking:      hasParking,
		HasSecurity:     hasSecurity,
		StorageBySource: storage,
		ChecksumByURL:   checksums,
	}, true, nil
}

func parsePriceUSD(value string) (int, bool) {
	digits := regexp.MustCompile(`\d+`).FindAllString(value, -1)
	if len(digits) == 0 {
		return 0, false
	}
	joined := strings.Join(digits, "")
	amount, err := strconv.Atoi(joined)
	if err != nil || amount <= 0 {
		return 0, false
	}

	var usd float64
	switch {
	case amount >= 1_000_000:
		usd = float64(amount) / vndPerUSD
	case amount >= 5_000:
		usd = float64(amount*1000) / vndPerUSD
	case amount >= 100:
		usd = float64(amount)
	case amount >= 3:
		usd = float64(amount*1_000_000) / vndPerUSD
	default:
		return 0, false
	}
	return int(math.Round(usd)), true
}

func importListings(ctx context.Context, pool *pgxpool.Pool, listings []listing) (int, error) {
	imported := 0
	for start := 0; start < len(listings); start += batchSize {
		end := start + batchSize
		if end > len(listings) {
			end = len(listings)
		}

		tx, err := pool.Begin(ctx)
		if err != nil {
			return imported, err
		}

		for _, l := range listings[start:end] {
			_, err := tx.Exec(ctx, `
INSERT INTO listings (
  id, location_id, title, area, city, home_type, property_type, price_usd, match_score, source, fresh,
  specs, details, tags, about, contact_name, contact_line, contact_value,
  fb_url, source_url, photos, pet_friendly, amenities, normalized,
  listing_status, availability_status, price_currency, price_period,
  bedrooms, bathrooms, furnished, has_pool, has_gym, has_balcony, has_parking, has_security,
  last_seen_at, last_checked_at, updated_at
) VALUES (
  @id, (SELECT id FROM locations WHERE city_slug = @city), @title, @area, @city, @home_type, @property_type, @price_usd, @match_score, @source, @fresh,
  @specs, @details, @tags, @about, @contact_name, @contact_line, @contact_value,
  @fb_url, @source_url, @photos, @pet_friendly, @amenities, @normalized::jsonb,
  'active', 'available', 'USD', 'month',
  @bedrooms, @bathrooms, @furnished, @has_pool, @has_gym, @has_balcony, @has_parking, @has_security,
  now(), now(), now()
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
  normalized = excluded.normalized,
  listing_status = 'active',
  availability_status = 'available',
  price_currency = 'USD',
  price_period = 'month',
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  furnished = excluded.furnished,
  has_pool = excluded.has_pool,
  has_gym = excluded.has_gym,
  has_balcony = excluded.has_balcony,
  has_parking = excluded.has_parking,
  has_security = excluded.has_security,
  last_seen_at = now(),
  last_checked_at = now(),
  check_fail_count = 0,
  updated_at = now();
`, pgx.NamedArgs{
				"id":            l.ID,
				"city":          l.City,
				"title":         l.Title,
				"area":          l.Area,
				"home_type":     l.HomeType,
				"property_type": l.PropertyType,
				"price_usd":     l.PriceUSD,
				"match_score":   l.MatchScore,
				"source":        l.Source,
				"fresh":         l.Fresh,
				"specs":         l.Specs,
				"details":       l.Details,
				"tags":          l.Tags,
				"about":         l.About,
				"contact_name":  l.ContactName,
				"contact_line":  l.ContactLine,
				"contact_value": l.ContactValue,
				"fb_url":        l.FBURL,
				"source_url":    l.SourceURL,
				"photos":        l.Photos,
				"pet_friendly":  l.PetFriendly,
				"amenities":     l.Amenities,
				"normalized":    string(l.Normalized),
				"bedrooms":      l.Bedrooms,
				"bathrooms":     l.Bathrooms,
				"furnished":     l.Furnished,
				"has_pool":      l.HasPool,
				"has_gym":       l.HasGym,
				"has_balcony":   l.HasBalcony,
				"has_parking":   l.HasParking,
				"has_security":  l.HasSecurity,
			})
			if err != nil {
				tx.Rollback(ctx)
				return imported, fmt.Errorf("upsert listing %s: %w", l.ID, err)
			}

			if err := importChildren(ctx, tx, l); err != nil {
				tx.Rollback(ctx)
				return imported, err
			}
		}

		if err := tx.Commit(ctx); err != nil {
			return imported, err
		}
		imported += end - start
		fmt.Printf("committed %d/%d\n", imported, len(listings))
	}
	return imported, nil
}

func importChildren(ctx context.Context, tx pgx.Tx, l listing) error {
	for position, photo := range l.Photos {
		_, err := tx.Exec(ctx, `
INSERT INTO listing_photos (listing_id, position, source_url, storage_url, checksum, is_primary)
VALUES (@listing_id, @position, @source_url, @storage_url, @checksum, @is_primary)
ON CONFLICT (listing_id, position) DO UPDATE SET
  source_url = excluded.source_url,
  storage_url = excluded.storage_url,
  checksum = excluded.checksum,
  is_primary = excluded.is_primary;
`, pgx.NamedArgs{
			"listing_id":  l.ID,
			"position":    position,
			"source_url":  photo,
			"storage_url": l.StorageBySource[photo],
			"checksum":    l.ChecksumByURL[photo],
			"is_primary":  position == 0,
		})
		if err != nil {
			return fmt.Errorf("upsert photo %s:%d: %w", l.ID, position, err)
		}
	}

	_, err := tx.Exec(ctx, `
INSERT INTO listing_contacts (listing_id, contact_type, name, messenger_url, facebook_profile_url, raw_contact)
SELECT @listing_id, 'facebook_marketplace', @name, @url, @url, @raw_contact
WHERE NOT EXISTS (
  SELECT 1 FROM listing_contacts WHERE listing_id = @listing_id AND raw_contact = @raw_contact
);
`, pgx.NamedArgs{
		"listing_id":  l.ID,
		"name":        l.ContactName,
		"url":         l.FBURL,
		"raw_contact": l.ContactLine + ": " + l.ContactValue,
	})
	if err != nil {
		return fmt.Errorf("upsert contact %s: %w", l.ID, err)
	}

	_, err = tx.Exec(ctx, `
INSERT INTO listing_price_history (listing_id, price_amount, price_currency, price_period, observed_at)
SELECT @listing_id, @price_amount, 'USD', 'month', now()
WHERE NOT EXISTS (
  SELECT 1 FROM listing_price_history
  WHERE listing_id = @listing_id AND price_amount = @price_amount AND observed_at > now() - interval '1 day'
);
`, pgx.NamedArgs{"listing_id": l.ID, "price_amount": l.PriceUSD})
	if err != nil {
		return fmt.Errorf("insert price history %s: %w", l.ID, err)
	}

	_, err = tx.Exec(ctx, `
INSERT INTO listing_availability_checks (listing_id, status, source_url, evidence)
SELECT @listing_id, 'seen', @source_url, @evidence::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM listing_availability_checks
  WHERE listing_id = @listing_id AND status = 'seen' AND checked_at > now() - interval '1 day'
);
	`, pgx.NamedArgs{
		"listing_id": l.ID,
		"source_url": l.FBURL,
		"evidence":   fmt.Sprintf(`{"apify_import":true,"run_id":%q}`, l.RunID),
	})
	if err != nil {
		return fmt.Errorf("insert availability %s: %w", l.ID, err)
	}

	_, err = tx.Exec(ctx, `
INSERT INTO raw_marketplace_items (listing_id, source, external_id, source_url, raw, raw_hash)
VALUES (@listing_id, 'facebook_marketplace', @external_id, @source_url, @raw::jsonb, @raw_hash)
ON CONFLICT (source, external_id) DO UPDATE SET
  listing_id = excluded.listing_id,
  source_url = excluded.source_url,
  raw = excluded.raw,
  raw_hash = excluded.raw_hash,
  scraped_at = now();
`, pgx.NamedArgs{
		"listing_id":  l.ID,
		"external_id": l.ExternalID,
		"source_url":  l.FBURL,
		"raw":         string(l.Raw),
		"raw_hash":    l.RawHash,
	})
	if err != nil {
		return fmt.Errorf("upsert raw %s: %w", l.ID, err)
	}

	return nil
}

func normalizeMedia(mediaItems []media) ([]string, map[string]string, map[string]string) {
	photos := []string{}
	storage := map[string]string{}
	checksums := map[string]string{}
	for _, m := range mediaItems {
		if m.SourceURL == "" || !strings.HasPrefix(m.Kind, "photo") && m.Kind != "image" {
			continue
		}
		if slices.Contains(photos, m.SourceURL) {
			continue
		}
		photos = append(photos, m.SourceURL)
		if m.LocalPath != "" {
			storage[m.SourceURL] = m.LocalPath
		}
		if m.Checksum != "" {
			checksums[m.SourceURL] = m.Checksum
		}
	}
	return photos, storage, checksums
}

func parseBedsBaths(text string) (*float64, *float64) {
	lower := strings.ToLower(text)
	return firstNumber(lower, `(\d+(?:\.\d+)?)\s*(?:bed|br|bedroom)`), firstNumber(lower, `(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)`)
}

func firstNumber(text, pattern string) *float64 {
	match := regexp.MustCompile(pattern).FindStringSubmatch(text)
	if len(match) < 2 {
		return nil
	}
	value, err := strconv.ParseFloat(match[1], 64)
	if err != nil {
		return nil
	}
	if value <= 0 || value > 20 {
		return nil
	}
	return &value
}

func inferHomeType(it item) string {
	text := strings.ToLower(it.Source + " " + it.Title)
	if hasAny(text, "villa", "house", "home") {
		return "villa"
	}
	return "apartment"
}

func inferTags(title, location, source string) ([]string, []string) {
	text := strings.ToLower(title + " " + location + " " + source)
	tags := []string{"facebook"}
	amenities := []string{}
	add := func(label string, needles ...string) {
		if hasAny(text, needles...) {
			tags = append(tags, label)
			amenities = append(amenities, label)
		}
	}
	add("pool", "pool", "swimming")
	add("gym", "gym", "fitness")
	add("balcony", "balcony")
	add("parking", "parking", "bike")
	add("security", "security", "guard")
	add("furnished", "furnished", "fully furnished")
	add("sea view", "sea view", "seaview", "beach", "ocean")
	add("serviced", "serviced")
	add("studio", "studio")
	add("pet friendly", "pet", "pets")
	return compact(tags), compact(amenities)
}

func matchScore(price int, photos []string, tags []string) int {
	score := 70
	if len(photos) > 0 {
		score += 10
	}
	if price >= 300 && price <= 1800 {
		score += 8
	}
	if len(tags) >= 3 {
		score += 5
	}
	if score > 98 {
		score = 98
	}
	return score
}

func aboutText(it item, priceUSD int) string {
	parts := []string{cleanText(it.Title)}
	if it.Location != "" {
		parts = append(parts, cleanText(it.Location))
	}
	parts = append(parts, fmt.Sprintf("Imported from Facebook Marketplace via Apify. Normalized monthly price: about $%d.", priceUSD))
	return strings.Join(parts, "\n\n")
}

func areaLabel(it item) string {
	if it.Location != "" {
		return cleanText(it.Location)
	}
	return cityLabel(it.City)
}

func cityLabel(city string) string {
	switch city {
	case "danang":
		return "Da Nang"
	case "hcmc":
		return "Ho Chi Minh City"
	case "hoian":
		return "Hoi An"
	case "nhatrang":
		return "Nha Trang"
	case "phuquoc":
		return "Phu Quoc"
	default:
		return city
	}
}

func cleanText(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
}

func hasAny(text string, needles ...string) bool {
	lower := strings.ToLower(text)
	for _, needle := range needles {
		if strings.Contains(lower, strings.ToLower(needle)) {
			return true
		}
	}
	return false
}

func compact(values []string) []string {
	result := []string{}
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" && !slices.Contains(result, value) {
			result = append(result, value)
		}
	}
	return result
}

func trimNumber(value float64) string {
	if value == math.Trunc(value) {
		return strconv.Itoa(int(value))
	}
	return strconv.FormatFloat(value, 'f', 1, 64)
}

func boolPtr(value bool) *bool {
	return &value
}
