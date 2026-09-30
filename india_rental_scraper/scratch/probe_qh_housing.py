"""
Quick probe to find QuikrHomes card selectors.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from core.session import session_manager
from bs4 import BeautifulSoup

async def main():
    session = session_manager.get_session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }
    
    # QuikrHomes
    url = "https://www.quikr.com/homes/property/commercial-property-for-rent-in-rs-puram-coimbatore"
    resp = await session.get(url, headers=headers)
    print(f"[QuikrHomes] Status: {resp.status_code}")
    soup = BeautifulSoup(resp.text, "html.parser")
    
    # Print ALL div/article/li/ul with classes
    seen_classes = set()
    for tag in soup.find_all(["div", "article", "li", "ul", "section"], class_=True):
        cls = " ".join(tag.get("class", []))
        if cls in seen_classes:
            continue
        seen_classes.add(cls)
        text = tag.get_text(strip=True)[:50]
        print(f"  <{tag.name} class='{cls}'> text='{text[:50]}'")
    
    print("\n\nAll <a href> containing property or homes:")
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if "homes" in href or "property" in href or "rent" in href or "commercial" in href:
            cls = " ".join(a.get("class", []))
            print(f"  <a class='{cls}' href='{href[:100]}'>")

    # Housing.com - try with proper headers
    url2 = "https://housing.com/rent/commercial-in-rs-puram-coimbatore"
    headers2 = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-IN,en;q=0.9",
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
    resp2 = await session.get(url2, headers=headers2)
    print(f"\n\n[Housing.com] Status: {resp2.status_code}")
    if resp2.status_code == 200:
        soup2 = BeautifulSoup(resp2.text, "html.parser")
        for tag in soup2.find_all(["div", "article"], class_=True)[:30]:
            cls = " ".join(tag.get("class", []))
            text = tag.get_text(strip=True)[:50]
            if any(k in cls.lower() for k in ["listing", "card", "result", "property", "srp"]):
                print(f"  <{tag.name} class='{cls}'> text='{text}'")
    else:
        print(f"  Body: {resp2.text[:300]}")

asyncio.run(main())
