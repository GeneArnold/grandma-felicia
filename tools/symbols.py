# Turns the chosen reel pictures from tools/swarm.py into img/symbols/<name>.png: the white
# background goes transparent (whatever is inside the outlines stays, white snow included), and the
# picture is trimmed and scaled to fit 256 x 256.
# Run from the project folder:  python3 tools/symbols.py
import pathlib

from PIL import Image, ImageDraw, ImageFilter

# The try picked for each picture: art/source/gen/<name>-<try>.png
PICKS = {
    "jingle-star": 1, "jingle-gift": 2, "jingle-snowman": 1, "jingle-bell": 2, "jingle-tree": 2,
    "jingle-stocking": 1, "ticket": 1,
    "deer-rednose": 2, "deer-gold": 2, "deer-scarf": 3, "deer-bells": 2, "deer-baby": 1, "deer-sleigh": 2,
    "shop-santa": 1, "shop-elf": 2, "shop-train": 1, "shop-bear": 2, "shop-horse": 2, "shop-soldier": 2,
    "snow-flake": 2, "snow-globe": 2, "snow-cocoa": 2, "snow-sled": 2, "snow-mittens": 2, "snow-skates": 1,
}
SIZE = 256
KEY = (255, 0, 255)

out = pathlib.Path("img/symbols")
out.mkdir(parents=True, exist_ok=True)
for name, pick in PICKS.items():
    im = Image.open(f"art/source/gen/{name}-{pick}.png").convert("RGB")
    w, h = im.size
    # flood the white background away from every edge
    for x in range(0, w, 16):
        for y in (0, h - 1):
            if im.getpixel((x, y)) != KEY and min(im.getpixel((x, y))) > 225:
                ImageDraw.floodfill(im, (x, y), KEY, thresh=30)
    for y in range(0, h, 16):
        for x in (0, w - 1):
            if im.getpixel((x, y)) != KEY and min(im.getpixel((x, y))) > 225:
                ImageDraw.floodfill(im, (x, y), KEY, thresh=30)
    mask = Image.new("L", (w, h), 255)
    px, m = im.load(), mask.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == KEY:
                m[x, y] = 0
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    clean = Image.open(f"art/source/gen/{name}-{pick}.png").convert("RGBA")
    clean.putalpha(mask)
    clean = clean.crop(mask.getbbox())
    scale = SIZE / max(clean.size)
    clean = clean.resize((round(clean.width * scale), round(clean.height * scale)), Image.LANCZOS)
    clean.save(out / f"{name}.png", optimize=True)
    print(out / f"{name}.png", clean.size)
