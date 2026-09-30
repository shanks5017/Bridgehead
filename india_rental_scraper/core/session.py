"""
core/session.py
Shared curl_cffi session manager.

curl_cffi with impersonate="chrome120" replicates Chrome's exact TLS fingerprint,
JA3 hash, and HTTP/2 ALPN negotiation at the socket level. This means websites
that fingerprint TLS (Cloudflare, Akamai, etc.) see a legitimate Chrome browser —
without ever opening one.

No Playwright required.
"""
import logging
from curl_cffi.requests import AsyncSession

logger = logging.getLogger("rental_scraper")


class SessionManager:
    """
    Manages a shared curl_cffi AsyncSession.
    The session persists cookies across requests automatically.
    """

    def __init__(self):
        self._session: AsyncSession | None = None

    def get_session(self) -> AsyncSession:
        """Return (or lazily create) the shared impersonating session."""
        if self._session is None:
            self._session = AsyncSession(
                impersonate="chrome120",   # Full Chrome TLS + HTTP/2 fingerprint
                timeout=30,
            )
            logger.debug("[SessionManager] Created new curl_cffi AsyncSession (chrome120)")
        return self._session

    async def close(self):
        """Explicitly close the session if needed at shutdown."""
        if self._session is not None:
            try:
                await self._session.close()
            except Exception:
                pass
            self._session = None


# Global singleton — imported by all scrapers
session_manager = SessionManager()
