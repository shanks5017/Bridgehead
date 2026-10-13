"""
scrapers/magicbricks.py
MagicBricks.com — commercial rental listings scraper.

Strategy: Playwright (required — MagicBricks is a Next.js SPA behind Cloudflare).
Extract data from:
  1. __NEXT_DATA__ JSON blob embedded in the rendered page
  2. Inline JSON in <script> tags (window.__INITIAL_DATA__ etc.)
  3. HTML card parsing as final fallback

URL pattern (verified):
  https://www.magicbricks.com/commercial-property-for-rent-in-{city}-pppfs
  https://www.magicbricks.com/commercial-property-for-rent-in-{locality}-{city}-pppfs
"""
import argparse
import asyncio
import json
import re
import sys
import os
from bs4 import BeautifulSoup # type: ignore

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scrapers.base_scraper import BaseScraper
from core.session import session_manager
from config import MAX_PAGES
from utils.helpers import (
    clean_price, clean_area, calculate_rent_per_sqft,
    parse_date, normalize_property_type, normalize_furnishing, extract_facing,
)
from resolvers.locality_resolver import locality_resolver

# Expose for check_all.py
_MB_CITY_MAP = {
    "Bangalore": "bangalore", "Chennai": "chennai", "Madurai": "madurai",
    "Trichy": "tiruchirappalli", "Salem": "salem", "Kochi": "kochi",
    "Tirupur": "tirupur", "Vellore": "vellore", "Coimbatore": "coimbatore",
    "Hyderabad": "hyderabad",
}


class MagicBricksScraper(BaseScraper):
    platform_key    = "magicbricks"
    display_name    = "MagicBricks"
    uses_playwright = False

    async def scrape_city_location(self, location_ctx) -> list[dict]:
        city     = location_ctx.city     or location_ctx.raw_input
        locality = location_ctx.locality or ""

        city_slug     = city.lower().replace(" ", "-")
        _SLUG_MAP     = {"trichy": "tiruchirappalli", "bengaluru": "bangalore"}
        city_slug     = _SLUG_MAP.get(city_slug, city_slug)
        locality_slug = re.sub(r"[^a-z0-9]+", "-", locality.lower().strip()).strip("-") if locality else ""

        # Verified query param URL format
        if locality_slug:
            url = f"https://www.magicbricks.com/property-for-rent/commercial-real-estate?proptype=Commercial-Office-Space,Commercial-Shop&cityName={city_slug}&Locality={locality_slug}"
        else:
            url = f"https://www.magicbricks.com/property-for-rent/commercial-real-estate?proptype=Commercial-Office-Space,Commercial-Shop&cityName={city_slug}"

        self.logger.info("[MagicBricks] Scraping: %s", url)
        return await self._scrape_fast_api(city, locality, url)

    async def _scrape_fast_api(self, city: str, locality: str, base_url: str) -> list[dict]:
        all_docs: list[dict] = []
        session = session_manager.get_session()

        for page_num in range(1, min(MAX_PAGES, 8) + 1):
            if page_num == 1:
                url = base_url
            else:
                url = f"{base_url}&page={page_num}"

            try:
                response = await session.get(
                    url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                )
                content = response.text
                
                docs = self._extract_from_html(content, city)

                if not docs:
                    self.logger.debug("[MagicBricks] Page %d: no listings extracted", page_num)
                    break

                # Deduplicate by URL
                seen = set()
                deduped = []
                for d in docs:
                    if d["listing_url"] not in seen:
                        seen.add(d["listing_url"])
                        deduped.append(d)

                all_docs.extend(deduped)
                self.logger.debug("[MagicBricks] Page %d: +%d listings", page_num, len(deduped))

                if len(deduped) < 5:
                    break
                    
                # Short delay to be polite
                await asyncio.sleep(1)

            except Exception as e:
                self.logger.error("[MagicBricks] Error fetching page %d: %s", page_num, e)
                break

        self.logger.info("[MagicBricks] Fetched %d total listings", len(all_docs))
        return all_docs

    def _extract_from_html(self, html: str, city: str) -> list[dict]:
        docs = []

        # Strategy 1: Find JSON embedded in script tags
        soup = BeautifulSoup(html, "html.parser")
        scripts = soup.find_all("script")
        for s in scripts:
            if s.string and "window.SERVER_PRELOADED_STATE_" in s.string:
                try:
                    match = re.search(r'window\.SERVER_PRELOADED_STATE_\s*=\s*(\{.*?\});', s.string, re.DOTALL)
                    if match:
                        data = json.loads(match.group(1))
                        extracted = self._walk_json_for_listings(data, city)
                        if extracted:
                            return extracted
                except Exception as e:
                    self.logger.warning(f"[MagicBricks] JSON parse error: {e}")
            elif s.string and ("propertyList" in s.string or "searchResults" in s.string or "__INITIAL_STATE__" in s.string):
                try:
                    # Try to extract the JSON object from the script
                    match = re.search(r'(\{.*propertyList.*\})', s.string, re.DOTALL)
                    if match:
                        data = json.loads(match.group(1))
                        extracted = self._walk_json_for_listings(data, city)
                        if extracted:
                            return extracted
                except Exception:
                    pass

        # Strategy 2: Walk HTML for listing cards
        cards = (
            soup.select(".mb-srp__card")
            or soup.select("[class*='mb-srp__list--item']")
            or soup.select("[class*='PropertyCard']")
            or soup.select("[data-q='srp-listing']")
            or [t for t in soup.find_all("div", class_=True)
                if "srp__list" in " ".join(t.get("class", []))]
        )
        if cards:
            for card in cards:
                doc = self._parse_card(card, city)
                if doc and doc.get("listing_url"):
                    docs.append(doc)

        return docs

    def _walk_json_for_listings(self, obj, city: str, depth: int = 0) -> list[dict]:
        if depth > 12:
            return []
        docs = []
        if isinstance(obj, list):
            for item in obj:
                if isinstance(item, dict) and self._looks_like_listing(item):
                    doc = self._json_item_to_doc(item, city)
                    if doc and doc.get("listing_url"):
                        docs.append(doc)
                elif isinstance(item, (dict, list)):
                    docs.extend(self._walk_json_for_listings(item, city, depth + 1))
        elif isinstance(obj, dict):
            for key in ("listings", "searchResult", "propertyList", "results", "data"):
                if key in obj and isinstance(obj[key], list):
                    result = self._walk_json_for_listings(obj[key], city, depth + 1)
                    if result:
                        return result
            for v in obj.values():
                if isinstance(v, (dict, list)):
                    docs.extend(self._walk_json_for_listings(v, city, depth + 1))
        return docs

    def _looks_like_listing(self, item: dict) -> bool:
        listing_keys = {"propId", "listingId", "id", "price", "priceD", "area", "carSqFt", "caSqFt", "locality", "nnadispname",
                        "title", "seoDesc", "url", "propertyType", "propUrl"}
        return len(listing_keys & set(item.keys())) >= 3

    def _json_item_to_doc(self, item: dict, city: str) -> dict | None:
        listing_url = (
            item.get("propUrl") or item.get("url") or item.get("detailsUrl") or ""
        )
        if not listing_url:
            prop_id = item.get("propId") or item.get("listingId") or item.get("id") or ""
            listing_url = f"https://www.magicbricks.com/property-detail/{prop_id}" if prop_id else ""
        if listing_url and not listing_url.startswith("http"):
            if "propertyDetails/" not in listing_url:
                listing_url = "https://www.magicbricks.com/propertyDetails/" + listing_url
            else:
                listing_url = "https://www.magicbricks.com/" + listing_url.lstrip("/")

        title       = item.get("title") or item.get("propertyName") or ""
        if not title and "seoDesc" in item:
            # Fallback title from the first sentence of description or URL
            title = listing_url.split("/")[-1].replace("-", " ").split("&id=")[0]
        
        description = item.get("seoDesc") or item.get("description") or item.get("desc") or ""
        price_raw   = item.get("price") or item.get("priceD") or item.get("amount") or item.get("priceDisplay") or ""
        area_raw    = item.get("carSqFt") or item.get("caSqFt") or item.get("carpetArea") or item.get("area") or item.get("builtupArea") or ""
        locality_v  = item.get("nnadispname") or item.get("lmtDName") or item.get("locality") or item.get("localityName") or city
        floor_v     = str(item.get("floorNo") or item.get("floor") or "")
        date_v      = str(item.get("postDateT") or item.get("lCtDate") or item.get("postedDate") or item.get("postedAt") or "")
        images      = item.get("allImgPath") or []
        
        # Strategy 2: Check randomImg JSON string
        if not images and isinstance(item.get("randomImg"), str):
            try:
                import json
                for img_obj in json.loads(item["randomImg"]):
                    if img_obj.get("path"):
                        images.append(img_obj["path"])
            except Exception:
                pass
                
        # Strategy 3: Check photos list
        if not images:
            for img in item.get("photos", item.get("images", [])):
                src = img.get("url") or img.get("src") or "" if isinstance(img, dict) else img
                if src:
                    images.append(src)
                    
        # Strategy 4: Fallback to single thumbnail / hero image
        if not images:
            hero_url = item.get("wapImgUrl1") or item.get("wapImgUrl")
            if hero_url:
                images.append(str(hero_url).replace("Photo_h80_w120", "Photo_h400_w600").replace("Photo_h100_w150", "Photo_h400_w600"))
            elif item.get("propImg"):
                images.append("https://img.staticmb.com/mbimages/project/" + str(item.get("propImg")))

        rent = clean_price(str(price_raw))
        area = clean_area(str(area_raw))

        lat = item.get("pmtLat") or item.get("lt")
        lon = item.get("pmtLong") or item.get("ln")
        
        is_verified = False
        if item.get("ctVerifd") == "Y" or item.get("supV") == "Y" or item.get("isVerified") or item.get("verified"):
            is_verified = True

        doc = {
            "title":             title,
            "description":       description,
            "images":            images,
            "listing_url":       listing_url,
            "source_platform":   self.display_name,
            "city":              city,
            "locality":          locality_v,
            "property_type":     normalize_property_type(title or "Commercial"),
            "rent_per_month":    rent,
            "area_sqft":         area,
            "rent_per_sqft":     calculate_rent_per_sqft(rent, area),
            "floor":             floor_v,
            "listing_date":      parse_date(date_v),
            "is_verified":       is_verified,
            "furnishing_status": normalize_furnishing(item.get("furnishingD") or item.get("furnishing") or ""),
            "facing":            extract_facing(item.get("facingD") or item.get("facing") or description),
            "raw_price_text":    str(item.get("priceD") or price_raw),
            "phonenumber":       "",
        }
        
        if lat and lon:
            doc["lat"] = float(lat)
            doc["lon"] = float(lon)
            
        return doc

    def _parse_card(self, card, city: str) -> dict | None:
        link_el = card.select_one("a.view-property-link") or card.select_one(".mb-srp__card__society--name") or card.select_one("a[href]")
        if not link_el:
            return None
        listing_url = link_el.get("href", "")
        if listing_url and not listing_url.startswith("http"):
            listing_url = "https://www.magicbricks.com" + listing_url

        title_el  = (card.select_one(".mb-srp__card--title") or card.select_one(".mb-srp__card__title") or
                     card.select_one("[class*='card__title']") or card.select_one("h2, h3"))
        title     = title_el.get_text(strip=True) if title_el else ""
        price_el  = (card.select_one(".mb-srp__card__price--amount") or
                     card.select_one("[class*='price--amount']") or card.select_one("[class*='price']"))
        rent_text = price_el.get_text(strip=True) if price_el else ""
        
        area_text = ""
        # The area is usually the first summary value in the new layout
        area_el   = card.select_one(".mb-srp__card__summary--value")
        if area_el:
            area_text = area_el.get_text(strip=True)
            
        loc_el    = (card.select_one(".mb-srp__card__society--name") or card.select_one("[class*='society']") or card.select_one("[class*='locality']"))
        locality  = loc_el.get_text(strip=True) if loc_el else city

        rent = clean_price(rent_text)
        area = clean_area(area_text)
        return {
            "title":             title,
            "description":       "",
            "images":            [],
            "listing_url":       listing_url,
            "source_platform":   self.display_name,
            "city":              city,
            "locality":          locality,
            "property_type":     normalize_property_type(title or "Shop"),
            "rent_per_month":    rent,
            "area_sqft":         area,
            "rent_per_sqft":     calculate_rent_per_sqft(rent, area),
            "floor":             "",
            "listing_date":      None,
            "is_verified":       False,
            "furnishing_status": "Unknown",
            "facing":            "",
            "raw_price_text":    rent_text,
            "phonenumber":       "",
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--city",     default="Coimbatore")
    parser.add_argument("--locality", default="RS Puram")
    args = parser.parse_args()
    from utils.location_resolver import LocationContext
    ctx = LocationContext(city=args.city, locality=args.locality, pincode="", state="",
                         lat=0.0, lng=0.0, raw_input=f"{args.locality}, {args.city}")
    scraper = MagicBricksScraper()
    docs = asyncio.run(scraper.scrape_city_location(ctx))
    print(f"MagicBricks done — {len(docs)} listings scraped")
    for d in docs[:3]:
        print(f"  [{d['locality']}] {d['title'][:60]} — Rs.{d['rent_per_month']}")
