import sys
from utils.supabase_handler import connect_supabase

client = connect_supabase()
res = client.table('rental_posts').select('source_platform, images').execute()
platforms = {}

for r in res.data:
    p = r['source_platform']
    if p not in platforms: 
        platforms[p] = {'total': 0, 'missing': 0}
    platforms[p]['total'] += 1
    if not r['images'] or len(r['images']) == 0:
        platforms[p]['missing'] += 1

print('Images Stats:')
for p, stats in platforms.items():
    missing = stats["missing"]
    total = stats["total"]
    perc = (missing/total*100) if total else 0
    print(f"{p}: {missing}/{total} missing images ({perc:.1f}%)")
