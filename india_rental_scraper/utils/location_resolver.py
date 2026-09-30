"""
utils/location_resolver.py
Converts a user-typed location string (e.g. "RS Puram, Coimbatore")
into a structured LocationContext that all scrapers can use.

APIs used (both free, no key required):
  - Nominatim OpenStreetMap: lat/lng + structured address
  - api.postalpincode.in:    India pincode lookup

Industry-grade features:
  - LRU in-memory cache (100 entries) to avoid redundant API calls
  - Dual-API with fallback: if Nominatim fails, heuristic parse
  - Hardened against network failures, bad data, timeout
  - Returns LocationContext.geocoded=False with best-effort data on failure
  - Thread-safe (functools.lru_cache is GIL-protected)
"""

import re
import time
import logging
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Optional

import httpx  # async-capable, faster than requests for geocoding calls

logger = logging.getLogger("rental_scraper")

# ── Constants ─────────────────────────────────────────────────────────────────

_NOMINATIM_URL  = "https://nominatim.openstreetmap.org/search"
_PINCODE_URL    = "https://api.postalpincode.in/pincode/{pincode}"
_PINPLACE_URL   = "https://api.postalpincode.in/postoffice/{place}"
_GEOCODE_TIMEOUT = 6   # seconds per API call
_USER_AGENT      = (
    "ZonekIntelligence/1.0 (rental-market-research; "
    "contact: zonek.intelligence@gmail.com)"
)

# Known city→state for heuristic fallback
_CITY_STATE_MAP = {
    "coimbatore": "Tamil Nadu",
    "chennai":    "Tamil Nadu",
    "madurai":    "Tamil Nadu",
    "trichy":     "Tamil Nadu",
    "tiruchirappalli": "Tamil Nadu",
    "salem":      "Tamil Nadu",
    "tirupur":    "Tamil Nadu",
    "vellore":    "Tamil Nadu",
    "bangalore":  "Karnataka",
    "bengaluru":  "Karnataka",
    "hyderabad":  "Telangana",
    "kochi":      "Kerala",
    "cochin":     "Kerala",
    "mumbai":     "Maharashtra",
    "pune":       "Maharashtra",
    "delhi":      "Delhi",
    "kolkata":    "West Bengal",
    "ahmedabad":  "Gujarat",
}

# Nominatim sometimes returns administrative subdivision names instead of the
# city name the user typed. This map normalizes those back to scraper-friendly names.
_CANONICAL_CITY_MAP: dict[str, str] = {
    # Coimbatore subdivisions
    "coimbatore south":     "Coimbatore",
    "coimbatore north":     "Coimbatore",
    "coimbatore east":      "Coimbatore",
    "coimbatore west":      "Coimbatore",
    # Bangalore/Bengaluru variants
    "bengaluru":            "Bangalore",
    "bangalore urban":      "Bangalore",
    "bangalore rural":      "Bangalore",
    # Trichy variants
    "tiruchirappalli":      "Trichy",
    "tiruchirapalli":       "Trichy",
    # Kochi variants
    "cochin":               "Kochi",
    "ernakulam":            "Kochi",
    # Mumbai variants
    "bombay":               "Mumbai",
    "greater mumbai":       "Mumbai",
    "mumbai suburban":      "Mumbai",
    # Delhi variants
    "new delhi":            "Delhi",
    # Hyderabad variants
    "secunderabad":         "Hyderabad",
    "cyberabad":            "Hyderabad",
    "rangareddy":           "Hyderabad",
    # Madurai variants
    "madurai south":        "Madurai",
    "madurai north":        "Madurai",
    # Salem variants
    "salem city":           "Salem",
    # Chennai variants
    "madras":               "Chennai",
    "chennai city":         "Chennai",
    # Kolkata variants
    "calcutta":             "Kolkata",
    "kolkata municipal":    "Kolkata",
}

# Suffixes that Nominatim appends to city names that we want to strip
_ADMIN_SUFFIX_RE = re.compile(
    r"\s+(south|north|east|west|urban|rural|district|city|corporation"
    r"|municipal|taluk|tehsil|division|zone)\s*$",
    re.IGNORECASE,
)


def _normalize_city(nominatim_city: str, user_city: str) -> str:
    """
    Normalize a city name from Nominatim to one that works with all scraper city maps.

    Strategy:
    1. Direct match in canonical map → return canonical name
    2. Strip admin suffixes (South, North, Urban...) and try again
    3. If all else fails, fall back to the city the USER typed (most reliable)
    """
    if not nominatim_city:
        return user_city.strip().title() if user_city else ""

    name = nominatim_city.strip()

    # Direct lookup (case-insensitive)
    canonical = _CANONICAL_CITY_MAP.get(name.lower())
    if canonical:
        return canonical

    # Strip directional/admin suffix and try again
    stripped = _ADMIN_SUFFIX_RE.sub("", name).strip()
    if stripped and stripped.lower() != name.lower():
        canonical = _CANONICAL_CITY_MAP.get(stripped.lower())
        if canonical:
            return canonical
        # The stripped name is better than the original (no suffix)
        return stripped.title()

    # Nominatim city looks reasonable — use it as-is
    # But if it's very different from what the user typed, prefer user's version
    user_norm = user_city.strip().lower() if user_city else ""
    if user_norm and user_norm not in name.lower() and name.lower() not in user_norm:
        # Nominatim returned something completely different — trust the user
        return user_city.strip().title()

    return name.title()

# ── Data Model ────────────────────────────────────────────────────────────────

@dataclass
class LocationContext:
    """Fully structured representation of a user-supplied location string."""
    raw_input:   str
    city:        str           = ""
    locality:    str           = ""   # sub-city neighborhood (e.g. "RS Puram")
    district:    str           = ""
    state:       str           = ""
    country:     str           = "India"
    pincode:     str           = ""   # 6-digit Indian pincode
    lat:         Optional[float] = None
    lng:         Optional[float] = None
    geocoded:    bool          = False  # True = resolved via API; False = heuristic only
    resolver_ms: int           = 0     # time taken to resolve in milliseconds

    # Computed slugs — used by scrapers to build URLs
    city_slug: str    = field(default="", init=False)
    locality_slug: str = field(default="", init=False)

    def __post_init__(self):
        self.city_slug     = _slugify(self.city)
        self.locality_slug = _slugify(self.locality)

    def display(self) -> str:
        parts = [p for p in [self.locality, self.city, self.state] if p]
        return ", ".join(parts)

    def search_query(self) -> str:
        """Best locality+city string for platform search boxes."""
        if self.locality and self.city:
            return f"{self.locality}, {self.city}"
        return self.city or self.raw_input


# ── Utilities ─────────────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    """Convert 'RS Puram' → 'rs-puram' for URL building."""
    if not text:
        return ""
    return re.sub(r"[^a-z0-9]+", "-", text.strip().lower()).strip("-")


def _parse_location_heuristic(raw: str) -> tuple[str, str]:
    """
    Split 'RS Puram, Coimbatore' → (locality='RS Puram', city='Coimbatore').
    Handles:
      - 'RS Puram, Coimbatore'
      - 'Coimbatore'
      - 'RS Puram Coimbatore'  (no comma)
    """
    raw = raw.strip()
    if "," in raw:
        parts = [p.strip() for p in raw.split(",")]
        # Last part is typically the city
        city     = parts[-1]
        locality = ", ".join(parts[:-1])
    else:
        # Try to detect a known city name at the end
        words = raw.split()
        city     = words[-1] if words else raw
        locality = " ".join(words[:-1]) if len(words) > 1 else ""
    return locality, city


def _call_nominatim(query: str) -> Optional[dict]:
    """
    Call Nominatim and return the first result dict, or None on failure.
    Rate limit: 1 request/second per Nominatim ToS.
    """
    params = {
        "q":              query,
        "format":         "json",
        "addressdetails": "1",
        "limit":          "1",
        "countrycodes":   "in",
    }
    headers = {"User-Agent": _USER_AGENT}
    try:
        time.sleep(1.1)   # Nominatim: max 1 req/sec
        with httpx.Client(timeout=_GEOCODE_TIMEOUT) as client:
            resp = client.get(_NOMINATIM_URL, params=params, headers=headers)
            resp.raise_for_status()
            results = resp.json()
            return results[0] if results else None
    except Exception as e:
        logger.warning("Nominatim call failed for '%s': %s", query, e)
        return None


def _call_pincode_api_by_place(place: str) -> str:
    """
    Call India Pincode API with place name to get pincode.
    Returns empty string on failure.
    """
    place_slug = re.sub(r"[^a-zA-Z0-9 ]", "", place).strip().replace(" ", "%20")
    url = _PINPLACE_URL.format(place=place_slug)
    try:
        with httpx.Client(timeout=_GEOCODE_TIMEOUT) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list) and data:
                post_offices = data[0].get("PostOffice") or []
                if post_offices:
                    return str(post_offices[0].get("Pincode", ""))
    except Exception as e:
        logger.debug("Pincode API (by place) failed for '%s': %s", place, e)
    return ""


# ── Main Resolver ─────────────────────────────────────────────────────────────

@lru_cache(maxsize=100)
def resolve_location(raw_input: str) -> LocationContext:
    """
    Convert a raw location string to a LocationContext.
    Results are cached: the same input string always returns the same result
    within a single process lifetime (thread-safe).

    Args:
        raw_input: e.g. "RS Puram, Coimbatore" or "Bengaluru" or "641002"

    Returns:
        LocationContext with as much data as could be resolved.
    """
    t0 = time.time()
    raw = raw_input.strip()

    # ── Case 1: Pure pincode (6 digits) ──────────────────────────────────
    if re.fullmatch(r"\d{6}", raw):
        return _resolve_from_pincode(raw, t0)

    # ── Case 2: Text location string ─────────────────────────────────────
    locality, city = _parse_location_heuristic(raw)

    ctx = LocationContext(
        raw_input=raw_input,
        city=city.title(),
        locality=locality.title(),
        state=_CITY_STATE_MAP.get(city.lower(), ""),
    )

    # Try Nominatim with the full string for lat/lng/state/pincode enrichment.
    # IMPORTANT: We do NOT override ctx.city with Nominatim's subdivision name.
    # Nominatim often returns "Coimbatore South" instead of "Coimbatore" — this
    # breaks all scraper city maps. We normalize it back using _normalize_city().
    nom = _call_nominatim(raw + ", India")
    if nom:
        addr   = nom.get("address", {})
        ctx.lat = float(nom.get("lat", 0)) or None
        ctx.lng = float(nom.get("lon", 0)) or None

        # Normalize Nominatim's city name back to scraper-compatible canonical name
        nom_city = (
            addr.get("city")
            or addr.get("town")
            or addr.get("municipality")
            or addr.get("county")
            or ""
        )
        ctx.city = _normalize_city(nom_city, city)  # city = user's typed city

        # Locality: prefer Nominatim's suburb/neighbourhood, fall back to user's
        ctx.locality = (
            addr.get("suburb")
            or addr.get("neighbourhood")
            or addr.get("quarter")
            or addr.get("residential")
            or locality.title()
            or ""
        )
        ctx.state    = addr.get("state", ctx.state)
        ctx.district = addr.get("state_district", "")
        ctx.country  = addr.get("country", "India")
        ctx.geocoded = True

        # Pincode from Nominatim (not always present)
        ctx.pincode = str(addr.get("postcode", ""))

    # If we still don't have a pincode, try the India Pincode API
    if not ctx.pincode and (ctx.locality or ctx.city):
        place_query = ctx.locality or ctx.city
        ctx.pincode = _call_pincode_api_by_place(place_query)

    ctx.city_slug     = _slugify(ctx.city)
    ctx.locality_slug = _slugify(ctx.locality)
    ctx.resolver_ms   = int((time.time() - t0) * 1000)

    logger.info(
        "[LocationResolver] '%s' → city=%s locality=%s pincode=%s geocoded=%s (%dms)",
        raw_input, ctx.city, ctx.locality, ctx.pincode, ctx.geocoded, ctx.resolver_ms,
    )
    return ctx


def _resolve_from_pincode(pincode: str, t0: float) -> LocationContext:
    """Resolve when user provides a raw 6-digit pincode."""
    url = _PINCODE_URL.format(pincode=pincode)
    city, locality, state, district = "", "", "", ""
    geocoded = False
    lat, lng = None, None

    try:
        with httpx.Client(timeout=_GEOCODE_TIMEOUT) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list) and data and data[0].get("Status") == "Success":
                po   = (data[0].get("PostOffice") or [{}])[0]
                city     = po.get("District", "")
                state    = po.get("State", "")
                district = po.get("District", "")
                locality = po.get("Name", "")
                geocoded = True
    except Exception as e:
        logger.warning("Pincode resolve failed for %s: %s", pincode, e)

    # Also try Nominatim with the pincode for lat/lng
    nom = _call_nominatim(pincode + ", India")
    if nom:
        lat = float(nom.get("lat", 0)) or None
        lng = float(nom.get("lon", 0)) or None

    ctx = LocationContext(
        raw_input=pincode,
        city=city.title(),
        locality=locality.title(),
        district=district,
        state=state,
        pincode=pincode,
        lat=lat,
        lng=lng,
        geocoded=geocoded,
        resolver_ms=int((time.time() - t0) * 1000),
    )
    logger.info(
        "[LocationResolver] pincode=%s → city=%s locality=%s state=%s (%dms)",
        pincode, ctx.city, ctx.locality, ctx.state, ctx.resolver_ms,
    )
    return ctx


def resolve_location_fast(raw_input: str) -> LocationContext:
    """
    Fast resolver: heuristic-only, no network calls.
    Use when geocoding latency is unacceptable and approximate data is fine.
    Returns LocationContext with geocoded=False.
    """
    raw = raw_input.strip()
    locality, city = _parse_location_heuristic(raw)
    return LocationContext(
        raw_input=raw_input,
        city=city.title(),
        locality=locality.title(),
        state=_CITY_STATE_MAP.get(city.lower(), ""),
        geocoded=False,
    )


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    test_queries = [
        "RS Puram, Coimbatore",
        "Indiranagar, Bangalore",
        "641002",
        "Hyderabad",
        "T Nagar, Chennai",
    ]
    for q in (sys.argv[1:] or test_queries):
        ctx = resolve_location(q)
        print(f"\n{'='*50}")
        print(f"  Input:    {ctx.raw_input}")
        print(f"  City:     {ctx.city}")
        print(f"  Locality: {ctx.locality}")
        print(f"  State:    {ctx.state}")
        print(f"  Pincode:  {ctx.pincode}")
        print(f"  Lat/Lng:  {ctx.lat}, {ctx.lng}")
        print(f"  Geocoded: {ctx.geocoded}")
        print(f"  Took:     {ctx.resolver_ms}ms")
        print(f"  Slug:     {ctx.city_slug} / {ctx.locality_slug}")
