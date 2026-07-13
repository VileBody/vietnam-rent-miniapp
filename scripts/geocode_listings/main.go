package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const schemaSQL = `
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source_latitude numeric(10,7);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source_longitude numeric(10,7);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_city text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_district text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_ward text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_street text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_house_number text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_building text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_landmark text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_address_text text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_query text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_precision text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_confidence numeric(4,3);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_extracted jsonb NOT NULL DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geocoded_latitude numeric(10,7);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geocoded_longitude numeric(10,7);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geocoder_provider text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geocoder_place_id text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geocoder_display_name text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geocoder_raw jsonb NOT NULL DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geocode_distance_m int;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geocoding_status text NOT NULL DEFAULT 'pending';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geocoding_error text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

UPDATE listings
SET source_latitude = latitude,
    source_longitude = longitude
WHERE source_latitude IS NULL
  AND source_longitude IS NULL
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_geocoding_status
  ON listings (geocoding_status, geocoded_at);

CREATE TABLE IF NOT EXISTS geocoding_cache (
  provider text NOT NULL,
  query text NOT NULL,
  country_code text NOT NULL DEFAULT 'vn',
  response jsonb NOT NULL DEFAULT '[]',
  result_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, query, country_code)
);`

type config struct {
	DatabaseURL      string
	OpenRouterKey    string
	Model            string
	NominatimBaseURL string
	NominatimAgent   string
	BatchSize        int
	Limit            int
	ListingID        string
	Force            bool
	DryRun           bool
	NominatimDelay   time.Duration
}

type listing struct {
	ID         string
	Title      string
	About      string
	Area       string
	City       string
	Details    []string
	Tags       []string
	Normalized json.RawMessage
	Raw        json.RawMessage
	SourceLat  *float64
	SourceLon  *float64
}

type extractedLocation struct {
	ID              string   `json:"id"`
	Country         string   `json:"country"`
	City            string   `json:"city"`
	District        string   `json:"district"`
	Ward            string   `json:"ward"`
	Street          string   `json:"street"`
	HouseNumber     string   `json:"house_number"`
	Building        string   `json:"building"`
	Landmark        string   `json:"landmark"`
	AddressText     string   `json:"address_text"`
	Precision       string   `json:"precision"`
	Confidence      float64  `json:"confidence"`
	QueryCandidates []string `json:"query_candidates"`
}

type nominatimResult struct {
	PlaceID     int64             `json:"place_id"`
	OSMType     string            `json:"osm_type"`
	OSMID       int64             `json:"osm_id"`
	Latitude    string            `json:"lat"`
	Longitude   string            `json:"lon"`
	DisplayName string            `json:"display_name"`
	Category    string            `json:"category"`
	Type        string            `json:"type"`
	Importance  float64           `json:"importance"`
	Address     map[string]string `json:"address"`
}

type geocodeMatch struct {
	Result    nominatimResult
	Query     string
	Latitude  float64
	Longitude float64
	DistanceM *int
	Status    string
}

type nominatimClient struct {
	db          *pgxpool.Pool
	httpClient  *http.Client
	baseURL     string
	userAgent   string
	delay       time.Duration
	lastRequest time.Time
}

func main() {
	cfg, err := parseConfig()
	if err != nil {
		log.Fatal(err)
	}
	ctx := context.Background()
	db, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err := db.Ping(ctx); err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	if _, err := db.Exec(ctx, schemaSQL); err != nil {
		log.Fatalf("ensure geocoding schema: %v", err)
	}

	items, err := loadListings(ctx, db, cfg)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("pending listings=%d model=%s dry_run=%t", len(items), cfg.Model, cfg.DryRun)
	if len(items) == 0 {
		return
	}

	nominatim := &nominatimClient{
		db:         db,
		httpClient: &http.Client{Timeout: 45 * time.Second},
		baseURL:    strings.TrimRight(cfg.NominatimBaseURL, "/"),
		userAgent:  cfg.NominatimAgent,
		delay:      cfg.NominatimDelay,
	}

	processed, matched, failed := 0, 0, 0
	for start := 0; start < len(items); start += cfg.BatchSize {
		end := min(start+cfg.BatchSize, len(items))
		batch := items[start:end]
		extracted, err := extractBatch(ctx, cfg, batch)
		if err != nil {
			log.Printf("batch %d extraction failed: %v; retrying one by one", start/cfg.BatchSize+1, err)
			extracted = make(map[string]extractedLocation, len(batch))
			for _, item := range batch {
				one, oneErr := extractBatch(ctx, cfg, []listing{item})
				if oneErr != nil {
					failed++
					if !cfg.DryRun {
						_ = saveFailure(ctx, db, item.ID, "extraction_failed", oneErr)
					}
					log.Printf("listing=%s extraction failed: %v", item.ID, oneErr)
					continue
				}
				extracted[item.ID] = one[item.ID]
			}
		}

		for _, item := range batch {
			location, ok := extracted[item.ID]
			if !ok {
				continue
			}
			match, matchErr := geocodeListing(ctx, nominatim, item, location)
			if matchErr != nil {
				failFastIfDatabaseUnavailable(ctx, db, matchErr)
				failed++
				if !cfg.DryRun {
					_ = saveGeocodingFailure(ctx, db, item, location, matchErr)
				}
				log.Printf("listing=%s geocoding failed: %v", item.ID, matchErr)
				continue
			}
			processed++
			if match != nil {
				matched++
			}
			if cfg.DryRun {
				logDryRun(item, location, match)
				continue
			}
			if err := saveResult(ctx, db, item, location, match, cfg.Model); err != nil {
				failFastIfDatabaseUnavailable(ctx, db, err)
				failed++
				log.Printf("listing=%s save failed: %v", item.ID, err)
				continue
			}
			if match == nil {
				log.Printf("listing=%s no OSM match precision=%s confidence=%.2f", item.ID, location.Precision, location.Confidence)
			} else {
				distance := "n/a"
				if match.DistanceM != nil {
					distance = strconv.Itoa(*match.DistanceM) + "m"
				}
				log.Printf("listing=%s status=%s query=%q distance=%s", item.ID, match.Status, match.Query, distance)
			}
		}
	}
	log.Printf("done processed=%d matched=%d failed=%d", processed, matched, failed)
}

func failFastIfDatabaseUnavailable(ctx context.Context, db *pgxpool.Pool, cause error) {
	if err := db.Ping(ctx); err != nil {
		log.Fatalf("database connection lost after %v: %v", cause, err)
	}
}

func parseConfig() (config, error) {
	var cfg config
	flag.IntVar(&cfg.Limit, "limit", 0, "maximum listings to process; 0 means all")
	flag.IntVar(&cfg.BatchSize, "batch-size", 6, "listings per OpenRouter request")
	flag.StringVar(&cfg.ListingID, "listing-id", "", "process one listing id")
	flag.BoolVar(&cfg.Force, "force", false, "reprocess completed listings")
	flag.BoolVar(&cfg.DryRun, "dry-run", false, "call providers but do not update listings")
	flag.DurationVar(&cfg.NominatimDelay, "nominatim-delay", 1100*time.Millisecond, "minimum delay between uncached Nominatim calls")
	flag.Parse()

	cfg.DatabaseURL = strings.TrimSpace(os.Getenv("DATABASE_URL"))
	cfg.OpenRouterKey = strings.TrimSpace(os.Getenv("OPENROUTER_API_KEY"))
	cfg.Model = envOr("OPENROUTER_GEOCODING_MODEL", "google/gemini-2.5-flash")
	cfg.NominatimBaseURL = envOr("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org")
	cfg.NominatimAgent = envOr("NOMINATIM_USER_AGENT", "VietNest/1.0 (+https://vietnam.teamgenius.ru/)")
	if cfg.DatabaseURL == "" {
		return cfg, errors.New("DATABASE_URL is required")
	}
	if cfg.OpenRouterKey == "" {
		return cfg, errors.New("OPENROUTER_API_KEY is required")
	}
	if cfg.BatchSize < 1 || cfg.BatchSize > 12 {
		return cfg, errors.New("batch-size must be between 1 and 12")
	}
	if cfg.NominatimDelay < time.Second {
		return cfg, errors.New("nominatim-delay must be at least 1s for the public service")
	}
	return cfg, nil
}

func envOr(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func loadListings(ctx context.Context, db *pgxpool.Pool, cfg config) ([]listing, error) {
	rows, err := db.Query(ctx, `
SELECT
  l.id,
  l.title,
  l.about,
  l.area,
  l.city,
  l.details,
  l.tags,
  l.normalized,
  coalesce(raw_item.raw, '{}'::jsonb),
  coalesce(l.source_latitude, l.latitude)::float8,
  coalesce(l.source_longitude, l.longitude)::float8
FROM listings l
LEFT JOIN LATERAL (
  SELECT raw
  FROM raw_marketplace_items r
  WHERE r.listing_id = l.id
  ORDER BY r.scraped_at DESC
  LIMIT 1
) raw_item ON true
WHERE ($1 = '' OR l.id = $1)
  AND ($2 OR l.geocoded_at IS NULL)
ORDER BY l.id
LIMIT CASE WHEN $3 > 0 THEN $3 ELSE 2147483647 END`, cfg.ListingID, cfg.Force, cfg.Limit)
	if err != nil {
		return nil, fmt.Errorf("query listings: %w", err)
	}
	defer rows.Close()
	items := make([]listing, 0)
	for rows.Next() {
		var item listing
		if err := rows.Scan(
			&item.ID, &item.Title, &item.About, &item.Area, &item.City,
			&item.Details, &item.Tags, &item.Normalized, &item.Raw,
			&item.SourceLat, &item.SourceLon,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func extractBatch(ctx context.Context, cfg config, items []listing) (map[string]extractedLocation, error) {
	payloadItems := make([]map[string]any, 0, len(items))
	for _, item := range items {
		payloadItems = append(payloadItems, map[string]any{
			"id":           item.ID,
			"title":        item.Title,
			"description":  item.About,
			"app_area":     item.Area,
			"app_city":     item.City,
			"details":      item.Details,
			"tags":         item.Tags,
			"geo_metadata": geoMetadata(item),
		})
	}
	requestPayload := map[string]any{
		"model":       cfg.Model,
		"temperature": 0,
		"max_tokens":  6000,
		"response_format": map[string]string{
			"type": "json_object",
		},
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You extract Vietnamese rental listing locations. Return JSON only. Never invent an address. Prefer Vietnamese diacritics and canonical local place names. Distinguish the rented property address from nearby landmarks and areas mentioned only as proximity.",
			},
			{
				"role":    "user",
				"content": extractionPrompt(payloadItems),
			},
		},
	}
	body, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, err
	}

	var lastErr error
	for attempt := 1; attempt <= 4; attempt++ {
		request, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://openrouter.ai/api/v1/chat/completions", bytes.NewReader(body))
		if err != nil {
			return nil, err
		}
		request.Header.Set("Authorization", "Bearer "+cfg.OpenRouterKey)
		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("HTTP-Referer", "https://vietnam.teamgenius.ru/")
		request.Header.Set("X-OpenRouter-Title", "VietNest location enrichment")
		response, err := (&http.Client{Timeout: 180 * time.Second}).Do(request)
		if err == nil {
			responseBody, readErr := io.ReadAll(io.LimitReader(response.Body, 4<<20))
			response.Body.Close()
			if readErr != nil {
				lastErr = readErr
			} else if response.StatusCode >= 200 && response.StatusCode < 300 {
				return parseExtractionResponse(responseBody, items)
			} else {
				lastErr = fmt.Errorf("OpenRouter status=%d body=%s", response.StatusCode, truncate(string(responseBody), 800))
			}
		} else {
			lastErr = err
		}
		if attempt < 4 {
			time.Sleep(time.Duration(attempt) * 2 * time.Second)
		}
	}
	return nil, lastErr
}

func extractionPrompt(items []map[string]any) string {
	payload := map[string]any{
		"task": "Extract geographic names for forward geocoding with OpenStreetMap Nominatim.",
		"rules": []string{
			"Return one item for every input id and preserve ids exactly.",
			"Return exactly one flat location object per id; do not nest another locations array inside an item.",
			"Use empty strings for unknown fields; do not guess missing street, building, ward, or house number.",
			"confidence is 0..1 and precision is one of building, street, ward, district, city, unknown.",
			"query_candidates contains 1 to 4 Nominatim queries from most specific to broadest, each ending with Vietnam.",
			"Do not use a nearby place as the property address unless the text explicitly says the property is there.",
			"Prefer a singular explicit property address in the title over generic coverage lists or nearby districts in the description.",
		},
		"output_shape": map[string]any{
			"locations": []map[string]any{{
				"id": "same id", "country": "Vietnam", "city": "", "district": "", "ward": "",
				"street": "", "house_number": "", "building": "", "landmark": "",
				"address_text": "exact source fragment", "precision": "unknown", "confidence": 0.0,
				"query_candidates": []string{"street, district, city, Vietnam"},
			}},
		},
		"listings": items,
	}
	encoded, _ := json.Marshal(payload)
	return string(encoded)
}

func geoMetadata(item listing) map[string]any {
	result := map[string]any{}
	for label, raw := range map[string]json.RawMessage{"source": item.Raw, "normalized": item.Normalized} {
		var value any
		if len(raw) == 0 || json.Unmarshal(raw, &value) != nil {
			continue
		}
		selected := map[string]any{}
		collectGeoFields(value, "", selected, 0)
		if len(selected) > 0 {
			result[label] = selected
		}
	}
	if item.SourceLat != nil && item.SourceLon != nil {
		result["source_coordinates"] = map[string]float64{"latitude": *item.SourceLat, "longitude": *item.SourceLon}
	}
	return result
}

func collectGeoFields(value any, path string, output map[string]any, depth int) {
	if depth > 6 || len(output) >= 60 {
		return
	}
	switch typed := value.(type) {
	case map[string]any:
		for key, child := range typed {
			keyLower := strings.ToLower(key)
			childPath := key
			if path != "" {
				childPath = path + "." + key
			}
			if isGeoKey(keyLower) {
				switch child.(type) {
				case string, float64, bool, nil:
					output[childPath] = child
				default:
					collectGeoFields(child, childPath, output, depth+1)
				}
				continue
			}
			collectGeoFields(child, childPath, output, depth+1)
		}
	case []any:
		for index, child := range typed {
			if index >= 8 {
				break
			}
			collectGeoFields(child, fmt.Sprintf("%s[%d]", path, index), output, depth+1)
		}
	}
}

func isGeoKey(key string) bool {
	for _, fragment := range []string{"location", "address", "city", "district", "ward", "street", "road", "suburb", "neigh", "latitude", "longitude", "postal"} {
		if strings.Contains(key, fragment) {
			return true
		}
	}
	return false
}

func parseExtractionResponse(body []byte, expected []listing) (map[string]extractedLocation, error) {
	var response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}
	if len(response.Choices) == 0 {
		return nil, errors.New("OpenRouter returned no choices")
	}
	content := strings.TrimSpace(response.Choices[0].Message.Content)
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)
	locations, err := decodeExtractedLocations(content)
	if err != nil {
		return nil, err
	}
	allowed := make(map[string]bool, len(expected))
	for _, item := range expected {
		allowed[item.ID] = true
	}
	result := make(map[string]extractedLocation, len(locations))
	for _, location := range locations {
		if !allowed[location.ID] {
			return nil, fmt.Errorf("unexpected listing id %q", location.ID)
		}
		if location.City == "" && location.District == "" && location.Ward == "" && location.Street == "" && location.Building == "" && len(location.QueryCandidates) == 0 {
			return nil, fmt.Errorf("model returned an empty location: %s", truncate(content, 1600))
		}
		location.Confidence = max(0, min(location.Confidence, 1))
		location.Precision = normalizePrecision(location.Precision)
		if len(location.QueryCandidates) > 4 {
			location.QueryCandidates = location.QueryCandidates[:4]
		}
		result[location.ID] = location
	}
	if len(result) != len(expected) {
		return nil, fmt.Errorf("expected %d extracted locations, got %d", len(expected), len(result))
	}
	return result, nil
}

func decodeExtractedLocations(content string) ([]extractedLocation, error) {
	var rawItems []json.RawMessage
	if strings.HasPrefix(content, "[") {
		if err := json.Unmarshal([]byte(content), &rawItems); err != nil {
			return nil, fmt.Errorf("decode model JSON array: %w", err)
		}
	} else {
		var envelope struct {
			Locations []json.RawMessage `json:"locations"`
		}
		if err := json.Unmarshal([]byte(content), &envelope); err != nil {
			return nil, fmt.Errorf("decode model JSON object: %w", err)
		}
		rawItems = envelope.Locations
	}

	locations := make([]extractedLocation, 0, len(rawItems))
	for _, raw := range rawItems {
		var direct extractedLocation
		if err := json.Unmarshal(raw, &direct); err != nil {
			return nil, fmt.Errorf("decode location item: %w", err)
		}
		var wrapper struct {
			ID        string              `json:"id"`
			Locations []extractedLocation `json:"locations"`
		}
		if err := json.Unmarshal(raw, &wrapper); err != nil {
			return nil, fmt.Errorf("decode location wrapper: %w", err)
		}
		if len(wrapper.Locations) > 0 {
			direct = wrapper.Locations[0]
			if direct.ID == "" {
				direct.ID = wrapper.ID
			}
		}
		locations = append(locations, direct)
	}
	return locations, nil
}

func geocodeListing(ctx context.Context, client *nominatimClient, item listing, location extractedLocation) (*geocodeMatch, error) {
	queries := buildQueries(item, location)
	// Two focused forward attempts are enough when every source row already has a
	// marketplace pin. Reverse geocoding that pin is both faster and safer than
	// degrading through a long chain of increasingly broad place-name searches.
	if len(queries) > 2 {
		queries = queries[:2]
	}
	for _, query := range queries {
		results, err := client.search(ctx, query, item.SourceLat, item.SourceLon)
		if err != nil {
			return nil, err
		}
		match := selectCandidate(results, query, item.SourceLat, item.SourceLon)
		if match == nil {
			continue
		}
		if match.DistanceM != nil && *match.DistanceM > 15_000 {
			continue
		}
		match.Status = "matched"
		return match, nil
	}
	if item.SourceLat != nil && item.SourceLon != nil {
		result, query, err := client.reverse(ctx, *item.SourceLat, *item.SourceLon)
		if err != nil {
			return nil, err
		}
		if result != nil {
			lat, lon, err := coordinates(*result)
			if err != nil {
				return nil, err
			}
			distance := int(math.Round(haversineMeters(*item.SourceLat, *item.SourceLon, lat, lon)))
			return &geocodeMatch{Result: *result, Query: query, Latitude: lat, Longitude: lon, DistanceM: &distance, Status: "reverse_matched"}, nil
		}
	}
	return nil, nil
}

func buildQueries(item listing, location extractedLocation) []string {
	queries := append([]string{}, location.QueryCandidates...)
	specific := joinNonEmpty(location.HouseNumber, location.Street, location.Ward, location.District, location.City, "Vietnam")
	building := joinNonEmpty(location.Building, location.Street, location.District, location.City, "Vietnam")
	street := joinNonEmpty(location.Street, location.District, location.City, "Vietnam")
	ward := joinNonEmpty(location.Ward, location.District, location.City, "Vietnam")
	district := joinNonEmpty(location.District, location.City, "Vietnam")
	appFallback := joinNonEmpty(item.Area, item.City, "Vietnam")
	queries = append(queries, specific, building, street, ward, district, appFallback)

	seen := map[string]bool{}
	cleaned := make([]string, 0, len(queries))
	for _, query := range queries {
		query = strings.Trim(strings.Join(strings.Fields(query), " "), " ,")
		if query == "" || strings.EqualFold(query, "Vietnam") {
			continue
		}
		if !strings.Contains(strings.ToLower(query), "vietnam") && !strings.Contains(strings.ToLower(query), "việt nam") {
			query += ", Vietnam"
		}
		key := normalizeQuery(query)
		if seen[key] {
			continue
		}
		seen[key] = true
		cleaned = append(cleaned, query)
	}
	return cleaned
}

func joinNonEmpty(parts ...string) string {
	cleaned := make([]string, 0, len(parts))
	seen := map[string]bool{}
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" || seen[strings.ToLower(part)] {
			continue
		}
		seen[strings.ToLower(part)] = true
		cleaned = append(cleaned, part)
	}
	return strings.Join(cleaned, ", ")
}

func (client *nominatimClient) search(ctx context.Context, query string, sourceLat, sourceLon *float64) ([]nominatimResult, error) {
	cacheKey := "search:" + normalizeQuery(query)
	if cached, ok, err := client.cacheGet(ctx, cacheKey); err != nil {
		return nil, err
	} else if ok {
		return cached, nil
	}
	params := url.Values{
		"q":               {query},
		"format":          {"jsonv2"},
		"addressdetails":  {"1"},
		"namedetails":     {"1"},
		"countrycodes":    {"vn"},
		"accept-language": {"vi,en"},
		"limit":           {"5"},
	}
	if sourceLat != nil && sourceLon != nil {
		params.Set("viewbox", fmt.Sprintf("%.6f,%.6f,%.6f,%.6f", *sourceLon-0.4, *sourceLat+0.4, *sourceLon+0.4, *sourceLat-0.4))
	}
	var results []nominatimResult
	if err := client.getJSON(ctx, "/search?"+params.Encode(), &results); err != nil {
		return nil, err
	}
	if err := client.cachePut(ctx, cacheKey, results); err != nil {
		return nil, err
	}
	return results, nil
}

func (client *nominatimClient) reverse(ctx context.Context, lat, lon float64) (*nominatimResult, string, error) {
	query := fmt.Sprintf("reverse:%.5f,%.5f", lat, lon)
	if cached, ok, err := client.cacheGet(ctx, query); err != nil {
		return nil, query, err
	} else if ok {
		if len(cached) == 0 {
			return nil, query, nil
		}
		return &cached[0], query, nil
	}
	params := url.Values{
		"lat":             {strconv.FormatFloat(lat, 'f', 7, 64)},
		"lon":             {strconv.FormatFloat(lon, 'f', 7, 64)},
		"format":          {"jsonv2"},
		"addressdetails":  {"1"},
		"namedetails":     {"1"},
		"accept-language": {"vi,en"},
		"zoom":            {"18"},
	}
	var result nominatimResult
	err := client.getJSON(ctx, "/reverse?"+params.Encode(), &result)
	if err != nil {
		var statusError *httpStatusError
		if errors.As(err, &statusError) && statusError.StatusCode == http.StatusNotFound {
			_ = client.cachePut(ctx, query, []nominatimResult{})
			return nil, query, nil
		}
		return nil, query, err
	}
	if err := client.cachePut(ctx, query, []nominatimResult{result}); err != nil {
		return nil, query, err
	}
	return &result, query, nil
}

type httpStatusError struct {
	StatusCode int
	Body       string
}

func (err *httpStatusError) Error() string {
	return fmt.Sprintf("Nominatim status=%d body=%s", err.StatusCode, truncate(err.Body, 500))
}

func (client *nominatimClient) getJSON(ctx context.Context, path string, destination any) error {
	var lastErr error
	for attempt := 1; attempt <= 4; attempt++ {
		if wait := client.delay - time.Since(client.lastRequest); wait > 0 {
			time.Sleep(wait)
		}
		request, err := http.NewRequestWithContext(ctx, http.MethodGet, client.baseURL+path, nil)
		if err != nil {
			return err
		}
		request.Header.Set("User-Agent", client.userAgent)
		request.Header.Set("Accept", "application/json")
		response, err := client.httpClient.Do(request)
		client.lastRequest = time.Now()
		if err == nil {
			body, readErr := io.ReadAll(io.LimitReader(response.Body, 4<<20))
			response.Body.Close()
			if readErr != nil {
				lastErr = readErr
			} else if response.StatusCode >= 200 && response.StatusCode < 300 {
				if err := json.Unmarshal(body, destination); err != nil {
					return fmt.Errorf("decode Nominatim response: %w", err)
				}
				return nil
			} else {
				lastErr = &httpStatusError{StatusCode: response.StatusCode, Body: string(body)}
				if response.StatusCode < 429 && response.StatusCode < 500 {
					return lastErr
				}
			}
		} else {
			lastErr = err
		}
		if attempt < 4 {
			time.Sleep(time.Duration(attempt) * 2 * time.Second)
		}
	}
	return lastErr
}

func (client *nominatimClient) cacheGet(ctx context.Context, query string) ([]nominatimResult, bool, error) {
	var raw []byte
	err := client.db.QueryRow(ctx, `
SELECT response
FROM geocoding_cache
WHERE provider = 'nominatim' AND query = $1 AND country_code = 'vn'`, query).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}
	var results []nominatimResult
	if err := json.Unmarshal(raw, &results); err != nil {
		return nil, false, err
	}
	return results, true, nil
}

func (client *nominatimClient) cachePut(ctx context.Context, query string, results []nominatimResult) error {
	raw, err := json.Marshal(results)
	if err != nil {
		return err
	}
	_, err = client.db.Exec(ctx, `
INSERT INTO geocoding_cache (provider, query, country_code, response, result_count)
VALUES ('nominatim', $1, 'vn', $2, $3)
ON CONFLICT (provider, query, country_code) DO UPDATE SET
  response = excluded.response,
  result_count = excluded.result_count,
  updated_at = now()`, query, raw, len(results))
	return err
}

func selectCandidate(results []nominatimResult, query string, sourceLat, sourceLon *float64) *geocodeMatch {
	var best *geocodeMatch
	bestScore := math.MaxFloat64
	for _, result := range results {
		lat, lon, err := coordinates(result)
		if err != nil {
			continue
		}
		match := &geocodeMatch{Result: result, Query: query, Latitude: lat, Longitude: lon}
		score := -result.Importance * 1_000
		if sourceLat != nil && sourceLon != nil {
			distance := int(math.Round(haversineMeters(*sourceLat, *sourceLon, lat, lon)))
			match.DistanceM = &distance
			score = float64(distance) - result.Importance*1_000
		}
		if score < bestScore {
			best = match
			bestScore = score
		}
	}
	return best
}

func coordinates(result nominatimResult) (float64, float64, error) {
	lat, err := strconv.ParseFloat(result.Latitude, 64)
	if err != nil {
		return 0, 0, err
	}
	lon, err := strconv.ParseFloat(result.Longitude, 64)
	if err != nil {
		return 0, 0, err
	}
	return lat, lon, nil
}

func saveResult(ctx context.Context, db *pgxpool.Pool, item listing, location extractedLocation, match *geocodeMatch, model string) error {
	extractedRaw, err := json.Marshal(location)
	if err != nil {
		return err
	}
	status := "no_match"
	var query, provider, placeID, displayName string
	var geocodedLat, geocodedLon *float64
	var distance *int
	geocoderRaw := []byte(`{}`)
	if match != nil {
		status = match.Status
		query = match.Query
		provider = "nominatim"
		placeID = strconv.FormatInt(match.Result.PlaceID, 10)
		displayName = match.Result.DisplayName
		geocodedLat = &match.Latitude
		geocodedLon = &match.Longitude
		distance = match.DistanceM
		geocoderRaw, err = json.Marshal(match.Result)
		if err != nil {
			return err
		}
		fillLocationFromOSM(&location, match.Result)
	}
	precision := location.Precision
	if match != nil {
		precision = bestPrecision(precision, precisionFromOSM(match.Result))
	}
	_, err = db.Exec(ctx, `
UPDATE listings SET
  source_latitude = coalesce(source_latitude, latitude),
  source_longitude = coalesce(source_longitude, longitude),
  location_city = nullif($2, ''),
  location_district = nullif($3, ''),
  location_ward = nullif($4, ''),
  location_street = nullif($5, ''),
  location_house_number = nullif($6, ''),
  location_building = nullif($7, ''),
  location_landmark = nullif($8, ''),
  location_address_text = nullif($9, ''),
  location_query = nullif($10, ''),
  location_precision = $11,
  location_confidence = $12,
  location_extracted = $13,
  geocoded_latitude = $14,
  geocoded_longitude = $15,
  geocoder_provider = nullif($16, ''),
  geocoder_place_id = nullif($17, ''),
  geocoder_display_name = nullif($18, ''),
  geocoder_raw = $19,
  geocode_distance_m = $20,
  geocoding_status = $21,
  geocoding_error = NULL,
  geocoded_at = now(),
  latitude = coalesce(latitude, $14),
  longitude = coalesce(longitude, $15),
  normalized = coalesce(normalized, '{}'::jsonb) || jsonb_build_object(
    'location_enrichment', jsonb_build_object(
      'provider', $16::text,
      'model', $22::text,
      'status', $21::text,
      'extracted', $13::jsonb,
      'geocoder', $19::jsonb
    )
  ),
  updated_at = now()
WHERE id = $1`,
		item.ID, location.City, location.District, location.Ward, location.Street,
		location.HouseNumber, location.Building, location.Landmark, location.AddressText,
		query, precision, location.Confidence, extractedRaw, geocodedLat, geocodedLon,
		provider, placeID, displayName, geocoderRaw, distance, status, model,
	)
	return err
}

func saveGeocodingFailure(ctx context.Context, db *pgxpool.Pool, item listing, location extractedLocation, cause error) error {
	raw, _ := json.Marshal(location)
	_, err := db.Exec(ctx, `
UPDATE listings SET
  location_extracted = $2,
  location_precision = $3,
  location_confidence = $4,
  geocoding_status = 'geocoding_failed',
  geocoding_error = $5,
  geocoded_at = now(),
  updated_at = now()
WHERE id = $1`, item.ID, raw, normalizePrecision(location.Precision), location.Confidence, truncate(cause.Error(), 2000))
	return err
}

func saveFailure(ctx context.Context, db *pgxpool.Pool, listingID, status string, cause error) error {
	_, err := db.Exec(ctx, `
UPDATE listings SET
  geocoding_status = $2,
  geocoding_error = $3,
  geocoded_at = now(),
  updated_at = now()
WHERE id = $1`, listingID, status, truncate(cause.Error(), 2000))
	return err
}

func fillLocationFromOSM(location *extractedLocation, result nominatimResult) {
	if location.City == "" {
		location.City = firstMapValue(result.Address, "city", "town", "municipality", "village")
	}
	if location.District == "" {
		location.District = firstMapValue(result.Address, "city_district", "district", "county", "state_district")
	}
	if location.Ward == "" {
		location.Ward = firstMapValue(result.Address, "suburb", "quarter", "neighbourhood")
	}
	if location.Street == "" {
		location.Street = firstMapValue(result.Address, "road", "pedestrian", "residential")
	}
	if location.HouseNumber == "" {
		location.HouseNumber = result.Address["house_number"]
	}
}

func firstMapValue(values map[string]string, keys ...string) string {
	for _, key := range keys {
		if value := strings.TrimSpace(values[key]); value != "" {
			return value
		}
	}
	return ""
}

func precisionFromOSM(result nominatimResult) string {
	if result.Address["house_number"] != "" || result.Type == "house" || result.Type == "apartments" || result.Type == "building" {
		return "building"
	}
	if result.Address["road"] != "" || result.Type == "street" || result.Type == "road" {
		return "street"
	}
	if firstMapValue(result.Address, "suburb", "quarter", "neighbourhood") != "" {
		return "ward"
	}
	if firstMapValue(result.Address, "city_district", "district", "county", "state_district") != "" {
		return "district"
	}
	if firstMapValue(result.Address, "city", "town", "municipality", "village") != "" {
		return "city"
	}
	return "unknown"
}

func bestPrecision(a, b string) string {
	rank := map[string]int{"unknown": 0, "city": 1, "district": 2, "ward": 3, "street": 4, "building": 5}
	a, b = normalizePrecision(a), normalizePrecision(b)
	if rank[b] > rank[a] {
		return b
	}
	return a
}

func normalizePrecision(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	switch value {
	case "building", "street", "ward", "district", "city":
		return value
	default:
		return "unknown"
	}
}

func normalizeQuery(value string) string {
	return strings.ToLower(strings.Join(strings.Fields(value), " "))
}

func haversineMeters(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6_371_000.0
	toRadians := math.Pi / 180
	dLat := (lat2 - lat1) * toRadians
	dLon := (lon2 - lon1) * toRadians
	a := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Cos(lat1*toRadians)*math.Cos(lat2*toRadians)*math.Sin(dLon/2)*math.Sin(dLon/2)
	return earthRadius * 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}

func logDryRun(item listing, location extractedLocation, match *geocodeMatch) {
	if match == nil {
		log.Printf("dry-run listing=%s extracted=%s/%s/%s no_match", item.ID, location.City, location.District, location.Street)
		return
	}
	distance := "n/a"
	if match.DistanceM != nil {
		distance = strconv.Itoa(*match.DistanceM) + "m"
	}
	log.Printf("dry-run listing=%s extracted=%s/%s/%s query=%q distance=%s result=%q", item.ID, location.City, location.District, location.Street, match.Query, distance, match.Result.DisplayName)
}

func truncate(value string, limit int) string {
	if len(value) <= limit {
		return value
	}
	return value[:limit]
}
