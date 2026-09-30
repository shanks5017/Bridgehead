import asyncio
import random
import logging

logger = logging.getLogger("rental_scraper")

class RateLimiter:
    """
    Manages concurrency limits and random jitter delays per domain.
    """
    def __init__(self, max_concurrent: int, delay_min: float, delay_max: float):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.delay_min = delay_min
        self.delay_max = delay_max

    async def acquire(self):
        await self.semaphore.acquire()
        delay = random.uniform(self.delay_min, self.delay_max)
        if delay > 0:
            await asyncio.sleep(delay)

    def release(self):
        self.semaphore.release()

    async def __aenter__(self):
        await self.acquire()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.release()

# Global registry of rate limiters per active platform
PLATFORM_LIMITERS = {
    "olx":         RateLimiter(10, 0.3, 0.8),
    "magicbricks": RateLimiter(4,  0.5, 1.5),
    "acres99":     RateLimiter(4,  0.5, 1.5),
    "housing":     RateLimiter(4,  0.5, 1.5),
    "nobroker":    RateLimiter(6,  0.4, 0.9),
    "proptiger":   RateLimiter(4,  0.5, 1.5),
}

def get_rate_limiter(platform_key: str) -> RateLimiter:
    return PLATFORM_LIMITERS.get(platform_key, RateLimiter(5, 0.5, 1.5))
