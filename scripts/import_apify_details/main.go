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
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const vndPerUSD = 25000

type detailItem struct {
	ExternalID  string          `json:"external_id"`
	ListingID   string          `json:"listing_id"`
	URL         string          `json:"url"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Price       map[string]any  `json:"price"`
	Location    map[string]any  `json:"location"`
	Details     []any           `json:"details"`
	Condition   any             `json:"condition"`
	IsLive      *bool           `json:"is_live"`
	IsHidden    *bool           `json:"is_hidden"`
	IsPending   *bool           `json:"is_pending"`
	IsSold      *bool           `json:"is_sold"`
	Media       []detailMedia   `json:"media"`
	Raw         json.RawMessage `json:"raw"`
}

type detailMedia struct {
	Kind        string `json:"kind"`
	SourceURL   string `json:"source_url"`
	LocalPath   string `json:"local_path"`
	Width       *int   `json:"width"`
	Height      *int   `json:"height"`
	Checksum    string `json:"checksum"`
	ContentType string `json:"content_type"`
	Error       string `json:"error"`
}

type existingListing struct {
	ID        string
	Title     string
	Area      string
	City      string
	PriceUSD  int
	Specs     []string
	Details   []string
	Tags      []string
	About     string
	FBURL     string
	Photos    []string
	Amenities []string
}

type normalizedDetail struct {
	Source             string         `json:"source"`
	ExternalID         string         `json:"external_id"`
	SourceURL          string         `json:"source_url"`
	Title              string         `json:"title,omitempty"`
	Description        string         `json:"description,omitempty"`
	Price              map[string]any `json:"price,omitempty"`
	PriceUSD           int            `json:"price_usd,omitempty"`
	PriceNormalization string         `json:"price_normalization,omitempty"`
	Location           map[string]any `json:"location,omitempty"`
	Details            []any          `json:"details,omitempty"`
	Condition          any            `json:"condition,omitempty"`
	Statuses           map[string]any `json:"statuses"`
	Media              []detailMedia  `json:"media"`
	ImportedAt         string         `json:"imported_at"`
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "detail import failed: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		return errors.New("DATABASE_URL is required")
	}
	if len(os.Args) != 2 {
		return errors.New("usage: go run ./scripts/import_apify_details <details.normalized.json>")
	}

	payload, err := os.ReadFile(os.Args[1])
	if err != nil {
		return err
	}

	var items []detailItem
	if err := json.Unmarshal(payload, &items); err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	updated, skipped, photoCount, err := importDetails(ctx, pool, items)
	if err != nil {
		return err
	}

	fmt.Printf("details=%d updated=%d skipped=%d photos=%d\n", len(items), updated, skipped, photoCount)
	return nil
}

func importDetails(ctx context.Context, pool *pgxpool.Pool, items []detailItem) (int, int, int, error) {
	updated := 0
	skipped := 0
	photoCount := 0

	for _, item := range items {
		if strings.TrimSpace(item.ListingID) == "" && strings.TrimSpace(item.ExternalID) != "" {
			item.ListingID = "fbm-" + strings.TrimSpace(item.ExternalID)
		}
		if strings.TrimSpace(item.ListingID) == "" {
			skipped++
			continue
		}

		tx, err := pool.Begin(ctx)
		if err != nil {
			return updated, skipped, photoCount, err
		}

		existing, ok, err := loadExisting(ctx, tx, item.ListingID)
		if err != nil {
			tx.Rollback(ctx)
			return updated, skipped, photoCount, err
		}
		if !ok {
			tx.Rollback(ctx)
			skipped++
			continue
		}

		importedPhotos, err := updateListing(ctx, tx, existing, item)
		if err != nil {
			tx.Rollback(ctx)
			return updated, skipped, photoCount, err
		}
		if err := tx.Commit(ctx); err != nil {
			return updated, skipped, photoCount, err
		}
		updated++
		photoCount += importedPhotos
		if updated%25 == 0 {
			fmt.Printf("updated %d listings, %d photos\n", updated, photoCount)
		}
	}

	return updated, skipped, photoCount, nil
}

func loadExisting(ctx context.Context, tx pgx.Tx, id string) (existingListing, bool, error) {
	var l existingListing
	err := tx.QueryRow(ctx, `
SELECT id, title, area, city, price_usd, specs, details, tags, about, fb_url, photos, amenities
FROM listings
WHERE id = @id
`, pgx.NamedArgs{"id": id}).Scan(&l.ID, &l.Title, &l.Area, &l.City, &l.PriceUSD, &l.Specs, &l.Details, &l.Tags, &l.About, &l.FBURL, &l.Photos, &l.Amenities)
	if errors.Is(err, pgx.ErrNoRows) {
		return existingListing{}, false, nil
	}
	if err != nil {
		return existingListing{}, false, err
	}
	return l, true, nil
}

func updateListing(ctx context.Context, tx pgx.Tx, existing existingListing, item detailItem) (int, error) {
	sourceURL := firstNonEmpty(item.URL, existing.FBURL)
	title := firstNonEmpty(cleanText(item.Title), existing.Title)
	about := firstNonEmpty(cleanText(item.Description), existing.About)
	area := firstNonEmpty(locationLabel(item.Location), existing.Area)
	priceUSD := existing.PriceUSD
	priceSource := ""
	joinedText := strings.Join([]string{title, about, area, marshalText(item.Details)}, " ")
	if price, source, ok := priceUSDFromDetail(item.Price); ok {
		priceUSD = price
		priceSource = source
	} else if price, source, ok := priceUSDFromText(joinedText); ok {
		priceUSD = price
		priceSource = source
	}

	photos, storage, checksums, widths, heights := photoMedia(item.Media)
	if len(photos) == 0 {
		photos = existing.Photos
	}

	tags, amenities := inferTags(joinedText)
	tags = union(existing.Tags, tags)
	amenities = union(existing.Amenities, amenities)
	specs := listingSpecs(priceUSD, joinedText, area)
	details := union(existing.Details, detailLabels(item, sourceURL))
	listingStatus, availabilityStatus, availabilityCheck := statuses(item)
	lat, lng := coordinates(item.Location)

	normalizedPayload := normalizedDetail{
		Source:             "apify_facebook_marketplace_detail",
		ExternalID:         firstNonEmpty(item.ExternalID, strings.TrimPrefix(item.ListingID, "fbm-")),
		SourceURL:          sourceURL,
		Title:              title,
		Description:        about,
		Price:              item.Price,
		PriceUSD:           priceUSD,
		PriceNormalization: priceSource,
		Location:           item.Location,
		Details:            item.Details,
		Condition:          item.Condition,
		Statuses: map[string]any{
			"is_live":    boolValue(item.IsLive),
			"is_hidden":  boolValue(item.IsHidden),
			"is_pending": boolValue(item.IsPending),
			"is_sold":    boolValue(item.IsSold),
		},
		Media:      item.Media,
		ImportedAt: time.Now().UTC().Format(time.RFC3339),
	}
	normalizedJSON, err := json.Marshal(normalizedPayload)
	if err != nil {
		return 0, err
	}

	raw := item.Raw
	if len(raw) == 0 || string(raw) == "null" {
		raw, err = json.Marshal(item)
		if err != nil {
			return 0, err
		}
	}
	hash := sha256.Sum256(raw)

	_, err = tx.Exec(ctx, `
UPDATE listings SET
  title = @title,
  area = @area,
  price_usd = @price_usd,
  specs = @specs,
  details = @details,
  tags = @tags,
  about = @about,
  fb_url = @fb_url,
  source_url = @source_url,
  photos = @photos,
  pet_friendly = @pet_friendly,
  amenities = @amenities,
  normalized = coalesce(normalized, '{}'::jsonb) || jsonb_build_object('apify_detail', @normalized::jsonb),
  listing_status = @listing_status,
  availability_status = @availability_status,
  bedrooms = coalesce(@bedrooms, bedrooms),
  bathrooms = coalesce(@bathrooms, bathrooms),
  latitude = coalesce(@latitude, latitude),
  longitude = coalesce(@longitude, longitude),
  furnished = coalesce(@furnished, furnished),
  has_pool = coalesce(@has_pool, has_pool),
  has_gym = coalesce(@has_gym, has_gym),
  has_balcony = coalesce(@has_balcony, has_balcony),
  has_parking = coalesce(@has_parking, has_parking),
  has_security = coalesce(@has_security, has_security),
  last_seen_at = CASE WHEN @listing_status = 'active' THEN now() ELSE last_seen_at END,
  last_checked_at = now(),
  check_fail_count = 0,
  stale_at = CASE WHEN @listing_status = 'stale' THEN coalesce(stale_at, now()) ELSE stale_at END,
  removed_at = CASE WHEN @listing_status = 'removed' THEN coalesce(removed_at, now()) ELSE removed_at END,
  updated_at = now()
WHERE id = @id
`, pgx.NamedArgs{
		"id":                  existing.ID,
		"title":               title,
		"area":                area,
		"price_usd":           priceUSD,
		"specs":               specs,
		"details":             details,
		"tags":                tags,
		"about":               about,
		"fb_url":              sourceURL,
		"source_url":          sourceURL,
		"photos":              photos,
		"pet_friendly":        hasAny(joinedText, "pet", "pets", "dog", "cat"),
		"amenities":           amenities,
		"normalized":          string(normalizedJSON),
		"listing_status":      listingStatus,
		"availability_status": availabilityStatus,
		"bedrooms":            firstNumber(joinedText, `(\d+(?:\.\d+)?)\s*(?:bed|br|bedroom|bedrooms)`),
		"bathrooms":           firstNumber(joinedText, `(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom|bathrooms)`),
		"latitude":            lat,
		"longitude":           lng,
		"furnished":           boolPtr(hasAny(joinedText, "furnished", "fully furnished", "furniture")),
		"has_pool":            boolPtr(hasAny(joinedText, "pool", "swimming")),
		"has_gym":             boolPtr(hasAny(joinedText, "gym", "fitness")),
		"has_balcony":         boolPtr(hasAny(joinedText, "balcony")),
		"has_parking":         boolPtr(hasAny(joinedText, "parking", "bike parking", "motorbike")),
		"has_security":        boolPtr(hasAny(joinedText, "security", "guard")),
	})
	if err != nil {
		return 0, fmt.Errorf("update listing %s: %w", existing.ID, err)
	}

	if len(photoMediaOnly(item.Media)) > 0 {
		if _, err := tx.Exec(ctx, `DELETE FROM listing_photos WHERE listing_id = @listing_id`, pgx.NamedArgs{"listing_id": existing.ID}); err != nil {
			return 0, fmt.Errorf("delete photos %s: %w", existing.ID, err)
		}
		for position, photo := range photos {
			_, err := tx.Exec(ctx, `
INSERT INTO listing_photos (listing_id, position, source_url, storage_url, width, height, checksum, is_primary)
VALUES (@listing_id, @position, @source_url, @storage_url, @width, @height, @checksum, @is_primary)
ON CONFLICT (listing_id, position) DO UPDATE SET
  source_url = excluded.source_url,
  storage_url = excluded.storage_url,
  width = excluded.width,
  height = excluded.height,
  checksum = excluded.checksum,
  is_primary = excluded.is_primary;
`, pgx.NamedArgs{
				"listing_id":  existing.ID,
				"position":    position,
				"source_url":  photo,
				"storage_url": storage[photo],
				"width":       widths[photo],
				"height":      heights[photo],
				"checksum":    checksums[photo],
				"is_primary":  position == 0,
			})
			if err != nil {
				return 0, fmt.Errorf("upsert photo %s:%d: %w", existing.ID, position, err)
			}
		}
	}

	_, err = tx.Exec(ctx, `
INSERT INTO listing_price_history (listing_id, price_amount, price_currency, price_period, observed_at)
SELECT @listing_id, @price_amount, 'USD', 'month', now()
WHERE @price_amount > 0 AND NOT EXISTS (
  SELECT 1 FROM listing_price_history
  WHERE listing_id = @listing_id AND price_amount = @price_amount AND observed_at > now() - interval '1 day'
);
`, pgx.NamedArgs{"listing_id": existing.ID, "price_amount": priceUSD})
	if err != nil {
		return 0, fmt.Errorf("insert price history %s: %w", existing.ID, err)
	}

	evidenceJSON, err := json.Marshal(map[string]any{
		"apify_detail": true,
		"is_live":      boolValue(item.IsLive),
		"is_hidden":    boolValue(item.IsHidden),
		"is_pending":   boolValue(item.IsPending),
		"is_sold":      boolValue(item.IsSold),
	})
	if err != nil {
		return 0, err
	}
	_, err = tx.Exec(ctx, `
INSERT INTO listing_availability_checks (listing_id, status, source_url, evidence)
VALUES (@listing_id, @status, @source_url, @evidence::jsonb);
`, pgx.NamedArgs{"listing_id": existing.ID, "status": availabilityCheck, "source_url": sourceURL, "evidence": string(evidenceJSON)})
	if err != nil {
		return 0, fmt.Errorf("insert availability %s: %w", existing.ID, err)
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
		"listing_id":  existing.ID,
		"external_id": firstNonEmpty(item.ExternalID, strings.TrimPrefix(existing.ID, "fbm-")),
		"source_url":  sourceURL,
		"raw":         string(raw),
		"raw_hash":    hex.EncodeToString(hash[:]),
	})
	if err != nil {
		return 0, fmt.Errorf("upsert raw %s: %w", existing.ID, err)
	}

	return len(photoMediaOnly(item.Media)), nil
}

func priceUSDFromDetail(price map[string]any) (int, string, bool) {
	if len(price) == 0 {
		return 0, "", false
	}
	amount, ok := numberAt(price, "amount", "amount_in_hundredths")
	if !ok || amount <= 0 {
		return 0, "", false
	}
	currency := strings.ToUpper(firstNonEmpty(stringAt(price, "currency"), stringAt(price, "currency_code")))
	if currency == "" {
		currency = strings.ToUpper(stringAt(price, "currencyCode"))
	}
	if currency == "USD" {
		return int(math.Round(amount)), "apify_detail_usd", true
	}
	if currency == "VND" || amount > 10000 {
		return int(math.Round(amount / vndPerUSD)), "apify_detail_vnd_heuristic_2026_06_30", true
	}
	return int(math.Round(amount)), "apify_detail_unknown_currency", true
}

func priceUSDFromText(text string) (int, string, bool) {
	normalized := strings.ToLower(text)
	normalized = strings.NewReplacer("\u00a0", " ", "₫", " vnd ", "đ", " vnd ").Replace(normalized)

	usdPatterns := []string{
		`(?:\$|usd\s*)\s*(\d{2,5}(?:[,.]\d{1,2})?)\b`,
		`\b(\d{2,5}(?:[,.]\d{1,2})?)\s*(?:usd|us\$|dollars?)\b`,
	}
	for _, pattern := range usdPatterns {
		if price, ok := firstPriceMatch(normalized, pattern, 1); ok && price >= 100 && price <= 10000 {
			return price, "apify_detail_text_usd", true
		}
	}

	vndMillionPatterns := []string{
		`\b(\d{1,3}(?:[,.]\d{1,2})?)\s*(?:tr|triệu|trieu|million|mil)\b`,
		`\b(\d{1,3}(?:[,.]\d{1,2})?)\s*m\s*(?:/|per|\b)(?:\s*(?:month|mo|tháng|thang))?`,
	}
	for _, pattern := range vndMillionPatterns {
		if million, ok := firstFloatMatch(normalized, pattern, 1); ok && million >= 2 && million <= 300 {
			return int(math.Round((million * 1_000_000) / vndPerUSD)), "apify_detail_text_vnd_million", true
		}
	}

	explicitVNDPatterns := []string{
		`\b(\d{1,3}(?:[.,]\d{3}){2,})\s*(?:vnd|vnđ|vietnam dong|/month|/mo|per month)?\b`,
		`\b(\d{7,9})\s*(?:vnd|vnđ|/month|/mo|per month)\b`,
	}
	for _, pattern := range explicitVNDPatterns {
		if vnd, ok := firstVNDMatch(normalized, pattern, 1); ok && vnd >= 2_000_000 && vnd <= 300_000_000 {
			return int(math.Round(vnd / vndPerUSD)), "apify_detail_text_vnd", true
		}
	}

	return 0, "", false
}

func firstPriceMatch(text, pattern string, index int) (int, bool) {
	value, ok := firstFloatMatch(text, pattern, index)
	if !ok {
		return 0, false
	}
	return int(math.Round(value)), true
}

func firstFloatMatch(text, pattern string, index int) (float64, bool) {
	matches := regexp.MustCompile(pattern).FindAllStringSubmatch(text, -1)
	for _, match := range matches {
		if len(match) <= index {
			continue
		}
		clean := strings.ReplaceAll(match[index], ",", ".")
		value, err := strconv.ParseFloat(clean, 64)
		if err == nil {
			return value, true
		}
	}
	return 0, false
}

func firstVNDMatch(text, pattern string, index int) (float64, bool) {
	matches := regexp.MustCompile(pattern).FindAllStringSubmatch(text, -1)
	for _, match := range matches {
		if len(match) <= index {
			continue
		}
		clean := regexp.MustCompile(`[^\d]`).ReplaceAllString(match[index], "")
		value, err := strconv.ParseFloat(clean, 64)
		if err == nil {
			return value, true
		}
	}
	return 0, false
}

func photoMedia(media []detailMedia) ([]string, map[string]string, map[string]string, map[string]*int, map[string]*int) {
	photos := []string{}
	storage := map[string]string{}
	checksums := map[string]string{}
	widths := map[string]*int{}
	heights := map[string]*int{}
	for _, item := range media {
		if !isPhoto(item) || item.SourceURL == "" || slices.Contains(photos, item.SourceURL) {
			continue
		}
		photos = append(photos, item.SourceURL)
		storage[item.SourceURL] = item.LocalPath
		checksums[item.SourceURL] = item.Checksum
		widths[item.SourceURL] = item.Width
		heights[item.SourceURL] = item.Height
	}
	return photos, storage, checksums, widths, heights
}

func photoMediaOnly(media []detailMedia) []detailMedia {
	photos := []detailMedia{}
	for _, item := range media {
		if isPhoto(item) && item.SourceURL != "" {
			photos = append(photos, item)
		}
	}
	return photos
}

func isPhoto(item detailMedia) bool {
	kind := strings.ToLower(item.Kind)
	return kind == "photo" || kind == "image" || strings.HasPrefix(item.ContentType, "image/")
}

func statuses(item detailItem) (string, string, string) {
	negative := boolValue(item.IsHidden) == true || boolValue(item.IsSold) == true
	pending := boolValue(item.IsPending) == true
	if negative || boolValue(item.IsLive) == false {
		return "removed", "unavailable", "detail_unavailable"
	}
	if pending {
		return "stale", "unavailable", "detail_unavailable"
	}
	return "active", "available", "detail_available"
}

func listingSpecs(price int, text, area string) []string {
	specs := []string{}
	if price > 0 {
		specs = append(specs, fmt.Sprintf("$%d/mo", price))
	}
	if beds := firstNumber(text, `(\d+(?:\.\d+)?)\s*(?:bed|br|bedroom|bedrooms)`); beds != nil {
		specs = append(specs, trimNumber(*beds)+" bed")
	}
	if baths := firstNumber(text, `(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom|bathrooms)`); baths != nil {
		specs = append(specs, trimNumber(*baths)+" bath")
	}
	if area != "" {
		specs = append(specs, area)
	}
	return compact(specs)
}

func detailLabels(item detailItem, sourceURL string) []string {
	labels := []string{"Facebook Marketplace detail refreshed"}
	if sourceURL != "" {
		labels = append(labels, sourceURL)
	}
	if location := locationLabel(item.Location); location != "" {
		labels = append(labels, location)
	}
	return labels
}

func inferTags(text string) ([]string, []string) {
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
	add("parking", "parking", "bike parking", "motorbike")
	add("security", "security", "guard")
	add("furnished", "furnished", "fully furnished", "furniture")
	add("sea view", "sea view", "seaview", "beach", "ocean")
	add("river view", "river view", "riverview")
	add("serviced", "serviced")
	add("studio", "studio")
	add("pet friendly", "pet", "pets")
	add("kitchen", "kitchen")
	add("laundry", "laundry", "washing machine", "washer")
	add("wifi", "wifi", "internet")
	return compact(tags), compact(amenities)
}

func locationLabel(location map[string]any) string {
	candidates := []string{
		stringAtPath(location, "reverse_geocode", "city_page", "display_name"),
		stringAtPath(location, "reverseGeocode", "cityPage", "displayName"),
		stringAtPath(location, "reverse_geocode", "city"),
		stringAtPath(location, "reverseGeocode", "city"),
		stringAtPath(location, "address"),
	}
	for _, candidate := range candidates {
		if clean := cleanText(candidate); clean != "" {
			return clean
		}
	}
	return ""
}

func coordinates(location map[string]any) (*float64, *float64) {
	lat, latOK := numberAtPath(location, "latitude")
	if !latOK {
		lat, latOK = numberAtPath(location, "lat")
	}
	lng, lngOK := numberAtPath(location, "longitude")
	if !lngOK {
		lng, lngOK = numberAtPath(location, "lng")
	}
	if !latOK || !lngOK {
		return nil, nil
	}
	return &lat, &lng
}

func firstNumber(text, pattern string) *float64 {
	match := regexp.MustCompile(pattern).FindStringSubmatch(strings.ToLower(text))
	if len(match) < 2 {
		return nil
	}
	value, err := strconv.ParseFloat(match[1], 64)
	if err != nil || value <= 0 || value > 30 {
		return nil
	}
	return &value
}

func numberAt(value map[string]any, keys ...string) (float64, bool) {
	for _, key := range keys {
		if number, ok := toFloat(value[key]); ok {
			return number, true
		}
	}
	return 0, false
}

func numberAtPath(value map[string]any, path ...string) (float64, bool) {
	var cursor any = value
	for _, key := range path {
		next, ok := cursor.(map[string]any)
		if !ok {
			return 0, false
		}
		cursor = next[key]
	}
	return toFloat(cursor)
}

func toFloat(value any) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case int:
		return float64(v), true
	case json.Number:
		parsed, err := v.Float64()
		return parsed, err == nil
	case string:
		clean := regexp.MustCompile(`[^\d.]`).ReplaceAllString(v, "")
		parsed, err := strconv.ParseFloat(clean, 64)
		return parsed, err == nil
	default:
		return 0, false
	}
}

func stringAt(value map[string]any, key string) string {
	if text, ok := value[key].(string); ok {
		return text
	}
	return ""
}

func stringAtPath(value map[string]any, path ...string) string {
	var cursor any = value
	for _, key := range path {
		next, ok := cursor.(map[string]any)
		if !ok {
			return ""
		}
		cursor = next[key]
	}
	if text, ok := cursor.(string); ok {
		return text
	}
	return ""
}

func marshalText(value any) string {
	payload, _ := json.Marshal(value)
	return string(payload)
}

func boolValue(value *bool) any {
	if value == nil {
		return nil
	}
	return *value
}

func boolPtr(value bool) *bool {
	return &value
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if clean := cleanText(value); clean != "" {
			return clean
		}
	}
	return ""
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

func union(left, right []string) []string {
	return compact(append(append([]string{}, left...), right...))
}

func compact(values []string) []string {
	result := []string{}
	for _, value := range values {
		value = cleanText(value)
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
