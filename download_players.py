#!/usr/bin/env python3
"""
Downloads player photos from Wikipedia (Wikimedia Commons, freely licensed).
Saves to images/players/<key>.jpg
"""
import urllib.request, urllib.parse, json, os, re, sys, time

PLAYERS = [
    ("haaland",        "Erling Haaland"),
    ("mbappe",         "Kylian Mbappé"),
    ("messi",          "Lionel Messi"),
    ("vinicius",       "Vinícius Júnior"),
    ("ronaldo",        "Cristiano Ronaldo"),
    ("bellingham",     "Jude Bellingham"),
    ("saka",           "Bukayo Saka"),
    ("yamal",          "Lamine Yamal"),
    ("salah",          "Mohamed Salah"),
    ("debruyne",       "Kevin De Bruyne"),
    ("pedri",          "Pedri (footballer)"),
    ("neymar",         "Neymar"),
    ("kane",           "Harry Kane"),
    ("foden",          "Phil Foden"),
    ("brunofernandes", "Bruno Fernandes (footballer, born 1994)"),
    ("taa",            "Trent Alexander-Arnold"),
    ("rodri",          "Rodri (footballer)"),
    ("valverde",       "Federico Valverde"),
    ("leao",           "Rafael Leão"),
    ("wirtz",          "Florian Wirtz"),
    ("rice",           "Declan Rice"),
    ("martinez",       "Lautaro Martínez"),
    ("percytau",       "Percy Tau"),
    ("zwane",          "Themba Zwane"),
    ("dolly",          "Keagan Dolly"),
    ("williams",       "Ronwen Williams"),
    ("ngezana",        "Siyabonga Ngezana"),
    ("mokoena",        "Andile Mokoena"),
    ("gavi",           "Gavi (footballer)"),
    ("fati",           "Ansu Fati"),
]

HEADERS = {
    "User-Agent": "HomeworkWordPractice/1.0 (personal educational use; python-urllib)",
    "Accept": "application/json",
}
OUT_DIR  = os.path.join(os.path.dirname(__file__), "images", "players")
os.makedirs(OUT_DIR, exist_ok=True)

def fetch(url, timeout=12):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def get_thumb_url(name):
    """Use the MediaWiki action API — less rate-limited than REST v1."""
    title    = name.replace(" ", "_")
    api_url  = (
        "https://en.wikipedia.org/w/api.php?action=query"
        f"&titles={urllib.parse.quote(title)}"
        "&prop=pageimages&format=json&pithumbsize=500&pilicense=any"
    )
    data  = json.loads(fetch(api_url).decode())
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        src = page.get("thumbnail", {}).get("source", "")
        if src:
            return re.sub(r'/\d+px-', '/500px-', src)
    return ""

ok, fail = 0, 0

for key, name in PLAYERS:
    out_path = os.path.join(OUT_DIR, f"{key}.jpg")
    if os.path.exists(out_path):
        print(f"  skip  {name}")
        ok += 1
        continue

    for attempt in range(3):
        try:
            thumb = get_thumb_url(name)
            if not thumb:
                print(f"  miss  {name} — no thumbnail")
                fail += 1
                break

            img_bytes = fetch(thumb, timeout=20)
            with open(out_path, "wb") as f:
                f.write(img_bytes)
            print(f"  ok    {name}")
            ok += 1
            break

        except Exception as e:
            if attempt < 2:
                wait = (attempt + 1) * 4
                print(f"  retry {name} in {wait}s ({e})")
                time.sleep(wait)
            else:
                print(f"  fail  {name} — {e}")
                fail += 1

    time.sleep(2)

print(f"\nDone: {ok} downloaded, {fail} failed.")
