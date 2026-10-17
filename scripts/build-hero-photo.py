"""Hero still from our own handshake clip: frame 25 (t≈1.0s, before any face drift), sharpest keyframe with
clean faces/hands. Light Lanczos upscale + unsharp mask, responsive AVIF/WebP + phone crop on the handshake.
Usage: python scripts/build-hero-photo.py [/workspace/hero-video/hero-handshake-v2.mp4]   -> public/hero/"""
import subprocess, sys, os
from PIL import Image, ImageFilter
SRC = sys.argv[1] if len(sys.argv) > 1 else "/workspace/hero-video/hero-handshake-v2.mp4"
OUT = "public/hero"; V = "v1"; FRAME = 24  # 0-based index
os.makedirs(OUT, exist_ok=True)
raw = "/tmp/hero_photo_raw.png"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-map", "0:v:0", "-vf", f"select=eq(n\\,{FRAME})", "-vsync", "0", "-frames:v", "1", raw], check=True)
im = Image.open(raw).convert("RGB")  # 1280x720
assert im.size == (1280, 720), im.size

def finish(img, size):
    out = img.resize(size, Image.LANCZOS)
    scale = size[0] / img.size[0]
    if scale > 1.05:  # only sharpen upscaled versions, lightly
        out = out.filter(ImageFilter.UnsharpMask(radius=1.1, percent=55, threshold=2))
    return out

def save(img, name):
    img.save(f"{OUT}/{name}.avif", "AVIF", quality=58, speed=4)
    img.save(f"{OUT}/{name}.webp", "WEBP", quality=80, method=6)
    for ext in ("avif", "webp"):
        print(f"{name}.{ext}", img.size, os.path.getsize(f"{OUT}/{name}.{ext}") // 1024, "KB")

for w in (1920, 1280, 960):
    save(finish(im, (w, round(w * 9 / 16))), f"hero-photo-{V}-{w}")
# phone: 5:6 crop around the handshake with both men in frame (shown in the top ~460px of the phone hero)
crop = im.crop((650, 0, 1250, 720))  # 600x720
for w in (780, 520):
    save(finish(crop, (w, round(w * 720 / 600))), f"hero-photo-{V}-phone-{w}")
