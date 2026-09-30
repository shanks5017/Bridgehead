# Async Rental Scraper — Platform Engineering Guide

> **Stack:** `asyncio` · `curl_cffi` · `playwright.async_api`  
> **Target:** 8 Indian real estate platforms, locality-level precision (e.g., "RS Puram, Coimbatore")

---

## Platform Index

| # | Platform | Primary Scrape Method | Anti-Bot Level | Free API |
|---|---|---|---|---|
| 1 | OLX | curl_cffi (REST JSON) | Medium | Partial |
| 2 | MagicBricks | curl_cffi + locality ID resolve | High | No |
| 3 | 99acres | curl_cffi + locality ID resolve | High | No |
| 4 | Housing.com | curl_cffi (GraphQL) | Medium | No |
| 5 | NoBroker | curl_cffi (REST JSON) | Medium-High | No |
| 6 | PropTiger | curl_cffi | Low-Medium | No |
| 7 | Makaan | curl_cffi | Low | No |
| 8 | QuikrHomes | Playwright (JS-rendered) | High | No |

---

## 1. OLX

### 1.1 Locality Fetching

OLX India uses a **geographic slug + numeric location ID** system. The public search API is REST-based and undocumented but stable.

**Locality resolution endpoint:**
```
GET https://www.olx.in/api/locations/v2/autocomplete?term=RS+Puram&lang=en-IN&limit=5
```
This returns a JSON array with entries like:
```json
{
  "id": "4058467",
  "slug": "rs-puram",
  "name": "RS Puram",
  "city": "Coimbatore",
  "type": "locality"
}
```
Store the `id` and `slug`. The listing search URL pattern is:
```
https://www.olx.in/items/q-rent?filter=price%3AASC&location_id=4058467
```

For the **REST API** (used by the OLX mobile app, accessible via browser):
```
GET https://www.olx.in/api/relevance/v4/search?
  location_id=4058467
  &category_id=1720         # Flats for Rent
  &facet_limit=20
  &page=1
  &size=25
  &brand=olx
  &lang=en-IN
```
Headers required: `User-Agent`, `X-Location-Id: 4058467`, `Accept: application/json`

**Known category IDs:**
- `1720` — Flats for Rent
- `1724` — PG / Roommates
- `1719` — Houses for Rent
- `1722` — Commercial for Rent

### 1.2 Pagination

OLX uses **page-based pagination** via the `page` query param. Each page returns up to 25 results. The API response includes `totalCount` — divide by 25, ceil, and loop.

```python
for page in range(1, math.ceil(total / 25) + 1):
    url = f"...&page={page}&size=25"
```

No cursor tokens. No JS required. Pure async HTTP with `curl_cffi`.

### 1.3 Anti-Bot & Login Walls

- **Protection:** Medium. Cloudflare is present but mainly on the HTML frontend. The REST API endpoint is less aggressively guarded.
- **TLS fingerprinting:** Yes — use `curl_cffi` with `impersonate="chrome120"`.
- **Login wall:** Not required for listing data. Phone numbers on individual ads are behind OTP, but title, price, location, and listing metadata are fully visible without auth.
- **Rate limit:** ~80–120 req/min before soft-blocking. Use `asyncio.Semaphore(10)` with a 0.5s jitter.

### 1.4 Free API

**Partial.** The mobile search API (`/api/relevance/v4/search`) is unauthenticated. No official public API key program exists. Treat it as a stable-but-unofficial endpoint.

---

## 2. MagicBricks

### 2.1 Locality Fetching

MagicBricks requires a **numeric locality ID** for precise targeting. The locality resolution flow:

**Step 1 — Resolve locality ID:**
```
GET https://www.magicbricks.com/mbsrp/propertySearch/
  mbAutoSuggest/autoSuggest.html?
  query=RS+Puram&city=Coimbatore
```
Returns XML or JSON (varies by request headers) with locality entries containing `cityId`, `localityId`, and `localityName`.

Alternatively, the newer GraphQL-adjacent endpoint:
```
POST https://www.magicbricks.com/mbi-search/api/v1/search/autosuggest
Body: {"query": "RS Puram, Coimbatore", "city": "Coimbatore"}
```

**Step 2 — Build search URL:**
```
https://www.magicbricks.com/property-for-rent/residential-real-estate?
  bedroom=&proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment
  &Locality=RS-Puram
  &cityName=Coimbatore
  &localityId=<RESOLVED_ID>
  &offset=0
  &max=30
```

The `localityId` param is critical — without it, results fall back to city-wide.

**REST Search API** (from their mobile app traffic):
```
GET https://www.magicbricks.com/mbi-search/api/v2/listings?
  proptype=RES&listingType=RENT
  &localityIds=<ID>
  &cityId=<CITY_ID>
  &offset=0
  &limit=30
```
Headers: `Referer: https://www.magicbricks.com/`, `X-Requested-With: XMLHttpRequest`

### 2.2 Pagination

**Offset-based.** The `offset` param increments by the `limit` value (default 30).

```python
offset = 0
while True:
    data = await fetch(url, params={"offset": offset, "limit": 30})
    if not data["listings"]:
        break
    offset += 30
```

The response includes `totalCount`. Calculate max pages upfront and use `asyncio.gather` for concurrent page fetches.

### 2.3 Anti-Bot & Login Walls

- **Protection:** High. PerimeterX is deployed. HTML scraping will fail almost immediately.
- **Strategy:** Target the JSON API endpoints, not HTML. Use `curl_cffi` with Chrome impersonation + realistic headers.
- **Session requirement:** A valid session cookie (`mb_session`) helps bypass rate limits. Harvest one via a single Playwright browser cold-start, then reuse across all `curl_cffi` requests.
- **Login wall:** Not required for search results. Individual property contact details are behind login.

### 2.4 Free API

**No.** No public or partner API. All usable endpoints are internal. Treat the mobile-app REST endpoints as your working layer.

---

## 3. 99acres

### 3.1 Locality Fetching

99acres uses a **locality slug + city code** system in URLs and a numeric `locality_id` in their internal APIs.

**Locality resolution:**
```
GET https://www.99acres.com/api/v2/predict/
  location?term=RS+Puram&city_code=62&type=LOCALITY
```
`city_code` for Coimbatore is `62`. Returns `locality_id` (e.g., `16451`), `locality_name`, and `slug`.

**Direct search URL:**
```
https://www.99acres.com/search/property/buy/rs-puram-coimbatore?
  city=62&locality_id=16451&preference=S&area=16451&budget=-1&property_type=10000000
```

**Internal search API** (from network tab inspection):
```
POST https://www.99acres.com/api/v1/search
Body (JSON):
{
  "city_code": 62,
  "locality_ids": [16451],
  "property_type": ["RENT"],
  "res_com": "R",
  "page_no": 1,
  "page_size": 25
}
```

### 3.2 Pagination

**Page-number based** via `page_no` in the POST body (for the API) or `?page=2` in the HTML URL.

Response includes `total_count`. Run concurrent async requests once you know total pages:
```python
pages = math.ceil(total_count / 25)
tasks = [fetch(page=p) for p in range(1, pages + 1)]
results = await asyncio.gather(*tasks)
```

**Warning:** 99acres actively checks for sequential vs. concurrent requests. Use a `Semaphore(5)` and randomized delay (0.3s–1.2s) between bursts.

### 3.3 Anti-Bot & Login Walls

- **Protection:** High. Cloudflare + custom JS challenge on the HTML layer.
- **Strategy:** Use `curl_cffi` for the POST API endpoints. HTML layer requires Playwright with stealth.
- **Login wall:** Listings visible without login. Contact info behind OTP/login. Occasionally, the search API returns a `auth_required` flag after >50 requests from the same IP — rotate proxies.
- **Cookie requirement:** `99_SID` and `_fbp` cookies help. Bootstrap via a single Playwright session.

### 3.4 Free API

**No.** No public API. The POST endpoint above is internal and undocumented.

---

## 4. Housing.com

### 4.1 Locality Fetching

Housing.com uses **GraphQL** as their primary data layer — this is your cleanest target.

**GraphQL endpoint:**
```
POST https://housing.com/api/graphql
```

**Locality autocomplete query:**
```graphql
query {
  searchSuggestions(query: "RS Puram Coimbatore", limit: 5) {
    id
    type
    name
    city { id name }
    coordinates { lat lng }
  }
}
```

**Listing search query:**
```graphql
query ListingsSearch($input: SearchInput!) {
  listings(input: $input) {
    totalCount
    edges {
      node {
        id title price area bhk
        locality { id name }
        postedAt updatedAt
        images { url }
      }
    }
  }
}

Variables:
{
  "input": {
    "listingType": "RENT",
    "localityIds": ["<RESOLVED_ID>"],
    "cityId": "<CITY_ID>",
    "page": 1,
    "limit": 30
  }
}
```

**Required headers:**
```
Content-Type: application/json
x-housing-client: web
Referer: https://housing.com/
```

### 4.2 Pagination

GraphQL cursor-based via `page` + `limit` in the variables, or true cursor with `after: "<cursor>"` on the `listings` connection. Both patterns exist depending on query version — inspect actual network traffic to confirm which version is live.

### 4.3 Anti-Bot & Login Walls

- **Protection:** Medium. Less aggressive than 99acres/MagicBricks. Cloudflare is present but the GraphQL endpoint is reachable via `curl_cffi`.
- **Login wall:** No — search results are fully public. Phone numbers are behind OTP.
- **Rate limit:** ~100–150 GraphQL requests/min before throttling. Use `Semaphore(8)`.

### 4.4 Free API

**No official API.** The GraphQL endpoint is internal. However, it's the most stable and structured of all 8 platforms, making it the closest to a "real API" experience.

---

## 5. NoBroker

### 5.1 Locality Fetching

NoBroker has a **REST API** that's relatively accessible. They use a lat/lng bounding box OR a `localityName` + `city` combo.

**Locality search:**
```
GET https://www.nobroker.in/api/v1/public/locality/autocomplete?
  city=coimbatore&term=RS+Puram
```
Returns `localityId`, `localityName`, `lat`, `lng`.

**Listing search:**
```
GET https://www.nobroker.in/api/v1/public/search?
  city=coimbatore
  &localityId=<ID>
  &listingType=rent
  &propertyType=apartment
  &offset=0
  &limit=20
```

NoBroker also supports bounding box queries — useful if locality ID resolution fails:
```
&neLat=11.017&neLng=76.979&swLat=11.003&swLng=76.963
```

### 5.2 Pagination

**Offset + limit.** The API returns `totalCount`. Increment `offset` by `limit` (default 20). Max concurrent requests: keep to `Semaphore(6)` — NoBroker's backend is more sensitive than others.

### 5.3 Anti-Bot & Login Walls

- **Protection:** Medium-High. NoBroker aggressively gates **contact info and full address** behind login. However, listing title, price, BHK, and locality are visible without auth.
- **Login wall on scroll:** On the HTML site, a login modal appears after ~3 listings. The REST API does NOT enforce this — target the API exclusively.
- **Auth token:** Some endpoints require a `Bearer` token in the `Authorization` header. You can generate a guest token:
  ```
  POST https://www.nobroker.in/api/v1/public/user/guestToken
  ```
  Reuse this token across all requests. Rotate by generating a new guest token every ~200 requests.

### 5.4 Free API

**Closest to free.** The guest token mechanism is effectively an unauthenticated API. No official docs, but the REST endpoints are stable and return clean JSON.

---

## 6. PropTiger

### 6.1 Locality Fetching

PropTiger (owned by REA Group / Housing.com parent) uses a **city slug + locality slug** in URLs and numeric IDs in their API.

**Locality resolution:**
```
GET https://www.proptiger.com/api/v1/entity/location/
  search?term=RS+Puram&citySlug=coimbatore&type=locality
```
Returns `localityId`, `localityName`, `cityId`.

**Search URL pattern:**
```
https://www.proptiger.com/coimbatore/rs-puram-area-apartment-for-rent-<LOCALITY_ID>
```

**Internal API:**
```
GET https://www.proptiger.com/api/v1/listings?
  city_id=<ID>
  &locality_id=<ID>
  &property_category=Residential
  &listing_type=rent
  &page=1
  &per_page=25
```

### 6.2 Pagination

**Page-based** (`page` param). Response includes `total_pages`. Straightforward to parallelize.

### 6.3 Anti-Bot & Login Walls

- **Protection:** Low-Medium. The lightest anti-bot of all 8. No Cloudflare on API endpoints. `curl_cffi` with standard Chrome headers works reliably.
- **Login wall:** None for search results. Contact info behind login.
- **Note:** PropTiger and Housing.com share some backend infrastructure — if Housing.com cookies are present, they sometimes carry over.

### 6.4 Free API

**No public API.** The internal endpoints are accessible without auth tokens but are undocumented.

---

## 7. Makaan

### 7.1 Locality Fetching

Makaan (also REA Group) mirrors PropTiger's structure closely. They share a similar backend.

**Locality resolution:**
```
GET https://www.makaan.com/api/v1/entity/location/
  search?term=RS+Puram&citySlug=coimbatore
```

**Search URL:**
```
https://www.makaan.com/coimbatore-residential-property/rent/
  rs-puram-locality-<LOCALITY_ID>
```

**Internal API:**
```
GET https://www.makaan.com/api/v1/listings?
  city_id=<ID>&locality_id=<ID>
  &listing_type=rent&page=1&per_page=25
```

### 7.2 Pagination

Same as PropTiger — **page-based**, `page` param, response has `total_pages`.

### 7.3 Anti-Bot & Login Walls

- **Protection:** Low. Makaan has the weakest bot defenses of all 8. Standard `curl_cffi` requests succeed without any stealth measures.
- **Login wall:** None for search listing data.
- **Rate limit:** Generous. ~200 req/min before any issues.

### 7.4 Free API

**No.** Internal only. But the low protection means it behaves like one.

---

## 8. QuikrHomes

### 8.1 Locality Fetching

QuikrHomes is the most technically challenging platform. Their search is almost entirely **JavaScript-rendered** with no clean REST API surface.

**Locality resolution — Playwright required:**
```python
async with async_playwright() as p:
    browser = await p.chromium.launch(headless=True)
    page = await browser.new_page()
    await page.goto("https://www.quikr.com/homes")
    await page.fill('[placeholder="Search locality"]', "RS Puram, Coimbatore")
    # Intercept the XHR response for locality suggestions
    async with page.expect_response("**/autosuggest**") as resp:
        await page.click(".suggestion-item")
    data = await resp.value.json()
```

**URL structure:**
```
https://www.quikr.com/homes/rent/apartments-in-rs-puram-coimbatore-<LOCALITY_SLUG_ID>
```

The locality slug ID is embedded in the page after JS renders. Extract via:
```python
content = await page.content()
# Parse for canonical URL or JSON-LD `@id` field
```

### 8.2 Pagination

**Infinite scroll / JS-based.** No clean page param. Use Playwright to trigger scroll events:

```python
prev_count = 0
while True:
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.wait_for_timeout(2000)
    cards = await page.query_selector_all(".listing-card")
    if len(cards) == prev_count:
        break  # No more results loaded
    prev_count = len(cards)
```

Alternatively, intercept the XHR calls made during scroll to extract the underlying paginated API and replay those requests with `curl_cffi`.

### 8.3 Anti-Bot & Login Walls

- **Protection:** High. Quikr uses PerimeterX and aggressive bot detection on their HTML layer. Playwright with `playwright-stealth` plugin is required.
- **Headless detection:** Yes. Set `args=["--disable-blink-features=AutomationControlled"]` and use a real user agent.
- **Login wall:** Quikr increasingly pushes login modals after a few page loads. Handle modal dismissal in Playwright before scraping.
- **Recommended approach:** Use Playwright only to **resolve locality URLs and intercept XHR API calls**. Once you've captured the underlying API pattern, switch to `curl_cffi` for bulk fetching.

### 8.4 Free API

**No.** No public API. Their mobile app uses GraphQL-like endpoints but they're heavily authenticated.

---

## Cross-Platform Architecture Recommendations

### Scraper Class Structure

```
AsyncRentalScraper/
├── core/
│   ├── session.py          # curl_cffi session factory with Chrome impersonation
│   ├── playwright_pool.py  # Async browser pool (2–3 instances max)
│   └── rate_limiter.py     # Per-domain semaphore + jitter
├── resolvers/
│   ├── locality_resolver.py  # Unified interface: platform → locality_id
│   └── city_codes.py         # Hardcoded city_id maps for all 8 platforms
├── scrapers/
│   ├── olx.py
│   ├── magicbricks.py
│   ├── 99acres.py
│   ├── housing.py
│   ├── nobroker.py
│   ├── proptiger.py
│   ├── makaan.py
│   └── quikrhomes.py
└── models/
    └── listing.py          # Unified Pydantic model for normalized output
```

### Per-Platform Semaphore Limits

| Platform | Max Concurrent | Delay (jitter) | Method |
|---|---|---|---|
| OLX | 10 | 0.3–0.8s | curl_cffi |
| MagicBricks | 6 | 0.5–1.2s | curl_cffi + session cookie |
| 99acres | 5 | 0.3–1.2s | curl_cffi + session cookie |
| Housing.com | 8 | 0.2–0.6s | curl_cffi (GraphQL) |
| NoBroker | 6 | 0.4–0.9s | curl_cffi + guest token |
| PropTiger | 10 | 0.2–0.5s | curl_cffi |
| Makaan | 12 | 0.1–0.4s | curl_cffi |
| QuikrHomes | 2 | 1.5–3.0s | Playwright |

### Session Bootstrap Strategy

For platforms requiring cookies (MagicBricks, 99acres, NoBroker):

1. **Cold start:** Launch one Playwright browser, visit the platform homepage, complete any Cloudflare challenge. 
2. **Export cookies** to a dict.
3. **Inject into curl_cffi** session for all subsequent requests.
4. **Refresh interval:** Every 45–60 minutes or on 429 response.

### Locality ID Caching

Pre-resolve and cache all locality IDs to avoid redundant resolution calls:

```python
# locality_cache.json
{
  "RS Puram, Coimbatore": {
    "olx": "4058467",
    "magicbricks": "16234",
    "99acres": "16451",
    "housing": "loc_xyz123",
    "nobroker": "9823",
    "proptiger": "45621",
    "makaan": "45621",
    "quikr_slug": "rs-puram-coimbatore-112233"
  }
}
```

Run resolution once, persist to disk, refresh weekly.

---

## Platform Priority for Zonek

Given Zonek's focus on South Indian cities with commercial/residential data:

| Priority | Platform | Reason |
|---|---|---|
| 🥇 1 | OLX | Cleanest API, no auth, widest residential coverage in Tier-2 cities |
| 🥇 1 | NoBroker | Strongest in South India, guest token API is reliable |
| 🥈 2 | Housing.com | GraphQL = structured data, good Coimbatore coverage |
| 🥈 2 | MagicBricks | High volume but needs session management |
| 🥉 3 | PropTiger/Makaan | Light defenses, good for cross-validation |
| ⚠️ 4 | 99acres | High protection, worthwhile but costly in proxy spend |
| ⚠️ 4 | QuikrHomes | Playwright-heavy, use only if coverage gaps exist |

---

*Last verified: April 2026. Platform APIs change without notice — validate endpoints against live network traffic before production runs.*