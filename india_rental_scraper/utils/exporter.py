"""
utils/exporter.py
Exports the flat MongoDB rental_listings collection into a hierarchical JSON structure:
{
  "CityName": {
    "PlatformName": [
      { rental_doc_1 },
      { rental_doc_2 }
    ]
  }
}
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from utils.supabase_handler import connect_supabase
from config import CITIES, PLATFORMS

def export_hierarchical_json(output_file="exported_rentals.json") -> str:
    """Queries DB and exports the hierarchical JSON file."""
    client = connect_supabase()
    
    # Base structure
    export_data = {city: {plat_key: [] for plat_key in PLATFORMS.keys()} for city in CITIES}
    
    # Map display names back to keys for categorization
    display_to_key = {cfg["display_name"]: key for key, cfg in PLATFORMS.items()}
    
    response = client.table("rental_posts").select("*").execute()
    cursor = response.data
    
    count = 0
    for doc in cursor:
        city = doc.get("city")
        plat_display = doc.get("source_platform")
        plat_key = display_to_key.get(plat_display, plat_display)
        
        # We only aggregate configured cities, but capture others just in case under their own key
        if city not in export_data:
            export_data[city] = {}
        if plat_key not in export_data[city]:
            export_data[city][plat_key] = []
            
        export_data[city][plat_key].append(doc)
        count += 1
        
    out_path = os.path.join(os.path.dirname(__file__), "..", output_file)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
        
    return f"Exported {count} listings to {out_path}"

if __name__ == "__main__":
    print(export_hierarchical_json())
