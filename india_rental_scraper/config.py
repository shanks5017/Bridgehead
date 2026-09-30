"""
config.py — Central configuration for India Rental Scraper
Edit CITIES to add/remove target cities at any time.
Toggle PLATFORMS to enable/disable individual scrapers.
"""
import os
from pathlib import Path
from dotenv import load_dotenv # type: ignore

# Load .env from the project root (one level up from utils, but config is already in project root)
_ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)

# ──────────────────────────────────────────────
# TARGET CITIES  (edit freely)
# ──────────────────────────────────────────────
CITIES = [
    "Bangalore",
    "Chennai",
    "Madurai",
    "Trichy",
    "Salem",
    "Kochi",
    "Tirupur",
    "Vellore",
    "Coimbatore",
    "Hyderabad",
]

# ──────────────────────────────────────────────
# PLATFORM TOGGLES  (set enabled: False to skip)
# ──────────────────────────────────────────────
PLATFORMS = {
    "magicbricks": {
        "enabled": True,
        "display_name": "MagicBricks",
        "url_template": "https://www.magicbricks.com/property-for-rent/commercial-spaces-in-{city_slug}?page={page}",
    },
    "olx": {
        "enabled": True,
        "display_name": "OLX",
        "url_template": "https://www.olx.in/{city_slug}/for-rent-shops-offices_c1731/q-commercial?page={page}",
    }
}

# ──────────────────────────────────────────────
# CITY → URL slug mapping
# ──────────────────────────────────────────────
CITY_SLUGS = {
    "Bangalore":  "bangalore",
    "Chennai":    "chennai",
    "Madurai":    "madurai",
    "Trichy":     "tiruchirappalli",
    "Salem":      "salem",
    "Kochi":      "kochi",
    "Tirupur":    "tirupur",
    "Vellore":    "vellore",
    "Coimbatore": "coimbatore",
    "Hyderabad":  "hyderabad",
}

# ──────────────────────────────────────────────
# REQUEST BEHAVIOUR
# ──────────────────────────────────────────────
REQUEST_DELAY_MIN = 2      # seconds
REQUEST_DELAY_MAX = 6      # seconds
MAX_RETRIES       = 3
MAX_PAGES         = 10     # high cap to ensure we fetch all possible paginated results

# ──────────────────────────────────────────────
# ON-DEMAND PIPELINE SETTINGS
# (Used by pipeline.py — NOT by the batch main.py)
# ──────────────────────────────────────────────
# Geocoding — free APIs, no key required
NOMINATIM_URL    = "https://nominatim.openstreetmap.org/search"
PINCODE_API_URL  = "https://api.postalpincode.in"
GEOCODE_TIMEOUT  = 6    # seconds per geocoding API call

# Per-scraper timeouts for the parallel pipeline (seconds)
# Playwright scrapers need more; requests-based are faster
SCRAPER_TIMEOUTS = {
    "olx":        90,
    "magicbricks":120,
    "acres99":    90,
    "nobroker":   120,
    "housing":    90,
    "proptiger":  90,
}

# Locality filter mode:
#   False = keep all listings, flag unverified ones (RECOMMENDED)
#   True  = silently drop listings that don't match locality
LOCALITY_FILTER_STRICT = False

# ──────────────────────────────────────────────
# SUPABASE  (reads from .env)
# ──────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# ──────────────────────────────────────────────
# LOGGING
# ──────────────────────────────────────────────
LOG_DIR  = os.path.join(os.path.dirname(__file__), "logs")
LOG_FILE = os.path.join(LOG_DIR, "scraper.log")
