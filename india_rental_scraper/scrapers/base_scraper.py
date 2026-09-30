# scrapers/base_scraper.py
# Abstract base class all platform scrapers inherit from.
# Subclasses must implement scrape_city(city) -> list[dict].
# Optionally override scrape_city_location(LocationContext) for locality-scoped fetching.
import abc
import logging
import os
import random
import time
from typing import Optional

import curl_cffi.requests as requests

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from config import (
    CITIES,
    CITY_SLUGS,
    REQUEST_DELAY_MIN,
    REQUEST_DELAY_MAX,
    MAX_RETRIES,
    LOG_DIR,
    LOG_FILE,
)
from utils.user_agents import get_headers
from utils.supabase_handler import bulk_upsert


# ──────────────────────────────────────────────
# Logging setup  (call once at import time)
# ──────────────────────────────────────────────

def setup_logging(name: str = "rental_scraper") -> logging.Logger:
    """Configure and return the shared scraper logger."""
    os.makedirs(LOG_DIR, exist_ok=True)

    logger = logging.getLogger(name)
    if logger.handlers:
        return logger   # already configured

    logger.setLevel(logging.DEBUG)
    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # File handler — full DEBUG
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)

    # Console handler — INFO+
    sh = logging.StreamHandler()
    sh.setLevel(logging.INFO)
    sh.setFormatter(fmt)

    logger.addHandler(fh)
    logger.addHandler(sh)
    return logger


# ──────────────────────────────────────────────
# Requests session with retry
# ──────────────────────────────────────────────

def build_async_session() -> requests.AsyncSession:
    """Return an async requests.AsyncSession with automatic retry on transient errors."""
    session = requests.AsyncSession(impersonate="chrome")
    # The impersonation makes it bypass TLS fingerprinting
    return session


# ──────────────────────────────────────────────
# Abstract Base Scraper
# ──────────────────────────────────────────────

class BaseScraper(abc.ABC):
    """
    All platform scrapers inherit from this class.

    Subclasses must implement:
      - platform_key  (str class attribute)
      - display_name  (str class attribute)
      - async scrape_city_location(location_ctx) -> list[dict]
    """

    platform_key: str = ""
    display_name: str = ""
    uses_playwright: bool = False

    def __init__(self):
        self.logger = setup_logging()

    # ── HTTP helper ───────────────────────────

    async def fetch(
        self,
        url: str,
        extra_headers: dict | None = None,
        timeout: int = 20,
        max_retries: int | None = None,
    ) -> Optional[str]:
        """
        GET url with rotating headers + retry.
        Pass timeout and max_retries to override the global config defaults
        (useful for optional API probes that should fail fast).
        Returns HTML text or None on failure.
        """
        headers  = get_headers(extra_headers)
        retries  = max_retries if max_retries is not None else MAX_RETRIES
        for attempt in range(1, retries + 1):
            try:
                self.logger.debug("GET %s (attempt %d)", url, attempt)
                async with build_async_session() as session:
                    resp = await session.get(url, headers=headers, timeout=timeout)
                    resp.raise_for_status()
                    await self.random_delay()
                    return resp.text
            except requests.exceptions.HTTPError as e:
                self.logger.warning("HTTP %s on %s (attempt %d)", e.response.status_code, url, attempt)
            except requests.exceptions.ConnectionError as e:
                self.logger.warning("Connection error on %s (attempt %d): %s", url, attempt, e)
            except requests.exceptions.Timeout:
                self.logger.warning("Timeout on %s (attempt %d)", url, attempt)
            except Exception as e:
                self.logger.error("Unexpected error fetching %s: %s", url, e)
                break
            if attempt < retries:
                await self.random_delay(multiplier=attempt)
        self.logger.debug("All %d attempts failed for %s", retries, url)
        return None

    # ── Playwright helpers (Async) ────────────────

    async def launch_playwright(self):
        """Launch a Playwright Chromium browser in async stealth mode."""
        from playwright.async_api import async_playwright
        self._playwright_context_mgr = async_playwright()
        self._playwright = await self._playwright_context_mgr.start()
        self._browser = await self._playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-infobars",
                "--disable-http2",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--window-size=1366,768",
                "--lang=en-IN",
                "--disable-extensions",
            ],
        )
        self.logger.debug("Async Playwright browser launched.")
        return self._browser

    async def get_playwright_page(self, url: str, wait_for: str = "networkidle"):
        """
        Open a new Async Playwright page, set UA + stealth headers, navigate, wait.
        """
        if getattr(self, "_browser", None) is None:
            await self.launch_playwright()

        ua = get_headers()["User-Agent"]
        context = await self._browser.new_context(
            user_agent=ua,
            viewport={"width": 1366, "height": 768},
            locale="en-IN",
            timezone_id="Asia/Kolkata",
            extra_http_headers={
                "Accept-Language": "en-IN,en;q=0.9,ta;q=0.7",
                "sec-ch-ua": '"Chromium";v="123", "Not:A-Brand";v="8"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "Upgrade-Insecure-Requests": "1",
            },
        )
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        page = await context.new_page()

        try:
            from playwright_stealth import stealth_async
            await stealth_async(page)
        except ImportError:
            pass

        try:
            await page.goto(url, wait_until=wait_for, timeout=60_000)
            await self.random_delay()
        except Exception as e:
            self.logger.warning("Playwright navigation failed for %s: %s", url, e)
            try:
                await page.wait_for_load_state("domcontentloaded", timeout=10_000)
            except Exception:
                pass
        return page

    async def close_playwright(self):
        """Shut down the Playwright browser cleanly."""
        try:
            if getattr(self, "_browser", None):
                await self._browser.close()
            if getattr(self, "_playwright", None):
                await self._playwright.stop()
        except Exception as e:
            self.logger.warning("Error closing Playwright: %s", e)
        finally:
            self._browser   = None
            self._playwright = None

    async def random_delay(self, multiplier: float = 1.0) -> None:
        """Sleep for a random duration between REQUEST_DELAY_MIN and REQUEST_DELAY_MAX asynchronously."""
        import asyncio
        delay = random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX) * multiplier
        self.logger.debug("Sleeping %.1fs…", delay)
        await asyncio.sleep(delay)

    # ── City slug ────────────────────────────

    @staticmethod
    def city_slug(city: str) -> str:
        """Return the URL slug for a city name."""
        return CITY_SLUGS.get(city, city.lower().replace(" ", "-"))

    # ── Abstract interface ────────────────────

    # ── On-demand interface ───────────────────

    @abc.abstractmethod
    async def scrape_city_location(self, location_ctx) -> list[dict]:
        """
        On-demand async entry point called by pipeline.py.
        Receives a LocationContext and returns all listings for that location.

        Args:
            location_ctx: utils.location_resolver.LocationContext instance

        Returns:
            list of listing dicts
        """
        ...

    @staticmethod
    def _make_locality_slug(locality: str, city: str) -> str:
        """Build a URL-safe 'locality-city' slug used by platforms that support it."""
        import re
        parts = [p for p in [locality, city] if p]
        combined = " ".join(parts)
        return re.sub(r"[^a-z0-9]+", "-", combined.strip().lower()).strip("-")

    # ── Main run loop ─────────────────────────

    async def run(self, cities: list[str] | None = None) -> dict:
        """
        Run the scraper over the specified cities (defaults to config.CITIES).
        For each city, calls scrape_city_location() and upserts results to Supabase.
        Returns cumulative upsert stats.
        """
        from utils.location_resolver import LocationContext
        from utils.supabase_handler import bulk_upsert

        target_cities = cities or CITIES
        total_stats   = {"upserted": 0, "skipped": 0}

        self.logger.info("[START] %s scraper — cities: %s", self.display_name, target_cities)

        for city in target_cities:
            ctx = LocationContext(
                city=city,
                locality="",
                pincode="",
                state="",
                lat=0.0,
                lng=0.0,
                raw_input=city,
            )
            try:
                listings = await self.scrape_city_location(ctx)
                if listings:
                    stats = bulk_upsert(listings)
                    total_stats["upserted"] += stats.get("upserted", 0)
                    total_stats["skipped"]  += stats.get("skipped", 0)
                    self.logger.info("[%s] %s → %d upserted, %d skipped",
                                     self.display_name, city,
                                     stats.get("upserted", 0), stats.get("skipped", 0))
                else:
                    self.logger.info("[%s] %s → 0 listings", self.display_name, city)
            except Exception as e:
                self.logger.error("[%s] Error scraping %s: %s", self.display_name, city, e)

        self.logger.info("[DONE] %s — total upserted=%d skipped=%d",
                         self.display_name, total_stats["upserted"], total_stats["skipped"])
        return total_stats

