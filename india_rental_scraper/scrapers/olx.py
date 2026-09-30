"""
scrapers/olx.py
OLX.in — commercial shop rental listings scraper.
Uses the /api/relevance/v4/search REST API via curl_cffi.

Key parameters (verified from live browser network traffic):
  - location_id: OLX numeric city/locality ID
  - category: 1731 = "For Rent: Shops & Offices" (VERIFIED)
  - brand: olx
  - lang: en-IN
  - page: 0-indexed
"""
import argparse
import math
import sys
import os
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scrapers.base_scraper import BaseScraper
from config import MAX_PAGES
from utils.helpers import (
    clean_price, clean_area, calculate_rent_per_sqft,
    parse_date, normalize_property_type, normalize_furnishing, extract_facing,
)
from resolvers.locality_resolver import locality_resolver, OLX_CITY_IDS
from core.session import session_manager
from core.rate_limiter import get_rate_limiter

# Expose for check_all.py
_OLX_LOCATION_IDS = OLX_CITY_IDS


class OLXScraper(BaseScraper):
    platform_key    = "olx"
    display_name    = "OLX"
    uses_playwright = False

    async def _resolve_geo_id(self, city_name: str, session) -> str | None:
        if not city_name:
            return None
        slug = city_name.lower().strip().replace(" ", "-")
        url = f"https://www.olx.in/{slug}/q-commercial-properties?isSearchCall=true"
        try:
            resp = await session.get(url, allow_redirects=False, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }, timeout=10)
            if resp.status_code in (301, 302, 307, 308):
                location_header = resp.headers.get("Location")
                if location_header and "_g" in location_header:
                    import re
                    match = re.search(r'_g(\d+)', location_header)
                    if match:
                        return match.group(1)
        except Exception as e:
            self.logger.debug(f"[OLX] Geo ID resolution failed for '{city_name}': {e}")
        return None

    async def scrape_city_location(self, location_ctx) -> list[dict]:
        city     = location_ctx.city     or location_ctx.raw_input
        locality = location_ctx.locality or ""

        location_id = None
        if location_ctx.city:
            # Let's see if we have it in the hardcoded map
            city_key = location_ctx.city.lower().strip()
            location_id = OLX_CITY_IDS.get(city_key)

        if not location_id:
            self.logger.info("[OLX] No location_id for %s. Proceeding without location_id.", city)

        self.logger.info("[OLX] Scraping city=%s locality=%s (location_id=%s)", city, locality, location_id)
        docs = await self._scrape_via_api(city, locality, location_id)

        # Quality filter: drop junk listings
        docs = self._quality_filter(docs, city, locality)
        return docs

    def _quality_filter(self, docs: list[dict], city: str, locality: str) -> list[dict]:
        """
        Remove:
          - Listings with price < Rs.8,000 (furniture, services, not spaces)
          - Listings whose location tag belongs to a different city
          - Non-space listings (sale, furniture) inferred from title signals
        """
        import re

        city_clean     = re.sub(r'[^a-z0-9]', '', city.lower())
        loc_clean      = re.sub(r'[^a-z0-9]', '', locality.lower()) if locality else ""
        MIN_RENT       = 2_000   # Reduced to allow small shops in tier 2/3 cities
        SALE_SIGNALS   = ["for sale", " sale ", "selling", "sell ", " sold"]
        JUNK_SIGNALS   = ["furniture", "keyboard", "table", "chair", "laptop",
                          "computer", "sofa", "almirah", "books", "study table"]

        filtered = []
        for d in docs:
            title_low = (d.get("title") or "").lower()
            desc_low  = (d.get("description") or "").lower()
            price     = d.get("rent_per_month")

            # Drop product/furniture listings (ONLY check title, description often has these for furnished shops)
            if any(sig in title_low for sig in JUNK_SIGNALS):
                self.logger.debug("[OLX] Dropped junk: %s", d.get("title", "")[:60])
                continue

            # Drop sale listings (ONLY check title, description might say "not for sale")
            if any(sig in title_low for sig in SALE_SIGNALS):
                self.logger.debug("[OLX] Dropped sale listing: %s", d.get("title", "")[:60])
                continue

            # Drop below minimum rent floor
            if price and price < MIN_RENT:
                self.logger.debug("[OLX] Dropped below rent floor (Rs.%s): %s", price, d.get("title", "")[:40])
                continue

            # Cross-city check: if a different city name appears in the title/desc/locality, drop it
            KNOWN_CITIES = {
                "lucknow", "mumbai", "delhi", "pune", "kolkata", "chennai",
                "hyderabad", "ahmedabad", "jaipur", "surat", "kanpur",
                "nagpur", "bhopal", "indore", "patna", "vadodara",
                "chandigarh", "mohali", "noida", "gurgaon", "kochi", "coimbatore"
            }
            # Remove the current searched city from the forbidden list
            forbidden_cities = KNOWN_CITIES - {city_clean, city.lower().replace(" ", "")}
            
            ad_locality = re.sub(r'[^a-z0-9]', '', (d.get("locality") or "").lower())
            
            wrong_city_found = False
            for fc in forbidden_cities:
                if fc in ad_locality or fc in title_low:
                    wrong_city_found = True
                    self.logger.debug("[OLX] Dropped cross-city spam (%s): %s", fc, d.get("title", "")[:40])
                    break
            
            if wrong_city_found:
                continue

            filtered.append(d)

        # Locality keyword filter (as before)
        if loc_clean and filtered:
            def clean_text(text):
                return re.sub(r'[^a-z0-9]', '', (text or "").lower())
            locality_matched = [d for d in filtered if
                                loc_clean in clean_text(d.get("locality"))
                                or loc_clean in clean_text(d.get("title"))
                                or loc_clean in clean_text(d.get("description"))]
            if locality_matched:
                self.logger.info("[OLX] Post-filtered %d -> %d listings for locality '%s'",
                                 len(filtered), len(locality_matched), locality)
                return locality_matched

        self.logger.info("[OLX] Quality-filtered: %d listings kept", len(filtered))
        return filtered

    async def _scrape_via_api(self, city: str, locality: str, location_id: str) -> list[dict]:
        all_docs: list[dict] = []
        session = session_manager.get_session()
        limiter = get_rate_limiter(self.platform_key)

        base_url = "https://www.olx.in/api/relevance/v4/search"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept":     "application/json",
            "Referer":    "https://www.olx.in/",
        }

        total_pages = MAX_PAGES

        geo_id = await self._resolve_geo_id(city, session)
        if geo_id:
            self.logger.info("[OLX] Using dynamically resolved geo_id=%s for %s", geo_id, city)
        elif location_id:
            self.logger.info("[OLX] Using static location_id=%s for %s", location_id, city)
        else:
            self.logger.info("[OLX] No location_id for %s. Proceeding with text-only search.", city)

        for page in range(0, MAX_PAGES):   # OLX API is 0-indexed
            params = {
                "category":    "1731",   # VERIFIED: "For Rent: Shops & Offices"
                "ad_type":     "offer",  # offer = user listing (FOR RENT); skip "wanted" ads
                "size":        "40",     # max allowed size
                "brand":       "olx",
                "lang":        "en-IN",
                "page":        str(page),
            }
            if geo_id:
                params["location"] = geo_id
            elif location_id:
                params["location_id"] = location_id
                
            if locality:
                params["query"] = locality
            elif not geo_id and not location_id:
                params["query"] = city

            retry_count = 0
            data = None

            while retry_count < 3:
                try:
                    async with limiter:
                        resp = await session.get(
                            base_url, params=params, headers=headers, timeout=20,
                        )
                    if resp.status_code == 429:
                        wait = 5 * (retry_count + 1)
                        self.logger.warning("[OLX] Rate-limited on page %d — waiting %ds", page, wait)
                        await asyncio.sleep(wait)
                        retry_count += 1
                        continue
                    if resp.status_code in [403, 404, 500, 502, 503]:
                        self.logger.warning("[OLX] Status %d on page %d — stopping", resp.status_code, page)
                        return all_docs
                    data = resp.json()
                    break
                except Exception as e:
                    self.logger.warning("[OLX] Fetch error page %d (retry %d): %s", page, retry_count, e)
                    retry_count += 1
                    await asyncio.sleep(2)

            if data is None:
                self.logger.error("[OLX] All retries failed on page %d", page)
                break

            ads = data.get("data", [])

            # On the first page, determine total pages from metadata
            if page == 0:
                meta = data.get("metadata") or {}
                total_count = (
                    meta.get("total_ads")
                    or meta.get("totalElements")
                    or meta.get("totalCount")
                    or meta.get("numFound")
                    or len(ads)
                )
                total_pages = min(math.ceil(total_count / 25), MAX_PAGES) if total_count else 1
                self.logger.info("[OLX] Total elements=%d → pages=%d", total_count, total_pages)

            if not ads:
                self.logger.debug("[OLX] Empty page %d — stopping", page)
                break

            page_docs = [self._api_ad_to_doc(ad, city) for ad in ads if ad]
            valid     = [d for d in page_docs if d and d.get("listing_url")]
            all_docs.extend(valid)
            self.logger.debug("[OLX] Page %d: +%d listings", page, len(valid))

            if page >= total_pages - 1:
                break

        self.logger.info("[OLX] Fetched %d total listings", len(all_docs))
        return all_docs

    def _api_ad_to_doc(self, ad: dict, city: str) -> dict | None:
        ad_id = ad.get("id") or ad.get("ad_id") or ""
        if not ad_id:
            return None
        listing_url = f"https://www.olx.in/item/{ad_id}"

        price_data     = ad.get("price") or {}
        raw_price      = price_data.get("display") or price_data.get("value") or str(ad.get("amount", ""))
        rent_per_month = clean_price(str(raw_price))

        locations = ad.get("locations", [])
        loc_res   = ad.get("locations_resolved", {})
        
        # Extract the true city and locality from OLX's resolved metadata
        true_city = loc_res.get("ADMIN_LEVEL_3_name") or city
        locality  = loc_res.get("SUBLOCALITY_LEVEL_1_name") or city
        state     = loc_res.get("ADMIN_LEVEL_1_name") or ""
        
        lat, lon = None, None
        if locations and isinstance(locations, list):
            if not loc_res:
                locality = locations[0].get("name") or city
            lat = locations[0].get("lat")
            lon = locations[0].get("lon")
            
        address = ", ".join(filter(bool, [locality, true_city, state]))

        # Drop promoted ads from completely different cities
        t_city_clean = true_city.lower().replace(" ", "")
        r_city_clean = city.lower().replace(" ", "")
        
        SYNONYMS = {
            "bangalore": "bengaluru",
            "bengaluru": "bangalore",
            "belgaum": "belagavi",
            "belagavi": "belgaum",
            "mumbai": "bombay",
            "bombay": "mumbai",
            "chennai": "madras",
            "madras": "chennai",
            "kolkata": "calcutta",
            "calcutta": "kolkata",
            "pune": "poona",
            "poona": "pune",
            "gurgaon": "gurugram",
            "gurugram": "gurgaon",
            "kochi": "cochin",
            "cochin": "kochi",
            "trivandrum": "thiruvananthapuram",
            "thiruvananthapuram": "trivandrum"
        }
        
        # Check if the true city matches the requested city or its synonym
        if t_city_clean and r_city_clean not in t_city_clean and t_city_clean not in r_city_clean:
            # If not a direct match, check synonyms
            syn_r = SYNONYMS.get(r_city_clean)
            syn_t = SYNONYMS.get(t_city_clean)
            if not (syn_r and syn_r in t_city_clean) and not (syn_t and syn_t in r_city_clean):
                self.logger.info(f"[OLX] Dropped cross-city spam ({true_city}): {ad.get('title', '')[:40]}")
                return None

        params_list = ad.get("parameters", [])
        params      = {p.get("key"): p.get("value") for p in params_list} if isinstance(params_list, list) else {}
        area_text   = params.get("floor_area") or params.get("area") or ""
        area_sqft   = clean_area(str(area_text)) if area_text else None

        title       = ad.get("title") or ""
        date_str    = ad.get("created_at") or ad.get("activation_date") or ""
        is_verified = bool(ad.get("is_trusted") or ad.get("is_verified"))
        furnishing  = params.get("furnishing") or ""
        floor_text  = params.get("floor") or str(params.get("floor_no") or "")
        description = ad.get("description") or ""

        # Phone — OLX API returns it under user.phone in some response shapes
        phone = ""
        user_obj = ad.get("user") or {}
        if isinstance(user_obj, dict):
            phone = str(user_obj.get("phone") or "")

        images = []
        for img in ad.get("images", []):
            if isinstance(img, dict) and img.get("url"):
                images.append(img["url"])

        return {
            "title":             title,
            "description":       description,
            "images":            images,
            "listing_url":       listing_url,
            "source_platform":   self.display_name,
            "city":              city,
            "locality":          locality,
            "state":             state,
            "address":           address,
            "lat":               lat,
            "lon":               lon,
            "zoning_code":       "Commercial",
            "property_type":     normalize_property_type(title or "Shop"),
            "rent_per_month":    rent_per_month,
            "area_sqft":         area_sqft,
            "rent_per_sqft":     calculate_rent_per_sqft(rent_per_month, area_sqft),
            "floor":             floor_text,
            "listing_date":      parse_date(str(date_str)),
            "is_verified":       is_verified,
            "furnishing_status": normalize_furnishing(furnishing),
            "facing":            extract_facing(description),
            "raw_price_text":    str(raw_price),
            "phonenumber":       phone,
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--city",     default="Coimbatore")
    parser.add_argument("--locality", default="RS Puram")
    args = parser.parse_args()

    from utils.location_resolver import LocationContext
    ctx = LocationContext(city=args.city, locality=args.locality, pincode="", state="",
                         lat=0.0, lng=0.0, raw_input=f"{args.locality}, {args.city}")
    scraper = OLXScraper()
    docs = asyncio.run(scraper.scrape_city_location(ctx))
    print(f"OLX done — {len(docs)} listings scraped")
    for d in docs[:3]:
        print(f"  [{d['locality']}] {d['title'][:60]} -- Rs.{d['rent_per_month']}")
