# Rewrites the FILES list in sw.js from what is on disk, so every file the game needs works offline.
# Run from the project folder after adding or removing a file:  python3 tools/sw-files.py
import pathlib
import re

root = pathlib.Path(".")
files = ["./", "index.html", "style.css", "manifest.webmanifest", "vendor/phaser.min.js"]
for folder, pattern in [("js", "**/*.js"), ("icons", "*.png"), ("img", "**/*.png"), ("voices", "*.mp3")]:
    files += sorted(str(p) for p in root.joinpath(folder).glob(pattern))
listing = "const FILES = [\n" + "".join(f'  "{f}",\n' for f in files) + "];"
sw = root.joinpath("sw.js").read_text()
sw = re.sub(r"const FILES = \[.*?\];", lambda _: listing, sw, count=1, flags=re.S)
root.joinpath("sw.js").write_text(sw)
print(f"sw.js lists {len(files)} files")
