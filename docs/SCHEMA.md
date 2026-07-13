# Database Schema

VietNest stores both raw Apify/Facebook Marketplace data and normalized app data.

## Import Pipeline

```text
locations
  -> scrape_sources
  -> scrape_runs
  -> raw_marketplace_items
  -> listings
  -> listing_photos / listing_contacts / listing_price_history
  -> listing_availability_checks
```

## Tables

### locations

Vietnam city/location catalog used to generate Facebook Marketplace URLs.

Key fields:

- `city_slug`: internal slug such as `danang`, `nhatrang`, `hcmc`
- `city_name`
- `latitude`, `longitude`

### scrape_sources

Config rows for Apify `startUrls`.

Key fields:

- `base_url`: Facebook Marketplace category URL
- `category`: `propertyrentals`, `apartments-for-rent`
- `query`
- `min_price`, `max_price`
- `min_bedrooms`, `max_bedrooms`
- `radius_km`
- `sort_by`
- `days_since_listed`
- `params jsonb`
- `enabled`

### scrape_runs

One Apify actor execution.

Key fields:

- `apify_actor_id`
- `apify_run_id`
- `apify_dataset_id`
- `status`
- `items_found`, `items_imported`
- `started_at`, `finished_at`

### raw_marketplace_items

Full source payload from Apify.

Key fields:

- `external_id`: Facebook listing id
- `source_url`
- `raw jsonb`
- `raw_hash`
- `scraped_at`

### listings

Normalized card used by the mini app.

Key fields:

- `id`: stable listing id, currently the external listing id
- `source`, `source_url`, `canonical_url`
- `city`, `area`, `location_id`
- extracted address fields: `location_city`, `location_district`, `location_ward`,
  `location_street`, `location_building`, `location_landmark`
- source coordinates: `source_latitude`, `source_longitude`
- OpenStreetMap result: `geocoded_latitude`, `geocoded_longitude`,
  `geocoder_place_id`, `geocoder_display_name`, `geocoder_raw`
- geocoding quality: `location_precision`, `location_confidence`,
  `geocode_distance_m`, `geocoding_status`, `geocoded_at`
- `title`, `about`
- `home_type`, `property_type`
- `price_usd`, `price_currency`, `price_period`, `deposit_amount`
- `bedrooms`, `bathrooms`, `area_sqm`, `floor`
- `tags`, `amenities`, `normalized jsonb`
- `listing_status`: `active`, `stale`, `removed`, `duplicate`, `blocked`, `unknown`
- `availability_status`: `available`, `unavailable`, `rented`, `unknown`
- `first_seen_at`, `last_seen_at`, `published_at`
- `stale_at`, `removed_at`, `last_checked_at`, `check_fail_count`

### listing_photos

Photo URLs and optional future storage metadata.

Key fields:

- `listing_id`
- `position`
- `source_url`
- `storage_url`
- `is_primary`
- `checksum`

### listing_contacts

Contact information extracted from listing details.

Key fields:

- `contact_type`: `owner`, `agent`, `agency`, `unknown`
- `name`
- `phone`
- `messenger_url`
- `facebook_profile_url`
- `raw_contact`

### listing_price_history

Observed price history.

Key fields:

- `listing_id`
- `price_amount`
- `price_currency`
- `price_period`
- `observed_at`

### listing_availability_checks

Evidence log for listing freshness.

Useful statuses:

- `seen`
- `not_seen_in_search`
- `detail_available`
- `detail_unavailable`
- `removed`
- `login_required`
- `blocked`
- `error`

### geocoding_cache

Cached Nominatim search responses keyed by provider, normalized query and country.
The cache makes the one-time enrichment resumable and avoids repeating public API
requests for duplicate addresses.

### app_users / user_favorites

Telegram user records and saved listings.
