# Verified Facebook Marketplace URLs

Checked with `apify/facebook-marketplace-scraper` using `resultsLimit=1` and `includeListingDetails=false`.

## Working sources

| App city | Facebook path | Query pattern | Verification result | Notes |
| --- | --- | --- | --- | --- |
| `hcmc` | `hochiminhcity` | `apartment for rent` | `Ho Chi Minh City, Vietnam` | Strong source. Price filters worked with `minPrice` / `maxPrice` in VND. |
| `danang` | `113055078713103` | `apartment for rent` | `Da Nang, Vietnam` | Better than `danang` slug. Also worked for `house for rent`. |
| `nhatrang` | `109205905763791` | `apartment for rent` | `Nha Trang` | Strong source. |
| `phuquoc` | `107416705961385` | `villa for rent`, `house for rent` | `Phu Quoc, Kien Giang, Vietnam` | Strong source. |
| `phuquoc` | `107128589319099` | `villa for rent` | `Phu Quoc, Kien Giang, Vietnam` | Alternate source. |
| `hoian` | `113055078713103` | `Hoi An villa for rent`, `Hoi An house for rent` | Title matched Hoi An, location returned `Da Nang, Vietnam` | Practical source, but requires title/description post-filter for Hoi An. |

## Bad or weak sources

| Candidate | Result | Notes |
| --- | --- | --- |
| `danang` | US listings such as Roseville, CA | Do not use. |
| `danangcity` | New York listings | Do not use. |
| `da-nang` | New Jersey listings | Do not use. |
| `da_nang` | San Francisco listings | Do not use. |
| `nhatrang` | San Francisco listings | Do not use. |
| `hanoi` | San Francisco listings | Do not use for Vietnam pipeline without more verification. |

## URL builder shape

```text
https://www.facebook.com/marketplace/{path}/search/?query={query}&minPrice={vnd_min}&maxPrice={vnd_max}
```

Example:

```text
https://www.facebook.com/marketplace/hochiminhcity/search/?query=apartment%20for%20rent&minPrice=5000000&maxPrice=10000000
```

## Pricing observation

The actor charges per dataset result, not per URL. On the current free tier, observed price was `$0.0062` per listing without details. `includeListingDetails=true` adds a second paid event per detailed listing.

