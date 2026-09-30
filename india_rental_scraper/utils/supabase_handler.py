"""
utils/supabase_handler.py
Handles all Supabase interactions for the rental scraper.
"""
import logging
from datetime import datetime

from supabase import create_client, Client # type: ignore
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger("rental_scraper")

_client: Client | None = None

def connect_supabase() -> Client:
    """Return a cached Supabase client."""
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.critical("❌ SUPABASE_URL or SUPABASE_KEY missing in environment.")
            raise ValueError("Supabase credentials missing.")
        
        try:
            _client = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("✅ Supabase connected at %s", SUPABASE_URL)
        except Exception as e:
            logger.critical("❌ Cannot connect to Supabase: %s", e)
            raise
    return _client

def upsert_listing(doc: dict) -> str:
    """
    Upsert a single listing document to Supabase 'rental_posts' table keyed on listing_url.
    Returns 'upserted' or 'skipped'.
    """
    client = connect_supabase()
    listing_url = doc.get("listing_url")
    if not listing_url:
        logger.warning("Skipping doc with no listing_url: %s", doc)
        return "skipped"

    # Map the document to match our schema structure
    # We will preserve the keys that exist in Supabase and map the extra ones
    
    # Build record with ONLY confirmed columns in rental_posts schema.
    # Sending a key that doesn't exist in the schema will cause PGRST204 and abort the entire upsert.
    record = {
        "title":           doc.get("title") or "Commercial Property for Rent",
        "category":        doc.get("property_type") or doc.get("category") or "commercial",
        "description":     doc.get("description") or "",
        "images":          doc.get("images") or [],
        "listing_url":     listing_url,
        "source_platform": doc.get("source_platform"),
        "city":            doc.get("city"),
        "locality":        doc.get("locality"),
        "state":           doc.get("state") or "",
        "address":         doc.get("address") or "",
        "price":           doc.get("rent_per_month") or 0,
        "square_feet":     doc.get("area_sqft") or 0,
        "rent_per_sqft":   doc.get("rent_per_sqft"),
        "zoning_code":     doc.get("zoning_code") or "Commercial",
        "raw_price_text":  doc.get("raw_price_text") or "",
        "listing_date":    doc.get("listing_date") or datetime.utcnow().isoformat(),
        "is_verified":     bool(doc.get("is_verified", False)),
        "phone":           str(doc.get("phonenumber")) if doc.get("phonenumber") else None,
        "updated_at":      datetime.utcnow().isoformat(),
    }
    
    if doc.get("lat") and doc.get("lon"):
        record["location"] = f"POINT({doc['lon']} {doc['lat']})"
    # Optional columns — include only if they have real values, so platforms that
    # don't supply them don't send None and trigger schema errors on missing columns.
    _OPTIONAL_COLS = {
        "furnishing_status": doc.get("furnishing_status"),
    }
    for col, val in _OPTIONAL_COLS.items():
        if val is not None and val not in ("", "Unknown"):
            record[col] = val


    try:
        response = client.table("rental_posts").upsert(
            record,
            on_conflict="listing_url"
        ).execute()
        
        # If the response contains data, it was successful
        if response.data:
            return "upserted"
        else:
            return "skipped"
            
    except Exception as e:
        logger.error("Upsert error for %s: %s", listing_url, e)
        return "skipped"


def bulk_upsert(docs: list[dict]) -> dict:
    """
    Bulk upsert a list of listing documents.
    Returns a stats dict: {upserted, skipped}.
    """
    stats = {"upserted": 0, "skipped": 0}
    # Currently doing one by one for simplicity and exact error catching per record.
    # Supabase does support batch upsert if we pass a list to .upsert()
    for doc in docs:
        outcome = upsert_listing(doc)
        stats[outcome] += 1
    return stats


def get_stats() -> dict:
    """Return document count in the table (basic implementation)."""
    client = connect_supabase()
    try:
        # Get overall count (head=True only gets headers/count)
        response = client.table("rental_posts").select("id", count="exact").execute()
        total = response.count if response.count is not None else 0
        
        return {
            "total": total,
            "by_platform": {} # We can do complex aggregation via RPC if needed
        }
    except Exception as e:
        logger.error("Error getting stats: %s", e)
        return {"total": 0, "by_platform": {}}

def delete_expired_listings(hours: int = 48) -> dict:
    """
    Deletes listings from the database that haven't been updated in the specified number of hours.
    This acts as a TTL (Time To Live) sweep.
    """
    from datetime import timedelta
    client = connect_supabase()
    
    threshold_time = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    
    try:
        response = client.table("rental_posts").delete().lt("updated_at", threshold_time).execute()
        
        deleted_count = len(response.data) if response.data else 0
        logger.info("🧹 Cleaned up %d expired listings older than %d hours.", deleted_count, hours)
        return {"deleted": deleted_count}
    except Exception as e:
        logger.error("❌ Error deleting expired listings: %s", e)
        return {"deleted": 0}
