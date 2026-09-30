"""
resolvers/locality_resolver.py
Locality slug/ID resolver for all active rental platforms (OLX, NoBroker, 99acres,
MagicBricks, Housing.com, PropTiger).

Only verified city codes/IDs are stored here.
Placeholder values have been removed — unknown cities get skipped or use HTML fallback.
"""
import asyncio
import json
import logging
import re
from pathlib import Path
from core.session import session_manager

logger = logging.getLogger("rental_scraper")

CACHE_FILE = Path(__file__).parent / "locality_cache.json"

# ──────────────────────────────────────────────────────────
# 99acres city codes — VERIFIED only
# Source: https://www.99acres.com/search/property/rent/{slug}?city={code}
# Method: Open each city's rental page in browser, read ?city= param from URL
# ──────────────────────────────────────────────────────────
ACRES99_CITY_CODES = {
    "bangalore":       "9",
    "bengaluru":       "9",
    "chennai":         "3",
    "hyderabad":       "15",
    "kochi":           "34",
    "coimbatore":      "62",
    "madurai":         "87",
    "trichy":          "88",
    "tiruchirappalli": "88",
    # NOTE: Salem, Vellore, Tirupur do NOT have their own city codes on 99acres.
    # Listings for these cities appear under the state-level page, not city-level.
    # They are intentionally omitted to avoid returning wrong-city data.
}

# ──────────────────────────────────────────────────────────
# OLX city location IDs — static map, supplemented by dynamic resolution
# Source: OLX /api/locations/v3/search autocomplete endpoint
# ──────────────────────────────────────────────────────────
OLX_CITY_IDS = {
    "bangalore":       "4062",
    "bengaluru":       "4062",
    "chennai":         "4061",
    "coimbatore":      "4064",
    "hyderabad":       "4063",
    "kochi":           "4060",
    "madurai":         "4065",
    "mumbai":          "4058",
    "delhi":           "4057",
    "pune":            "4059",
    "salem":           "4067",
    "tirupur":         "4068",
    "vellore":         "4069",
    "trichy":          "4066",
    "tiruchirappalli": "4066",
}

# ──────────────────────────────────────────────────────────
# NoBroker city IDs — VERIFIED only
# Source: NoBroker API cityId param observed in browser network tab
# ──────────────────────────────────────────────────────────
NOBROKER_CITY_IDS = {
    "bangalore":  6,
    "bengaluru":  6,
    "mumbai":     8,
    "pune":       9,
    "hyderabad":  10,
    "chennai":    11,
    "kolkata":    12,
    "delhi":      4,
    "noida":      4,
    "gurgaon":    4,
    "coimbatore": 14,
    "kochi":      17,
    "madurai":    15,
    "trichy":     19,
    "tiruchirappalli": 19,
    # Salem, Vellore, Tirupur: NoBroker does not have confirmed city IDs for these.
    # They will be attempted via HTML-only fallback (no API).
}

# Cities whose official/platform name differs from common name
_CITY_NAME_NORMALISE = {
    "belgaum":  "belagavi",
    "bombay":   "mumbai",
    "madras":   "chennai",
    "calcutta": "kolkata",
    "trichy":   "tiruchirappalli",
}

def _slugify(text: str) -> str:
    """Convert a string to a URL-safe slug."""
    return re.sub(r"[^a-z0-9]+", "-", text.lower().strip()).strip("-")


class LocalityIDResolver:
    def __init__(self):
        self.cache = self._load_cache()

    def _load_cache(self) -> dict:
        if CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, "r") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_cache(self):
        try:
            with open(CACHE_FILE, "w") as f:
                json.dump(self.cache, f, indent=2)
        except Exception as e:
            logger.warning("[Resolver] Could not save cache: %s", e)

    def _get_cache_key(self, city: str, locality: str) -> str:
        return f"{locality.strip()}, {city.strip()}".lower()

    async def resolve_all(self, city: str, locality: str) -> dict:
        """
        Resolve platform-specific slugs/IDs for a city+locality pair.
        Returns a dict with keys for each platform.
        """
        cache_key = self._get_cache_key(city, locality)
        if cache_key in self.cache:
            logger.info("[Resolver] Using cached IDs for %s", cache_key)
            return self.cache[cache_key]

        logger.info("[Resolver] Resolving IDs for %s...", cache_key)

        city_lower    = city.lower().strip()
        canonical     = _CITY_NAME_NORMALISE.get(city_lower, city_lower)
        city_slug     = _slugify(canonical)
        locality_slug = _slugify(locality)

        olx_id = (
            OLX_CITY_IDS.get(city_lower)
            or OLX_CITY_IDS.get(canonical)
            or OLX_CITY_IDS.get(city_slug)
        )

        acres99_code = (
            ACRES99_CITY_CODES.get(city_lower)
            or ACRES99_CITY_CODES.get(canonical)
            or ACRES99_CITY_CODES.get(city_slug)
        )
        if not acres99_code:
            logger.warning(
                "[Resolver] No verified 99acres city code for '%s'. "
                "That city will be skipped by the 99acres scraper.", city
            )

        nb_city_id = (
            NOBROKER_CITY_IDS.get(city_lower)
            or NOBROKER_CITY_IDS.get(canonical)
            or NOBROKER_CITY_IDS.get(city_slug)
        )
        if not nb_city_id:
            logger.warning(
                "[Resolver] No verified NoBroker city ID for '%s'. "
                "NoBroker will use HTML-only fallback.", city
            )

        resolved = {
            "olx":         olx_id,
            "acres99":     acres99_code,   # None = skip
            "nobroker":    {
                "city_slug":    city_slug,
                "locality_slug": locality_slug,
                "city_id":      nb_city_id,  # None = HTML-only fallback
            },
            "magicbricks": f"{locality_slug}-{city_slug}" if locality_slug else city_slug,
            "housing":     f"{locality_slug}-{city_slug}" if locality_slug else city_slug,
            "proptiger":   f"{locality_slug}-{city_slug}" if locality_slug else city_slug,
        }

        # Attempt to refine OLX location_id via API if not in static map
        if not resolved["olx"]:
            try:
                resolved["olx"] = await self._resolve_olx_dynamic(city, locality)
            except Exception as e:
                logger.debug("[Resolver] Dynamic OLX resolution failed: %s", e)

        self.cache[cache_key] = resolved
        self._save_cache()
        logger.info(
            "[Resolver] Resolved — olx=%s | acres99=%s | nobroker_id=%s",
            resolved["olx"], resolved["acres99"],
            resolved["nobroker"].get("city_id"),
        )
        return resolved

    async def _resolve_olx_dynamic(self, city: str, locality: str) -> str | None:
        """
        Resolve OLX location_id dynamically via their autocomplete.
        Falls back to None if unavailable.
        """
        session = session_manager.get_session()
        term = f"{locality} {city}" if locality else city
        url = f"https://www.olx.in/api/locations/v3/search?term={term}&lang=en-IN&limit=5"
        try:
            resp = await session.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "Referer": "https://www.olx.in/"
            }, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("data", [])
                for item in items:
                    if item.get("type") in ("LOCALITY", "CITY") and city.lower() in str(item.get("name", "")).lower():
                        return str(item.get("id"))
        except Exception:
            pass
        return None


locality_resolver = LocalityIDResolver()
