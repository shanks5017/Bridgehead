# Zonek — Data Integration Reference
14 modules · endpoints, fetch method, auth, and IDE prompt for each

---

## [01] Crop Prices
- **Source:** data.gov.in / Agmarknet
- **Method:** API
- **Tags:** `api`, `free`, `daily`

### Endpoints
- **URL:** [https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=YOUR_KEY&format=json&filters[state]=Tamil+Nadu](https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=YOUR_KEY&format=json&filters[state]=Tamil+Nadu)
  - *Note:* Live mandi prices — filter by state, commodity, date
- **URL:** [https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=YOUR_KEY&format=json&filters[commodity]=Tomato](https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=YOUR_KEY&format=json&filters[commodity]=Tomato)
  - *Note:* Commodity-wise filter

### Steps to Integrate
1. Register at data.gov.in → get free API key from My Account
2. Hit the endpoint above with your key
3. Params: state, district, commodity, market, fromDate, toDate
4. Returns: min_price, max_price, modal_price, arrival_date, market_name
5. Poll daily via cron job → store in MongoDB

### IDE AI Prompt
> Fetch crop price data from data.gov.in API using key stored in .env as DATA_GOV_KEY. Filter by state=Tamil Nadu, return JSON with fields: commodity, market, modal_price, date. Store in MongoDB collection cropPrices with TTL index of 7 days.

---

## [02] Weather
- **Source:** IMD mausam.imd.gov.in (IP whitelisted) + Open-Meteo fallback
- **Method:** API
- **Tags:** `api`, `free`, `hourly`

### Endpoints
- **URL:** [https://mausam.imd.gov.in/api/current_wx_api.php?id=43279](https://mausam.imd.gov.in/api/current_wx_api.php?id=43279)
  - *Note:* Current weather — Chennai station (ID 43279). Requires IP whitelist from IMD.
- **URL:** [https://city.imd.gov.in/api/cityweather.php?id=42182](https://city.imd.gov.in/api/cityweather.php?id=42182)
  - *Note:* 7-day city forecast. Requires IP whitelist.
- **URL:** [https://api.open-meteo.com/v1/forecast?latitude=11.0168&longitude=76.9558&hourly=temperature_2m,precipitation&timezone=Asia/Kolkata](https://api.open-meteo.com/v1/forecast?latitude=11.0168&longitude=76.9558&hourly=temperature_2m,precipitation&timezone=Asia/Kolkata)
  - *Note:* Open-Meteo fallback — FREE, no auth, hourly data for Coimbatore

### Steps to Integrate
1. Submit IP whitelist request at mausam.imd.gov.in/responsive/apis.php
2. While waiting, use Open-Meteo as fallback (zero registration)
3. IMD: poll current_wx_api.php every hour per station
4. Station IDs: Chennai=43279, Coimbatore=43230, Bangalore=43295, Hyderabad=43128
5. Once whitelisted, switch to IMD; keep Open-Meteo as backup

### IDE AI Prompt
> Create a weather service module. Primary: GET https://mausam.imd.gov.in/api/current_wx_api.php?id={stationId} — returns temp, humidity, wind, rainfall. Fallback: Open-Meteo API at api.open-meteo.com/v1/forecast with lat/lon params. Cache results in Redis with 1hr TTL. Export getWeather(cityName) function that maps city to station ID.

---

## [03] Rainfall
- **Source:** IMD — same whitelist as Weather
- **Method:** API
- **Tags:** `api`, `free`, `daily`

### Endpoints
- **URL:** [https://mausam.imd.gov.in/api/statewise_rainfall_api.php](https://mausam.imd.gov.in/api/statewise_rainfall_api.php)
  - *Note:* State-wise daily rainfall — same IP whitelist as weather API
- **URL:** [https://mausam.imd.gov.in/api/districtwise_rainfall_api.php](https://mausam.imd.gov.in/api/districtwise_rainfall_api.php)
  - *Note:* District-wise rainfall
- **URL:** [https://api.data.gov.in/resource/RAINFALL_DATASET_ID?api-key=YOUR_KEY](https://api.data.gov.in/resource/RAINFALL_DATASET_ID?api-key=YOUR_KEY)
  - *Note:* data.gov.in rainfall catalog as fallback

### Steps to Integrate
1. Covered by same IMD whitelist request as Weather — no separate registration
2. statewise_rainfall_api.php → daily state totals
3. districtwise_rainfall_api.php → district-level breakdown
4. Poll once daily at 9AM IST after IMD updates at 0830 IST
5. Fallback: data.gov.in rainfall catalog with existing API key

### IDE AI Prompt
> Add rainfall module to weather service. GET https://mausam.imd.gov.in/api/districtwise_rainfall_api.php — returns district, state, rainfall_mm, date. Schedule daily cron at 09:00 IST. Store in MongoDB collection rainfall. Join with cropPrices collection on district field for market intelligence scoring.

---

## [04] Dam Levels
- **Source:** India WRIS / data.gov.in
- **Method:** API
- **Tags:** `api`, `free`, `daily`

### Endpoints
- **URL:** [https://indiawris.gov.in/wris/#/](https://indiawris.gov.in/wris/#/)
  - *Note:* India WRIS portal — register for API access
- **URL:** [https://www.data.gov.in/catalog?q=reservoir+storage](https://www.data.gov.in/catalog?q=reservoir+storage)
  - *Note:* CWC weekly reservoir data via existing data.gov.in key
- **URL:** [https://cwc.gov.in](https://cwc.gov.in)
  - *Note:* Central Water Commission — direct downloads

### Steps to Integrate
1. Register at indiawris.gov.in for API access
2. Immediately usable: search 'reservoir' on data.gov.in with existing key
3. Key datasets: Weekly Reservoir Storage Bulletin by CWC
4. Filter by state for TN, Karnataka, AP, Telangana, Kerala reservoirs
5. Poll weekly — data updates every Thursday from CWC

### IDE AI Prompt
> Fetch reservoir/dam level data from data.gov.in API. Use existing DATA_GOV_KEY. Search catalog for reservoir storage datasets. Fetch weekly, store in MongoDB collection damLevels with fields: dam_name, state, district, current_level, capacity, percentage_full, date. Create utility function getDamsByState(stateName).

---

## [05] Schemes
- **Source:** myScheme.gov.in internal API
- **Method:** API
- **Tags:** `api`, `free`, `weekly`

### Endpoints
- **URL:** [https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=agriculture&state=Tamil+Nadu](https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=agriculture&state=Tamil+Nadu)
  - *Note:* Public internal API — no auth needed. Filter by query and state.
- **URL:** [https://api.myscheme.gov.in/search/v4/schemes?lang=en&category=Business+%26+Entrepreneurship](https://api.myscheme.gov.in/search/v4/schemes?lang=en&category=Business+%26+Entrepreneurship)
  - *Note:* Category filter — Business & Entrepreneurship
- **URL:** [https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=farmer&state=Karnataka](https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=farmer&state=Karnataka)
  - *Note:* Farmer schemes in Karnataka

### Steps to Integrate
1. Test URL directly in browser — should return JSON with no auth
2. If auth required, register at apisetu.gov.in as consumer
3. Params: lang, q (keyword), state, category
4. Returns: scheme name, ministry, eligibility, benefits, apply URL
5. Sync weekly via cron — data changes rarely

### IDE AI Prompt
> Fetch government schemes from https://api.myscheme.gov.in/search/v4/schemes. No auth needed. Params: lang=en, state={stateName}, category={category}. Store in MongoDB collection schemes. Create getRelevantSchemes(businessType, state) function that returns schemes matching the business type for Zonek market reports.

---

## [06] Elections
- **Source:** results.eci.gov.in + data.gov.in
- **Method:** Scrape
- **Tags:** `scrape`, `free`, `post-election`

### Endpoints
- **URL:** [https://results.eci.gov.in](https://results.eci.gov.in)
  - *Note:* Live results during election — structured HTML with constituency data
- **URL:** [https://www.data.gov.in/keywords/Election](https://www.data.gov.in/keywords/Election)
  - *Note:* Historical election data via existing data.gov.in key
- **URL:** [https://github.com/thecont1/india-votes-data](https://github.com/thecont1/india-votes-data)
  - *Note:* Pre-scraped ECI data — JSON/CSV, constituency-wise with candidates and votes

### Steps to Integrate
1. Clone github.com/thecont1/india-votes-data for historical constituency-wise data
2. For real-time: open results.eci.gov.in → F12 → Network → XHR
3. Copy internal API endpoints that load constituency results as JSON
4. For historical: use data.gov.in electoral statistics with existing key
5. Data updates only on election result day — no daily polling needed

### IDE AI Prompt
> Load election data from local JSON files cloned from github.com/thecont1/india-votes-data. Parse constituency-wise results into MongoDB collection elections with fields: state, constituency, winner, party, votes, year. Create getElectionProfile(district) function returning ruling party and vote margin for Zonek political risk scoring.

---

## [07] Budget & Revenue
- **Source:** data.gov.in / RBI / Ministry of Finance
- **Method:** PDF/Excel
- **Tags:** `pdf`, `free`, `annual`

### Endpoints
- **URL:** [https://www.data.gov.in/catalog?q=state+budget](https://www.data.gov.in/catalog?q=state+budget)
  - *Note:* State budget datasets on data.gov.in — existing key
- **URL:** [https://rbi.org.in/scripts/PublicationsView.aspx?id=21270](https://rbi.org.in/scripts/PublicationsView.aspx?id=21270)
  - *Note:* RBI State Finances report — downloadable PDF/Excel
- **URL:** [https://www.indiabudget.gov.in](https://www.indiabudget.gov.in)
  - *Note:* Union Budget — Excel statements available

### Steps to Integrate
1. data.gov.in: search 'state budget revenue expenditure' — download CSV
2. RBI: download State Finances study annually — has district revenue data
3. Parse Excel tables with xlsx npm package or python openpyxl
4. Load into MongoDB collection budgetData
5. Update annually after Union Budget (Feb) and state budgets (March)

### IDE AI Prompt
> Parse state budget Excel files downloaded from RBI State Finances report. Use xlsx npm package. Extract columns: state, year, revenue_receipts, capital_expenditure, fiscal_deficit. Store in MongoDB collection budgetData. Create getBudgetProfile(stateName, year) utility function.

---

## [08] Infrastructure
- **Source:** Google News RSS + NewsData.io
- **Method:** RSS
- **Tags:** `rss`, `free`, `hourly`

### Endpoints
- **URL:** [https://news.google.com/rss/search?q=infrastructure+Tamil+Nadu&hl=en-IN&gl=IN&ceid=IN:en](https://news.google.com/rss/search?q=infrastructure+Tamil+Nadu&hl=en-IN&gl=IN&ceid=IN:en)
  - *Note:* Google News RSS — free, no auth, hourly updates
- **URL:** [https://news.google.com/rss/search?q=roads+metro+construction+South+India&hl=en-IN&gl=IN&ceid=IN:en](https://news.google.com/rss/search?q=roads+metro+construction+South+India&hl=en-IN&gl=IN&ceid=IN:en)
  - *Note:* Construction news RSS
- **URL:** [https://newsdata.io/api/1/news?apikey=YOUR_KEY&q=infrastructure&country=in&language=en](https://newsdata.io/api/1/news?apikey=YOUR_KEY&q=infrastructure&country=in&language=en)
  - *Note:* NewsData.io — 200 free requests/day, register at newsdata.io

### Steps to Integrate
1. Use Google News RSS directly — no registration needed
2. Register at newsdata.io for 200 free requests/day as backup
3. Install rss-parser npm package in Node.js
4. Parse: title, source, published date, link from RSS XML
5. Poll every 6 hours, deduplicate by URL, store in MongoDB

### IDE AI Prompt
> Create infrastructure news module. Use rss-parser npm package to fetch https://news.google.com/rss/search?q=infrastructure+{stateName}&hl=en-IN&gl=IN&ceid=IN:en. Parse items: title, link, pubDate, source. Deduplicate by link field. Store in MongoDB collection newsInfrastructure with TTL of 30 days. Schedule cron every 6 hours.

---

## [09] Schools
- **Source:** data.gov.in (UDISE+) + kys.udiseplus.gov.in DevTools
- **Method:** API
- **Tags:** `api`, `free`, `annual`

### Endpoints
- **URL:** [https://www.data.gov.in/catalog/unified-district-information-system-education-plus-udise-plus](https://www.data.gov.in/catalog/unified-district-information-system-education-plus-udise-plus)
  - *Note:* UDISE+ bulk data — existing data.gov.in key
- **URL:** [https://kys.udiseplus.gov.in](https://kys.udiseplus.gov.in)
  - *Note:* Know Your School — open DevTools → Network to find internal JSON endpoints
- **URL:** [https://dataful.in/datasets/20822/](https://dataful.in/datasets/20822/)
  - *Note:* Pre-cleaned UDISE+ CSV 2021-2025 — free download, no auth

### Steps to Integrate
1. Download UDISE+ CSV from dataful.in/datasets/20822 — no registration
2. Or use data.gov.in UDISE+ catalog with existing key
3. For live school lookup: open kys.udiseplus.gov.in → F12 → Network → search school → copy JSON endpoint
4. Key fields: total_schools, enrollment, teachers, PTR, infrastructure_score per district
5. Update annually — data releases in August each year

### IDE AI Prompt
> Load UDISE+ school data from downloaded CSV file (path: ./data/udise_2024_25.csv). Parse with csv-parse npm package. Fields needed: state, district, total_schools, total_enrollment, teachers, PTR, schools_with_electricity, schools_with_toilet. Store in MongoDB collection schoolData. Create getEducationProfile(districtName) for Zonek district scoring.

---

## [10] Jal Jeevan (JJM)
- **Source:** ejalshakti.gov.in/webapi — Official JJM API
- **Method:** API
- **Tags:** `api`, `free`, `daily`

### Endpoints
- **URL:** [https://ejalshakti.gov.in/webapi/Home/Addregistration](https://ejalshakti.gov.in/webapi/Home/Addregistration)
  - *Note:* Registration page — simple form, no PAN/GST needed
- **URL:** [https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx](https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx)
  - *Note:* Dashboard — use DevTools to find internal POST endpoints while waiting for API key
- **URL:** [https://ejalshakti.gov.in/jjmreport/JJMDistrictView.aspx](https://ejalshakti.gov.in/jjmreport/JJMDistrictView.aspx)
  - *Note:* District-level tap water connection data

### Steps to Integrate
1. Register at ejalshakti.gov.in/webapi/Home/Addregistration — simple email form
2. Download user manual at ejalshakti.gov.in/webapi/Content/JJM_Web_API.pdf
3. While waiting: open JJMDistrictView.aspx → F12 → Network → select state → copy POST endpoint
4. Returns: total_households, FHTC_count, coverage_percentage per district/village
5. Poll monthly — coverage updates regularly

### IDE AI Prompt
> Fetch Jal Jeevan Mission water connection data from JJM official API at ejalshakti.gov.in/webapi. Store API credentials in .env as JJM_API_KEY. Returns district-wise FHTC coverage: total_households, tap_connected, coverage_pct. Store in MongoDB collection jjmData. Create getWaterProfile(districtName) function for Zonek infrastructure scoring.

---

## [11] Housing (PMAY)
- **Source:** rhreporting.nic.in + data.gov.in
- **Method:** Scrape
- **Tags:** `scrape`, `free`, `monthly`

### Endpoints
- **URL:** [https://rhreporting.nic.in/netiay/newreport.aspx](https://rhreporting.nic.in/netiay/newreport.aspx)
  - *Note:* PMAY-G reporting portal — ASP.NET POST requests, use DevTools to extract
- **URL:** [https://www.data.gov.in/catalog?q=pmay](https://www.data.gov.in/catalog?q=pmay)
  - *Note:* Bulk PMAY data — existing data.gov.in key
- **URL:** [https://rhreporting.nic.in/netiay/dataanalytics/data-analytics.aspx](https://rhreporting.nic.in/netiay/dataanalytics/data-analytics.aspx)
  - *Note:* Analytics dashboard — HTML table scraping

### Steps to Integrate
1. Open rhreporting.nic.in → F12 → Network → Fetch/XHR
2. Select State → District → Submit → copy POST request URL + payload
3. Payload format: {stateId:'33', districtId:'xxx', schemeCode:'PMAYG'}
4. Returns: houses_sanctioned, houses_completed, under_construction per district
5. Also available on data.gov.in with existing key — search 'PMAY beneficiary'

### IDE AI Prompt
> Scrape PMAY housing data from rhreporting.nic.in using axios POST requests. Extract stateId and districtId from the site. POST to the report endpoint with form-data payload. Parse HTML response with cheerio npm package. Extract: houses_sanctioned, completed, under_construction. Store in MongoDB collection pmayData. Create getHousingProfile(districtName) function.

---

## [12] Courts
- **Source:** njdg.ecourts.gov.in + data.gov.in
- **Method:** Scrape
- **Tags:** `scrape`, `free`, `weekly`

### Endpoints
- **URL:** [https://njdg.ecourts.gov.in](https://njdg.ecourts.gov.in)
  - *Note:* NJDG dashboard — React app, use DevTools to find JSON endpoints for pendency data
- **URL:** [https://www.data.gov.in/catalog?q=court+pendency](https://www.data.gov.in/catalog?q=court+pendency)
  - *Note:* Court pendency data via existing data.gov.in key
- **URL:** [https://njdg.ecourts.gov.in — Information Management tab](https://njdg.ecourts.gov.in)
  - *Note:* Weekly downloadable CSV/Excel reports from Information Management section

### Steps to Integrate
1. Open njdg.ecourts.gov.in → F12 → Network → select State+District → copy JSON endpoint
2. Alternatively: click Information Management → download weekly Excel
3. For bulk: data.gov.in search 'judicial pendency' with existing key
4. Key fields: pending_cases, disposed_cases, filing_rate per district court
5. Update weekly — reflects business environment and contract enforcement

### IDE AI Prompt
> Fetch court pendency data from NJDG portal. Method 1: download weekly Excel from njdg.ecourts.gov.in Information Management section, parse with xlsx npm package. Method 2: data.gov.in API with key DATA_GOV_KEY. Fields: state, district, court_name, pending_civil, pending_criminal, disposal_rate. Store in MongoDB collection courtData. Create getJudicialProfile(districtName) for Zonek ease-of-business scoring.

---

## [13] Police / Crime
- **Source:** data.gov.in (NCRB) + opencity.in
- **Method:** API
- **Tags:** `api`, `free`, `annual`

### Endpoints
- **URL:** [https://www.data.gov.in/catalog/district-wise-crimes-under-various-sections-indian-penal-code-ipc-crimes](https://www.data.gov.in/catalog/district-wise-crimes-under-various-sections-indian-penal-code-ipc-crimes)
  - *Note:* District-wise IPC crimes — existing data.gov.in key
- **URL:** [https://www.data.gov.in/catalog/district-wise-crimes-committed-against-women](https://www.data.gov.in/catalog/district-wise-crimes-committed-against-women)
  - *Note:* Crimes against women — district level
- **URL:** [https://data.opencity.in/dataset/crime-in-india-2023](https://data.opencity.in/dataset/crime-in-india-2023)
  - *Note:* Pre-parsed NCRB 2023 — free CSV download, no auth

### Steps to Integrate
1. Use existing data.gov.in API key — search NCRB crime datasets
2. Download from data.opencity.in for pre-cleaned CSV — fastest option
3. Key fields: murder, theft, robbery, fraud, cybercrime per district per lakh population
4. Also download direct Excel tables from ncrb.gov.in/crime-in-india-table-content
5. Update annually — NCRB publishes each year in October

### IDE AI Prompt
> Load NCRB crime data from data.gov.in API using DATA_GOV_KEY. Catalog: district-wise-crimes-under-various-sections-indian-penal-code-ipc-crimes. Fields: state, district, year, murder, theft, robbery, cheating, total_ipc_crimes, crime_rate_per_lakh. Store in MongoDB collection crimeData. Create getSafetyScore(districtName) function returning normalized 0-100 safety score for Zonek market feasibility reports.

---

## [14] Population
- **Source:** data.gov.in (Census 2011) + NHM projections
- **Method:** API
- **Tags:** `api`, `free`, `decennial`

### Endpoints
- **URL:** [https://www.data.gov.in/catalog?q=census+2011+district](https://www.data.gov.in/catalog?q=census+2011+district)
  - *Note:* Census 2011 district data — existing data.gov.in key
- **URL:** [https://github.com/datameet/india-census](https://github.com/datameet/india-census)
  - *Note:* Pre-cleaned Census GeoJSON + CSV — community maintained, free download
- **URL:** [https://www.kaggle.com/datasets/danofer/india-census](https://www.kaggle.com/datasets/danofer/india-census)
  - *Note:* Clean Kaggle dataset — district-wise population, literacy, workers
- **URL:** [https://nhm.gov.in](https://nhm.gov.in)
  - *Note:* NHM annual projections — fills gap between Census 2011 and present

### Steps to Integrate
1. Download from github.com/datameet/india-census — clean CSV, no registration
2. Or Kaggle dataset — free download after login
3. Key fields: population, male/female, literacy_rate, urban_pct, workers, SC/ST pct
4. For current estimates: download NHM population projections from nhm.gov.in
5. Census 2021 not yet released — NHM projections are the best current data

### IDE AI Prompt
> Load Census 2011 data from local CSV (./data/census_2011_districts.csv) downloaded from github.com/datameet/india-census. Parse with csv-parse. Fields: state, district, population, male, female, literacy_rate, urban_population, rural_population, workers. Supplement with NHM projections CSV for current estimates. Store in MongoDB collection populationData. Create getDemographicProfile(districtName) returning population density, literacy, urban ratio for Zonek Market Potential Score calculation.
