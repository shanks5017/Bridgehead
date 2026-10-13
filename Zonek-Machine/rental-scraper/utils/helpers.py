"""
utils/helpers.py
Pure utility functions for cleaning and normalising scraped text.
No network calls here — all operations are deterministic and testable.
"""
import re
import logging
from datetime import datetime, date, timedelta
from typing import Optional

logger = logging.getLogger("rental_scraper")

# ──────────────────────────────────────────────
# Price cleaning
# ──────────────────────────────────────────────

_LAKH  = 100_000
_CRORE = 10_000_000

def clean_price(text: str) -> Optional[int]:
    """
    Convert a raw price string to an integer rupee value per month.
    Handles: '₹25,000/month', '25K', '2.5 Lakh', '₹1.2 Cr', etc.
    Returns None if parsing fails.
    """
    if not text:
        return None
    text = str(text).strip()
    original = text

    # Remove currency symbols (₹, Rs., Rs, $), slashes, and common suffixes
    text = re.sub(r"(?i)rs\.?\s*", "", text)   # handle Rs. / Rs prefix
    text = re.sub(r"[₹$,\s]", "", text)
    text = re.sub(r"(?i)/?(per\s?)?month|/mo\.?|p\.?m\.?", "", text)

    # Handle lakh / crore shorthand
    lakh_match  = re.search(r"([\d.]+)\s*(?:lakh|lac|l)\b", text, re.IGNORECASE)
    crore_match = re.search(r"([\d.]+)\s*(?:crore|cr)\b",   text, re.IGNORECASE)
    k_match     = re.search(r"([\d.]+)\s*k\b",               text, re.IGNORECASE)

    try:
        if crore_match:
            return int(float(crore_match.group(1)) * _CRORE)
        if lakh_match:
            return int(float(lakh_match.group(1)) * _LAKH)
        if k_match:
            return int(float(k_match.group(1)) * 1_000)
        # Plain numeric
        numeric = re.sub(r"[^\d.]", "", text)
        if numeric:
            return int(float(numeric))
    except (ValueError, TypeError):
        pass

    logger.debug("clean_price: could not parse '%s'", original)
    return None


# ──────────────────────────────────────────────
# Area cleaning
# ──────────────────────────────────────────────

# Only extract a number if it is directly followed by an area unit.
# This prevents "3 BHK 1200 sq.ft" from returning 3 instead of 1200.
_AREA_PATTERN = re.compile(
    r"([\d,]+\.?\d*)\s*(?:sq\.?\s?ft|sqft|sq\.?\s?m|sqm|sq\.?\s?yard|sqyard|square\s?feet|square\s?metre)",
    re.IGNORECASE,
)

def clean_area(text: str) -> Optional[float]:
    """
    Convert area strings like '450 sq.ft', '1200sqft', '200 Sq. Ft.' → float.
    Ignores leading numbers that are not area values (e.g. BHK counts).
    Returns None if parsing fails.
    """
    if not text:
        return None
    text = str(text).strip()
    match = _AREA_PATTERN.search(text)
    if match:
        try:
            return float(match.group(1).replace(",", ""))
        except ValueError:
            pass
    logger.debug("clean_area: could not parse '%s'", text)
    return None


# ──────────────────────────────────────────────
# Rent per sqft
# ──────────────────────────────────────────────

def calculate_rent_per_sqft(rent: Optional[int], area: Optional[float]) -> Optional[float]:
    """Return rent/area rounded to 2 decimal places, or None."""
    if rent and area and area > 0:
        return round(rent / area, 2)
    return None


# ──────────────────────────────────────────────
# Date parsing
# ──────────────────────────────────────────────

_MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

def parse_date(text: str) -> Optional[str]:
    """
    Parse listing date strings into ISO format YYYY-MM-DD.
    Handles:
      - 'just now', 'today'
      - 'X days ago' / 'X hours ago' / 'X weeks ago'
      - 'Apr 5', 'Apr 5, 2026', '05-04-2026', '2026-04-05'
    Returns None if parsing fails.
    """
    if not text:
        return None
    text = str(text).strip().lower()
    today = date.today()

    if text in ("just now", "today", "a few seconds ago"):
        return today.isoformat()

    # "X hours ago"
    hours_match = re.search(r"(\d+)\s*hour", text)
    if hours_match:
        return today.isoformat()

    # "yesterday"
    if "yesterday" in text:
        return (today - timedelta(days=1)).isoformat()

    # "X days ago"
    days_match = re.search(r"(\d+)\s*day", text)
    if days_match:
        return (today - timedelta(days=int(days_match.group(1)))).isoformat()

    # "X weeks ago"
    weeks_match = re.search(r"(\d+)\s*week", text)
    if weeks_match:
        return (today - timedelta(weeks=int(weeks_match.group(1)))).isoformat()

    # "X months ago"
    months_match = re.search(r"(\d+)\s*month", text)
    if months_match:
        delta_days = int(months_match.group(1)) * 30
        return (today - timedelta(days=delta_days)).isoformat()

    # ISO date: 2026-04-08
    iso_match = re.search(r"(\d{4})-(\d{2})-(\d{2})", text)
    if iso_match:
        return f"{iso_match.group(1)}-{iso_match.group(2)}-{iso_match.group(3)}"

    # DD-MM-YYYY or DD/MM/YYYY
    dmy_match = re.search(r"(\d{1,2})[-/](\d{1,2})[-/](\d{4})", text)
    if dmy_match:
        d, m, y = dmy_match.groups()
        return f"{y}-{int(m):02d}-{int(d):02d}"

    # "Apr 5" or "Apr 5, 2026"
    alpha_match = re.search(r"([a-z]{3})\s+(\d{1,2})(?:,?\s*(\d{4}))?", text)
    if alpha_match:
        mon_str, day_str, year_str = alpha_match.groups()
        mon = _MONTH_MAP.get(mon_str)
        if mon:
            year = int(year_str) if year_str else today.year
            return f"{year}-{mon:02d}-{int(day_str):02d}"

    logger.debug("parse_date: could not parse '%s'", text)
    return None


# ──────────────────────────────────────────────
# Property type normalisation
# ──────────────────────────────────────────────

_PROP_TYPE_MAP = [
    (r"show\s?room",               "Showroom"),
    (r"office\s?space",            "Office Space"),
    (r"shop|retail|outlet|store",  "Shop"),
    (r"godown|warehouse",          "Warehouse"),
    (r"coworking|co.working",      "Co-working Space"),
    (r"commercial",                "Shop"),  # generic commercial → Shop (not Office Space)
]

def normalize_property_type(text: str) -> str:
    """Map raw property type text to a canonical category."""
    if not text:
        return "Shop"
    textl = text.lower()
    for pattern, canonical in _PROP_TYPE_MAP:
        if re.search(pattern, textl):
            return canonical
    return text.strip().title()


# ──────────────────────────────────────────────
# Furnishing status normalisation
# ──────────────────────────────────────────────

def normalize_furnishing(text: str) -> str:
    """Map raw furnishing text to: Furnished | Semi-Furnished | Unfurnished | Unknown."""
    if not text:
        return "Unknown"
    # Only inspect first 60 chars to avoid matching description text
    textl = text[:60].lower()
    if "semi" in textl:
        return "Semi-Furnished"
    if "unfurnish" in textl or "un-furnish" in textl:
        return "Unfurnished"
    if "furnish" in textl:
        return "Furnished"
    return "Unknown"


# ──────────────────────────────────────────────
# Facing direction extraction
# ──────────────────────────────────────────────

_FACING_DIRECTIONS = (
    r"north[\s\-]?east|north[\s\-]?west|south[\s\-]?east|south[\s\-]?west"
    r"|north|south|east|west"
)

def extract_facing(text: str) -> str:
    """
    Extract property facing direction from a listing text snippet.
    Handles patterns like 'East Facing', 'Facing East', 'North-East'.
    Returns a canonical direction string or '' if not found.
    """
    if not text:
        return ""
    # Pattern 1: "North-East facing" / "East facing"
    m = re.search(
        rf"(?i)\b({_FACING_DIRECTIONS})\b[\s\-]*facing",
        text,
    )
    if m:
        return m.group(1).strip().title()
    # Pattern 2: "facing East" / "facing North-West"
    m = re.search(
        rf"(?i)\bfacing[\s\-]+({_FACING_DIRECTIONS})\b",
        text,
    )
    if m:
        return m.group(1).strip().title()
    return ""
