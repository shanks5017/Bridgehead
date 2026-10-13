"""
pipeline.py — On-demand parallel rental scraper orchestrator (Asyncio Native).
"""
import asyncio
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("rental_scraper")

@dataclass
class PlatformResult:
    platform:   str
    status:     str
    count:      int
    listings:   list[dict]
    error_msg:  str = ""
    elapsed_s:  float = 0.0

@dataclass
class RentalResult:
    query:                dict
    scraped_at:           str
    elapsed_seconds:      float
    total_listings:       int
    platforms:            dict[str, dict]
    listings_by_platform: dict[str, list]
    all_listings:         list[dict]

def _locality_filter(listings: list[dict], locality: str, city: str) -> list[dict]:
    if not (locality or city):
        for doc in listings:
            doc["location_verified"] = True
        return listings

    loc_lower  = locality.lower().strip() if locality else ""
    city_lower = city.lower().strip()     if city     else ""

    for doc in listings:
        doc_locality = (doc.get("locality") or "").lower()
        doc_city     = (doc.get("city")     or "").lower()

        verified = (
            (loc_lower  and (loc_lower in doc_locality or loc_lower in doc_city))
            or (city_lower and city_lower in doc_city)
        )
        doc["location_verified"] = bool(verified)

    return listings

def _extract_bhk(title: str) -> int | None:
    """Extract BHK count from a listing title (e.g. '2BHK', '3 BHK')."""
    import re
    m = re.search(r"(\d)\s*bhk", (title or "").lower())
    return int(m.group(1)) if m else None


def _locality_tokens(locality: str) -> set[str]:
    """Tokenise locality string for fuzzy comparison."""
    import re
    raw = (locality or "").lower()
    return {t for t in re.split(r"[\s,\-]+", raw) if len(t) > 2}


def _deduplicate(listings: list[dict]) -> list[dict]:
    """
    Two-pass deduplication:
      Pass 1 — exact URL deduplication (instant, O(n))
      Pass 2 — fuzzy cross-platform dedup:
                same listing if ALL 3 match:
                  a) price within ±10%
                  b) at least 1 overlapping locality token
                  c) same BHK count (if both have one)
    If a duplicate is found the first occurrence wins.
    """
    # Pass 1: URL-exact
    seen_urls: set[str] = set()
    url_deduped: list[dict] = []
    for doc in listings:
        url = doc.get("listing_url", "")
        if url and url in seen_urls:
            continue
        if url:
            seen_urls.add(url)
        url_deduped.append(doc)

    # Pass 2: Fuzzy cross-platform dedup
    result: list[dict] = []
    for doc in url_deduped:
        price    = doc.get("rent_per_month")
        locality = _locality_tokens(doc.get("locality", ""))
        bhk      = _extract_bhk(doc.get("title", ""))

        is_dup = False
        for kept in result:
            # Only apply fuzzy dedup ACROSS platforms. 
            # Same-platform listings with different URLs are genuinely different ads.
            if doc.get("source_platform") == kept.get("source_platform"):
                continue

            kp = kept.get("rent_per_month")
            # Price must be present and within 10% of each other
            if price and kp:
                lo, hi = min(price, kp), max(price, kp)
                if hi > lo * 1.10:          # >10% apart → not the same
                    continue
            else:
                continue  # can't fuzzy-match without price

            # Locality tokens must share at least one word
            kl = _locality_tokens(kept.get("locality", ""))
            if not (locality & kl):
                continue

            # BHK: if both have it, they must match
            kb = _extract_bhk(kept.get("title", ""))
            if bhk is not None and kb is not None and bhk != kb:
                continue

            is_dup = True
            break

        if not is_dup:
            result.append(doc)

    return result

def _enrich_with_metadata(doc: dict, platform_key: str, scraped_at: str) -> dict:
    doc.setdefault("scraped_at", scraped_at)
    doc.setdefault("source_platform", platform_key)
    doc.setdefault("location_verified", False)
    doc.setdefault("images", [])
    doc.setdefault("description", "")
    doc.setdefault("title", "")
    return doc

async def _run_single_scraper_async(
    platform_key: str,
    scraper_class,
    location_ctx,
    scraped_at: str,
) -> PlatformResult:
    t_start = time.time()
    display_name = platform_key

    try:
        scraper = scraper_class()
        display_name = scraper.display_name

        logger.info("[%s] Starting scrape for: %s", display_name, location_ctx.search_query())

        listings: list[dict] = await scraper.scrape_city_location(location_ctx)

        listings = [_enrich_with_metadata(d, display_name, scraped_at) for d in listings]
        listings = _locality_filter(listings, location_ctx.locality, location_ctx.city)
        listings = _deduplicate(listings)

        elapsed = round(time.time() - t_start, 2)
        count   = len(listings)

        logger.info("[%s] Done — %d listings in %.1fs", display_name, count, elapsed)

        return PlatformResult(
            platform  = display_name,
            status    = "ok" if count > 0 else "empty",
            count     = count,
            listings  = listings,
            elapsed_s = elapsed,
        )

    except asyncio.CancelledError:
        elapsed = round(time.time() - t_start, 2)
        logger.warning("[%s] Scraper cancelled (timeout).", display_name)
        return PlatformResult(
            platform=display_name, status="timeout", count=0, listings=[],
            error_msg="Timeout exceeded", elapsed_s=elapsed
        )
    except Exception as exc:
        elapsed = round(time.time() - t_start, 2)
        logger.error("[%s] Scraper crashed after %.1fs: %s", display_name, elapsed, exc, exc_info=True)
        return PlatformResult(
            platform  = display_name,
            status    = "error",
            count     = 0,
            listings  = [],
            error_msg = str(exc),
            elapsed_s = elapsed,
        )

def _background_mongo_write(all_listings: list[dict]) -> None:
    try:
        from utils.supabase_handler import bulk_upsert, delete_expired_listings
        stats = bulk_upsert(all_listings)
        logger.info(
            "[Supabase] Background write: %d upserted | %d skipped",
            stats.get("upserted", 0),
            stats.get("skipped", 0),
        )
        
        # TTL Cleanup: Delete anything that hasn't been updated in 48 hours
        delete_expired_listings(hours=48)
        
    except Exception as exc:
        logger.warning("[Supabase] Background write failed: %s", exc)

async def run_pipeline_async(
    location_input: str,
    platforms_filter: Optional[list[str]] = None,
    use_fast_geocode: bool = False,
) -> dict:
    from scrapers.base_scraper import setup_logging
    setup_logging()

    logger.info("[Pipeline] Resolving location: '%s'", location_input)
    if use_fast_geocode:
        from utils.location_resolver import resolve_location_fast
        location_ctx = resolve_location_fast(location_input)
    else:
        from utils.location_resolver import resolve_location
        location_ctx = resolve_location(location_input)

    logger.info(
        "[Pipeline] Location resolved → city=%s locality=%s pincode=%s geocoded=%s",
        location_ctx.city, location_ctx.locality, location_ctx.pincode, location_ctx.geocoded,
    )

    registry = _build_registry()
    if platforms_filter:
        registry = {k: v for k, v in registry.items() if k in platforms_filter}

    if not registry:
        logger.error("[Pipeline] No scrapers available.")
        return _empty_result(location_ctx)

    # Pre-resolve locality IDs for all platforms to prevent race conditions
    from resolvers.locality_resolver import locality_resolver
    await locality_resolver.resolve_all(location_ctx.city or location_ctx.raw_input, location_ctx.locality or "")

    scraped_at = datetime.now(timezone.utc).isoformat()
    t_pipeline_start = time.time()

    logger.info("[Pipeline] Launching %d async scrapers in parallel...", len(registry))

    tasks = []
    for key, scraper_class in registry.items():
        task = asyncio.create_task(
            _run_single_scraper_async(key, scraper_class, location_ctx, scraped_at)
        )
        tasks.append(task)

    platform_results = await asyncio.gather(*tasks, return_exceptions=True)
    
    elapsed = round(time.time() - t_pipeline_start, 2)
    logger.info("[Pipeline] All scrapers done in %.1fs", elapsed)

    platforms_summary: dict[str, dict]  = {}
    listings_by_platform: dict[str, list] = {}
    all_listings_raw: list[dict] = []

    for pr in platform_results:
        if isinstance(pr, PlatformResult):
            platforms_summary[pr.platform] = {
                "status":    pr.status,
                "count":     pr.count,
                "elapsed_s": pr.elapsed_s,
                "error":     pr.error_msg or None,
            }
            listings_by_platform[pr.platform] = pr.listings
            all_listings_raw.extend(pr.listings)
        elif isinstance(pr, Exception):
            logger.error("[Pipeline] Task returned exception: %s", pr)

    all_listings_deduped = _deduplicate(all_listings_raw)

    all_listings_sorted = sorted(
        all_listings_deduped,
        key=lambda d: (
            not d.get("location_verified", False),
            d.get("rent_per_month") is None,
            d.get("rent_per_month") or float("inf"),
        ),
    )

    total = len(all_listings_sorted)
    logger.info(
        "[Pipeline] Total: %d listings from %d platforms (%d verified locality match)",
        total,
        len([p for p in platform_results if isinstance(p, PlatformResult) and p.status == "ok"]),
        sum(1 for d in all_listings_sorted if d.get("location_verified")),
    )

    result = {
        "query": {
            "raw":            location_ctx.raw_input,
            "city":           location_ctx.city,
            "locality":       location_ctx.locality,
            "pincode":        location_ctx.pincode,
            "state":          location_ctx.state,
            "lat":            location_ctx.lat,
            "lng":            location_ctx.lng,
            "geocoded":       location_ctx.geocoded,
            "resolver_ms":    location_ctx.resolver_ms,
        },
        "scraped_at":           scraped_at,
        "elapsed_seconds":      elapsed,
        "total_listings":       total,
        "verified_count":       sum(1 for d in all_listings_sorted if d.get("location_verified")),
        "platforms":            platforms_summary,
        "listings_by_platform": listings_by_platform,
        "all_listings":         all_listings_sorted,
    }

    if all_listings_sorted:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _background_mongo_write, all_listings_sorted)

    return result

def run_pipeline(
    location_input: str,
    platforms_filter: Optional[list[str]] = None,
    use_fast_geocode: bool = False,
) -> dict:
    """Synchronous wrapper for async pipeline"""
    return asyncio.run(run_pipeline_async(location_input, platforms_filter, use_fast_geocode))

def _empty_result(location_ctx) -> dict:
    return {
        "query": {
            "raw":      location_ctx.raw_input,
            "city":     location_ctx.city,
            "locality": location_ctx.locality,
            "pincode":  location_ctx.pincode,
        },
        "scraped_at":           datetime.now(timezone.utc).isoformat(),
        "elapsed_seconds":      0,
        "total_listings":       0,
        "verified_count":       0,
        "platforms":            {},
        "listings_by_platform": {},
        "all_listings":         [],
    }

def _build_registry() -> dict:
    registry = {}
    _scrapers = [
        ("olx",        "scrapers.olx",        "OLXScraper"),
        ("magicbricks","scrapers.magicbricks","MagicBricksScraper"),
    ]
    for key, module_path, class_name in _scrapers:
        try:
            import importlib
            mod = importlib.import_module(module_path)
            registry[key] = getattr(mod, class_name)
        except Exception as e:
            logger.warning("[Registry] Could not load %s: %s", class_name, e)
    return registry

if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Run the on-demand async rental pipeline")
    parser.add_argument("location", nargs="?", default="RS Puram, Coimbatore",
                        help="Location to search (e.g. 'RS Puram, Coimbatore')")
    parser.add_argument("--platforms", nargs="+", default=None,
                        help="Platform keys to include (default: all)")
    parser.add_argument("--fast-geocode", action="store_true",
                        help="Skip network geocoding (faster, less accurate)")
    parser.add_argument("--output", default=None,
                        help="Save result JSON to this file")
    args = parser.parse_args()

    result = run_pipeline(
        location_input   = args.location,
        platforms_filter = args.platforms,
        use_fast_geocode = args.fast_geocode,
    )

    print(f"\n{'='*60}")
    print(f"  Location : {result['query']['raw']}")
    print(f"  City     : {result['query']['city']}")
    print(f"  Locality : {result['query']['locality']}")
    print(f"  Pincode  : {result['query']['pincode']}")
    print(f"  Geocoded : {result['query']['geocoded']}")
    print(f"  Elapsed  : {result['elapsed_seconds']}s")
    print(f"  Total    : {result['total_listings']} listings")
    print(f"  Verified : {result['verified_count']} locality-matched")
    print(f"\n  By Platform:")
    for platform, pdata in result["platforms"].items():
        status_icon = {"ok": "[+]", "empty": "[!]", "timeout": "[T]", "error": "[X]", "blocked": "[B]"}.get(pdata["status"], "?")
        print(f"    {status_icon} {platform:<20} {pdata['count']:>4} listings  ({pdata['elapsed_s']}s)")
    print(f"{'='*60}\n")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"Saved to {args.output}")
