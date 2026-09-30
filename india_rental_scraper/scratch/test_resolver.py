import asyncio
import sys
import os

# Add parent dir to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from resolvers.locality_resolver import locality_resolver
from core.session import session_manager

async def test_resolution():
    city = "Coimbatore"
    locality = "RS Puram"
    
    print(f"Testing resolution for {locality}, {city}...")
    
    # Test OLX individually with more debug
    session = session_manager.get_session()
    term = f"{locality} {city}".strip()
    url = f"https://www.olx.in/api/locations/v2/autocomplete?term={term}&lang=en-IN&limit=5"
    print(f"OLX URL: {url}")
    try:
        resp = await session.get(url, headers={"User-Agent": "Mozilla/5.0"})
        print(f"OLX Status: {resp.status_code}")
        print(f"OLX Response (first 100): {resp.text[:100]}")
    except Exception as e:
        print(f"OLX Error: {e}")

    # Test NoBroker individually
    url = f"https://www.nobroker.in/api/v1/public/locality/autocomplete?city={city.lower()}&term={locality}"
    print(f"NoBroker URL: {url}")
    try:
        resp = await session.get(url)
        print(f"NoBroker Status: {resp.status_code}")
        print(f"NoBroker Response (first 100): {resp.text[:100]}")
    except Exception as e:
        print(f"NoBroker Error: {e}")

    # Run the full resolve_all
    results = await locality_resolver.resolve_all(city, locality)
    print(f"\nFull Results: {results}")

if __name__ == "__main__":
    asyncio.run(test_resolution())
