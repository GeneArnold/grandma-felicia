# Turns a picture into a cartoon with Flux image-to-image on cerebro's SwarmUI. The results land in
# art/source/gen/ (kept out of git), for picking on a contact sheet.
#   python3 tools/cartoon.py <name> <picture.png> "<prompt>" [--creativity 0.82 0.9] [--seeds 1 2]
# Lower creativity keeps closer to the picture; higher looks more like a cartoon.
import argparse
import base64
import json
import pathlib
import urllib.parse
import urllib.request

HOST = "http://192.168.40.110:7801"
NEGATIVE = "photo, realistic, photograph, wrinkles, blurry, text, watermark, frame"


def post(path, body):
    req = urllib.request.Request(HOST + path, json.dumps(body).encode(), {"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.load(r)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("picture")
    ap.add_argument("prompt")
    ap.add_argument("--negative", default="")
    ap.add_argument("--creativity", type=float, nargs="+", default=[0.82, 0.9])
    ap.add_argument("--seeds", type=int, nargs="+", default=[1, 2])
    a = ap.parse_args()
    init = "data:image/png;base64," + base64.b64encode(pathlib.Path(a.picture).read_bytes()).decode()
    out = pathlib.Path("art/source/gen")
    out.mkdir(parents=True, exist_ok=True)
    session = post("/API/GetNewSession", {})["session_id"]
    for creativity in a.creativity:
        for seed in a.seeds:
            res = post("/API/GenerateText2Image", {
                "session_id": session, "images": 1, "model": "flux1-dev-fp8.safetensors", "steps": 24, "cfgscale": 1,
                "width": 1024, "height": 1024, "seed": seed, "prompt": a.prompt,
                "negativeprompt": ", ".join(filter(None, [NEGATIVE, a.negative])),
                "initimage": init, "initimagecreativity": creativity,
            })
            if "images" not in res:
                raise SystemExit(f"cerebro said: {res}")
            dest = out / f"{a.name}-{creativity}-{seed}.png"
            urllib.request.urlretrieve(f"{HOST}/{urllib.parse.quote(res['images'][0])}", dest)
            print(dest, flush=True)


if __name__ == "__main__":
    main()
