"""
Quick test: fetch and print HTML snippet from each platform to find correct selectors.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.session import session_manager
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
}

async def check_site(name: str, url: str):
    session = session_manager.get_session()
    try:
        resp = await session.get(url, headers=HEADERS, timeout=15)
        print(f"\n{'='*60}")
        print(f"[{name}] Status: {resp.status_code} | URL: {url}")
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            # Print first 3 link elements with class attributes to understand card structure
            links = [a for a in soup.find_all("a", href=True) if a.get("class")][:5]
            for a in links:
                print(f"  <a class='{' '.join(a.get('class', []))}' href='{a['href'][:60]}'>")
            # Print all class attributes from first 300 chars
            body_html = str(soup.body)[:2000] if soup.body else resp.text[:2000]
            # Find card-like divs
            for tag in soup.find_all(["div", "article", "li"], class_=True)[:10]:
                cls = " ".join(tag.get("class", []))
                text = tag.get_text(strip=True)[:60]
                if any(kw in cls.lower() for kw in ["listing", "card", "property", "result", "item", "srp"]):
                    print(f"  CARD: <{tag.name} class='{cls}'> text='{text}'")
        else:
            print(f"  Response: {resp.text[:200]}")
    except Exception as e:
        print(f"[{name}] ERROR: {e}")

async def main():
    # Check NoBroker API
    session = session_manager.get_session()
    nb_resp = await session.post(
        "https://www.nobroker.in/api/v1/public/user/guestToken",
        headers={"User-Agent": "Mozilla/5.0"}
    )
    print(f"\n[NoBroker GuestToken] Status: {nb_resp.status_code} | Body: {nb_resp.text[:200]}")
    
    token = None
    try:
        data = nb_resp.json()
        token = data.get("token") or data.get("data", {}).get("token")
        print(f"  Token: {str(token)[:20] if token else 'NONE'}")
    except:
        pass
    
    # Try NoBroker search
    nb_headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    if token:
        nb_headers["Authorization"] = f"Bearer {token}"
    
    nb_search = await session.get(
        "https://www.nobroker.in/api/v1/public/search",
        params={"city": "coimbatore", "locality": "RS Puram", "listingType": "rent", "propertyType": "commercial", "limit": "5"},
        headers=nb_headers
    )
    print(f"\n[NoBroker Search] Status: {nb_search.status_code} | Body: {nb_search.text[:300]}")

    await check_site("99acres", "https://www.99acres.com/commercial-shop-for-rent-in-rs-puram-coimbatore-ffid")
    await check_site("MagicBricks", "https://www.magicbricks.com/commercial-space-for-rent-in-rs-puram-coimbatore/rs--commercial-space,for-rent,commercial-offices,shops")
    await check_site("Housing", "https://housing.com/rent/commercial-in-rs-puram-coimbatore")
    await check_site("PropTiger", "https://www.proptiger.com/coimbatore/property-for-rent/commercial/rs-puram/")
    await check_site("QuikrHomes", "https://www.quikr.com/homes/property/commercial-property-for-rent-in-rs-puram-coimbatore")

if __name__ == "__main__":
    asyncio.run(main())
