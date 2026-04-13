#!/usr/bin/env python3
"""
Downloads cute cat photos from cataas.com (Cat as a Service).
Uses the 'cute' tag and resizes to 500px width.
Saves to images/cats/<id>.jpg
"""
import urllib.request, json, os, time

API_URL  = "https://cataas.com/api/cats?tags=cute&limit=25&skip=0"
HEADERS  = {"User-Agent": "HomeworkWordPractice/1.0 (personal educational use)"}
OUT_DIR  = os.path.join(os.path.dirname(__file__), "images", "cats")
os.makedirs(OUT_DIR, exist_ok=True)

def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

# 1. Get list of cute cats
print("Fetching cat list...")
data = json.loads(fetch(API_URL).decode())
print(f"Found {len(data)} cute cats.\n")

ok, fail = 0, 0

for cat in data:
    cat_id = cat["id"]
    ext = ".jpg" if "jpeg" in cat.get("mimetype", "") else ".png" if "png" in cat.get("mimetype", "") else ".jpg"
    out_path = os.path.join(OUT_DIR, f"{cat_id}{ext}")

    if os.path.exists(out_path):
        print(f"  skip  {cat_id}")
        ok += 1
        continue

    img_url = f"https://cataas.com/cat/{cat_id}?width=500"

    for attempt in range(3):
        try:
            img_bytes = fetch(img_url, timeout=30)
            with open(out_path, "wb") as f:
                f.write(img_bytes)
            print(f"  ok    {cat_id} ({len(img_bytes)} bytes)")
            ok += 1
            break
        except Exception as e:
            if attempt < 2:
                wait = (attempt + 1) * 3
                print(f"  retry {cat_id} in {wait}s ({e})")
                time.sleep(wait)
            else:
                print(f"  fail  {cat_id} — {e}")
                fail += 1

    time.sleep(1)

# 2. Write a manifest so the app knows which IDs to use
manifest_path = os.path.join(OUT_DIR, "manifest.json")
ids = [cat["id"] for cat in data]
with open(manifest_path, "w") as f:
    json.dump(ids, f, indent=2)
print(f"\nManifest written with {len(ids)} IDs.")
print(f"Done: {ok} downloaded, {fail} failed.")
