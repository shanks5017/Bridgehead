import urllib.request, re, json

req = urllib.request.Request('https://www.magicbricks.com/property-for-rent/commercial-real-estate?proptype=Commercial-Office-Space,Commercial-Shop&cityName=bhopal', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
html = urllib.request.urlopen(req).read().decode('utf-8')
match = re.search(r'window\.SERVER_PRELOADED_STATE_\s*=\s*(\{.*?\});', html, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    props = []
    def find_props(obj):
        if isinstance(obj, dict):
            if 'propId' in obj or 'encId' in obj:
                props.append(obj)
                return
            for k, v in obj.items(): find_props(v)
        elif isinstance(obj, list):
            for v in obj: find_props(v)
    find_props(data)
    
    missing_count = 0
    for p in props:
        images = p.get('allImgPath') or []
        if not images:
            missing_count += 1
            print(f"Missing images for ID {p.get('encId')} - Keys with img/pic/med/pho:")
            for k, v in p.items():
                if 'img' in k.lower() or 'pic' in k.lower() or 'photo' in k.lower() or 'med' in k.lower():
                    print(f"  {k}: {str(v)[:100]}")
    print(f"Total missing: {missing_count} out of {len(props)}")
