"""
Quick probe to find the correct HTML card classes for 99acres and QuikrHomes.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.session import session_manager
from bs4 import BeautifulSoup

async def probe_99acres():
    session = session_manager.get_session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Referer": "https://www.99acres.com/",
    }
    url = "https://www.99acres.com/commercial-shop-for-rent-in-rs-puram-coimbatore-ffid"
    resp = await session.get(url, headers=headers)
    print(f"[99acres] Status: {resp.status_code}")
    soup = BeautifulSoup(resp.text, "html.parser")
    
    print("\nAll divs with 'srp' in class:")
    for tag in soup.find_all(["div", "article", "li", "section"], class_=True):
        cls = " ".join(tag.get("class", []))
        if "srp" in cls.lower() or "property" in cls.lower() or "listing" in cls.lower():
            text = tag.get_text(strip=True)[:80]
            print(f"  <{tag.name} class='{cls}'> text='{text}'")
    
    print("\nAll links with 'property' or 'listing' in href:")
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if "property" in href or "listing" in href or "commercial" in href:
            cls = " ".join(a.get("class", []))
            print(f"  <a class='{cls}' href='{href[:80]}'>")

async def probe_quikr():
    session = session_manager.get_session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
    }
    url = "https://www.quikr.com/homes/property/commercial-property-for-rent-in-rs-puram-coimbatore"
    resp = await session.get(url, headers=headers)
    print(f"\n[QuikrHomes] Status: {resp.status_code}")
    soup = BeautifulSoup(resp.text, "html.parser")
    
    print("All divs with listing/card/result/property in class:")
    for tag in soup.find_all(["div", "article", "li", "section"], class_=True)[:30]:
        cls = " ".join(tag.get("class", []))
        if any(k in cls.lower() for k in ["listing", "card", "result", "property", "item"]):
            text = tag.get_text(strip=True)[:80]
            print(f"  <{tag.name} class='{cls}'> text='{text}'")
    
    print("\nAll links with homes/property in href:")
    for a in soup.find_all("a", href=True)[:20]:
        href = a.get("href", "")
        if "homes" in href or "property" in href or "rent" in href:
            cls = " ".join(a.get("class", []))
            print(f"  <a class='{cls}' href='{href[:80]}'>")

async def probe_magicbricks():
    """Find the correct MB URL pattern"""
    session = session_manager.get_session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html",
        "Referer": "https://www.magicbricks.com/",
    }
    # Try different URL patterns
    urls = [
        "https://www.magicbricks.com/property-for-rent/commercial-in-coimbatore/rs-puram",
        "https://www.magicbricks.com/flats-for-rent-in-coimbatore/rs-puram--location",
        "https://www.magicbricks.com/commercial-space-for-rent-in-coimbatore?pType=Office-Space,Shop&city=Coimbatore",
    ]
    for url in urls:
        resp = await session.get(url, headers=headers)
        print(f"\n[MagicBricks] {resp.status_code} — {url[:80]}")

async def probe_nobroker():
    """Find correct NoBroker API endpoint"""
    session = session_manager.get_session()
    endpoints = [
        ("GET", "https://www.nobroker.in/api/v1/user/guest-token", {}),
        ("GET", "https://www.nobroker.in/api/v1/public/search?city=coimbatore&locality=RS+Puram&listingType=rent&propertyType=commercial&limit=5", {}),
        ("GET", "https://www.nobroker.in/property/rent/coimbatore/rs-puram/shop/", {"Accept": "text/html"}),
    ]
    for method, url, extra_headers in endpoints:
        h = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
        h.update(extra_headers)
        if method == "GET":
            resp = await session.get(url, headers=h)
        else:
            resp = await session.post(url, headers=h)
        print(f"\n[NoBroker] {method} {resp.status_code} — {url[:80]}")
        print(f"  Body: {resp.text[:200]}")

if __name__ == "__main__":
    async def main():
        await probe_magicbricks()
        await probe_nobroker()
        await probe_99acres()
        await probe_quikr()
    asyncio.run(main())
