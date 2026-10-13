"""
api.py — FastAPI wrapper for the on-demand rental scraper pipeline.

Endpoints:
  POST /api/v1/rentals    → run full parallel pipeline, return normalized results
  GET  /api/v1/health     → system health check
  GET  /api/v1/scrapers   → list all registered scrapers and their status

Run with:
  cd india_rental_scraper
  uvicorn api:app --host 0.0.0.0 --port 8001 --reload

Called by zonek-intelligence2.0 backend:
  POST http://localhost:8001/api/v1/rentals
  Body: { "location": "RS Puram, Coimbatore", "platforms": null }
"""

import logging
import time
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel, Field # type: ignore

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from scrapers.base_scraper import setup_logging

setup_logging()
logger = logging.getLogger("rental_scraper")

app = FastAPI(
    title       = "Zonek Rental Scraper API",
    description = (
        "On-demand parallel rental listing scraper for India. "
        "Scrapes OLX, MagicBricks, 99acres, NoBroker, Housing.com, "
        "PropTiger, Makaan.com, and QuikrHomes simultaneously for a given location."
    ),
    version     = "2.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["*"],
    allow_methods  = ["GET", "POST"],
    allow_headers  = ["*"],
)


# ── Request / Response models ─────────────────────────────────────────────────

class RentalRequest(BaseModel):
    location: str = Field(
        ...,
        description="Location string, e.g. 'RS Puram, Coimbatore' or '641002'",
        examples=["RS Puram, Coimbatore"],
    )
    platforms: Optional[list[str]] = Field(
        default=None,
        description="Optional list of platform keys to restrict to. Default: all platforms.",
        examples=[["olx", "magicbricks"]],
    )
    use_fast_geocode: bool = Field(
        default=False,
        description="Skip network geocoding (faster but no pincode resolution).",
    )


class HealthResponse(BaseModel):
    status:        str
    scrapers_available: int
    timestamp:     str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/v1/health", response_model=HealthResponse, summary="System health check")
async def health_check():
    from datetime import datetime, timezone
    try:
        from pipeline import _build_registry
        registry = _build_registry()
        count = len(registry)
    except Exception:
        count = 0

    return HealthResponse(
        status            = "ok",
        scrapers_available= count,
        timestamp         = datetime.now(timezone.utc).isoformat(),
    )


@app.get("/api/v1/scrapers", summary="List all registered scrapers")
async def list_scrapers():
    """Returns all scraper keys that are registered and importable."""
    try:
        from pipeline import _build_registry
        registry = _build_registry()
        return {
            "count":    len(registry),
            "scrapers": list(registry.keys()),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post(
    "/api/v1/rentals",
    summary     = "Fetch rental listings for a location",
    description = (
        "Launches all registered scrapers in parallel for the given location. "
        "Returns normalized rental listings grouped by platform, plus a flat "
        "deduplicated list sorted by rent. "
        "Each listing has a direct `listing_url` to the original ad."
    ),
)
async def fetch_rentals(request: RentalRequest):
    """
    Main scraper endpoint. Runs all 8 scrapers in parallel.

    Response schema:
    ```json
    {
      "query": { "raw": "RS Puram, Coimbatore", "city": "Coimbatore", ... },
      "scraped_at": "ISO-8601",
      "elapsed_seconds": 11.2,
      "total_listings": 34,
      "verified_count": 28,
      "platforms": {
        "OLX":         { "status": "ok",      "count": 12, "elapsed_s": 4.1 },
        "MagicBricks": { "status": "empty",   "count": 0,  "elapsed_s": 8.2 },
        ...
      },
      "listings_by_platform": {
        "OLX": [ { "title": ..., "rent_per_month": 42000, "listing_url": "https://...", ... } ],
        ...
      },
      "all_listings": [ ...deduplicated, sorted by rent... ]
    }
    ```
    """
    if not request.location or not request.location.strip():
        raise HTTPException(status_code=400, detail="'location' field cannot be empty.")

    location = request.location.strip()
    logger.info("[API] POST /api/v1/rentals  location='%s'  platforms=%s", location, request.platforms)

    t_start = time.time()

    try:
        from pipeline import run_pipeline_async
        result = await run_pipeline_async(
            location_input   = location,
            platforms_filter = request.platforms,
            use_fast_geocode = request.use_fast_geocode,
        )
    except Exception as exc:
        logger.error("[API] Pipeline failed for '%s': %s", location, exc, exc_info=True)
        raise HTTPException(
            status_code = 500,
            detail      = f"Scraper pipeline failed: {str(exc)}",
        )

    elapsed = round(time.time() - t_start, 2)
    logger.info(
        "[API] Done in %.1fs — %d listings from %d platforms",
        elapsed,
        result.get("total_listings", 0),
        len([p for p in result.get("platforms", {}).values() if p.get("status") == "ok"]),
    )
    return result


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn # type: ignore
    uvicorn.run(
        "api:app",
        host    = "0.0.0.0",
        port    = 8001,
        reload  = True,
        log_level = "info",
    )
