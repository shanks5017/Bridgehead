"""
Probe MagicBricks correct URL pattern and Housing/PropTiger with full browser headers.
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from curl_cffi.requests import AsyncSession

BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-IN,en-GB;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "max-age=0",
    "Sec-Ch-Ua": '"Chromium";v="120", "Not(A:Brand";v="24", "Google Chrome";v="120"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}

async def probe(name, url, referer=None):
    headers = dict(BROWSER_HEADERS)
    if referer:
        headers["Referer"] = referer
        headers["Sec-Fetch-Site"] = "same-origin"

    async with AsyncSession(impersonate="chrome120") as session:
        resp = await session.get(url, headers=headers, timeout=15)
        print(f"[{name}] Status: {resp.status_code} | URL: {url[:80]}")
        if resp.status_code == 200:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "html.parser")
            title = soup.find("title")
            print(f"  Title: {title.get_text() if title else 'N/A'}")
            # Count results
            for keyword in ["result", "listing", "properties", "found"]:
                el = soup.find(text=lambda t: t and keyword in t.lower())
                if el:
                    print(f"  Found '{keyword}': {str(el)[:100]}")
                    break
        else:
            print(f"  Body: {resp.text[:200]}")

async def main():
    # MagicBricks - try different URL patterns
    mb_urls = [
        "https://www.magicbricks.com/property-for-rent/commercial-spaces-in-coimbatore",
        "https://www.magicbricks.com/property-for-rent/commercial-in-coimbatore/rs-puram",
        "https://www.magicbricks.com/commercial-space-for-rent-in-rs-puram-coimbatore",
        "https://www.magicbricks.com/flats-for-rent-in-rs-puram-coimbatore/rs--flats-pg-1",
    ]
    for url in mb_urls:
        await probe("MagicBricks", url, "https://www.magicbricks.com/")
        await asyncio.sleep(1)

    # Housing.com with full impersonation  
    await probe("Housing", "https://housing.com/rent/commercial-in-rs-puram-coimbatore",
                "https://housing.com/")
    
    # PropTiger
    await probe("PropTiger", "https://www.proptiger.com/coimbatore/property-for-rent/commercial/rs-puram/",
                "https://www.proptiger.com/")

asyncio.run(main())
