"""
main.py — CLI entry point for the India Rental Scraper.

Usage:
    python main.py                         # run all enabled platforms, all cities
    python main.py --platform acres99      # run one platform, all cities
    python main.py --platform acres99 --city Chennai   # one platform, one city
    python main.py --list                  # show available platforms
    python main.py --stats                 # show MongoDB stats
"""
import argparse
import sys
import os
import time

sys.path.insert(0, os.path.dirname(__file__))

from config import PLATFORMS, CITIES
from scrapers.base_scraper import setup_logging


# ── Platform registry ─────────────────────────────────────────────────────────
# Add each new scraper here as you build it.

def _get_registry() -> dict:
    """Lazy-import all available scraper classes."""
    registry = {}

    try:
        from scrapers.magicbricks import MagicBricksScraper
        registry["magicbricks"] = MagicBricksScraper
    except ImportError:
        pass

    try:
        from scrapers.olx import OLXScraper
        registry["olx"] = OLXScraper
    except ImportError:
        pass

    try:
        from scrapers.olx import OLXScraper
        registry["olx"] = OLXScraper
    except ImportError:
        pass

    return registry


# ── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(
        description="India Commercial Shop Rental Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                             # all platforms, all cities
  python main.py --platform acres99          # 99acres, all cities
  python main.py --platform acres99 --city Chennai
  python main.py --list                      # list available platforms
  python main.py --stats                     # MongoDB collection stats
        """
    )
    parser.add_argument("--platform", type=str, default=None,
                        help="Platform key to scrape (e.g. acres99, magicbricks)")
    parser.add_argument("--city", type=str, default=None,
                        help="City to scrape (must match config.CITIES exactly)")
    parser.add_argument("--list", action="store_true",
                        help="List available platforms and exit")
    parser.add_argument("--stats", action="store_true",
                        help="Show MongoDB collection statistics and exit")
    return parser.parse_args()


# ── Helpers ───────────────────────────────────────────────────────────────────

def print_stats(logger) -> None:
    from utils.supabase_handler import get_stats
    try:
        stats = get_stats()
        logger.info("📊 Supabase Stats — Total docs: %d", stats["total"])
        for platform, count in stats["by_platform"].items():
            logger.info("   %-20s : %d", platform, count)
    except Exception as e:
        logger.error("Could not fetch stats: %s", e)


def list_platforms(registry: dict) -> None:
    print("\nAvailable platforms:")
    print(f"  {'Key':<15} {'Display Name':<20} {'Enabled':<10} {'Built'}")
    print("  " + "-" * 55)
    for key, cfg in PLATFORMS.items():
        built   = "[READY]" if key in registry else "[pending]"
        enabled = "[ON] " if cfg["enabled"] else "[OFF]"
        print(f"  {key:<15} {cfg['display_name']:<20} {enabled:<10} {built}")
    print()


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    args    = parse_args()
    logger  = setup_logging()
    registry = _get_registry()

    # ── --list
    if args.list:
        list_platforms(registry)
        return

    # ── --stats
    if args.stats:
        print_stats(logger)
        return

    # ── Choose platforms to run
    if args.platform:
        if args.platform not in registry:
            logger.error(
                "Platform '%s' not found or not yet built. Use --list to see available platforms.",
                args.platform
            )
            sys.exit(1)
        if not PLATFORMS.get(args.platform, {}).get("enabled", True):
            logger.warning("Platform '%s' is disabled in config.py — running anyway.", args.platform)
        platforms_to_run = [args.platform]
    else:
        platforms_to_run = [k for k in registry if PLATFORMS.get(k, {}).get("enabled", True)]

    if not platforms_to_run:
        logger.warning("No enabled platforms to run. Check config.py PLATFORMS.")
        return

    # ── Choose cities
    cities = [args.city] if args.city else None
    if args.city and args.city not in CITIES:
        logger.warning("'%s' not in config.CITIES — running anyway.", args.city)

    # ── Run
    overall_start = time.time()
    grand_total   = {"inserted": 0, "updated": 0, "skipped": 0}

    logger.info("=" * 60)
    logger.info("[START] India Rental Scraper -- starting run")
    logger.info("   Platforms : %s", platforms_to_run)
    logger.info("   Cities    : %s", cities or CITIES)
    logger.info("=" * 60)

    import asyncio
    from pipeline import run_pipeline_async
    
    # Run pipeline for all cities sequentially, but platforms run in parallel
    for city in cities:
        try:
            logger.info("Starting pipeline for city: %s", city)
            # We must use asyncio.run for each city, or gather them
            res = asyncio.run(run_pipeline_async(city, platforms_to_run))
            
            # Since pipeline returns aggregated stats but already upserts, 
            # we don't strictly need to sum inserted/updated unless we extract them from the response.
            # Currently run_pipeline_async returns standard stats dict.
            grand_total["inserted"] += res.get("total_listings", 0)
        except Exception as e:
            logger.error("Error processing city %s: %s", city, e)

    elapsed = time.time() - overall_start
    logger.info("=" * 60)
    logger.info("[DONE] All done in %.1f seconds", elapsed)
    logger.info("   Total Listings Extracted : %d", grand_total["inserted"])
    logger.info("=" * 60)

    print_stats(logger)


if __name__ == "__main__":
    main()
