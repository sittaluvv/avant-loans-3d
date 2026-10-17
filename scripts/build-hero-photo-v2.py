"""Hero still v2: our own generated photo (Dubai rooftop, advisor + client with a tablet, Burj Khalifa left).
Upscale: Real-ESRGAN x4plus (realesrgan-ncnn-vulkan, runs on CPU via Mesa lavapipe) 1280->5120, then Lanczos
down to 2560/1920 (supersampled = natural faces, no halos). ESRGAN smears the defocused skyline into vertical
streaks, so it is used ONLY on the two people (feathered mask); the bokeh background is plain Lanczos (soft, natural). If the ESRGAN binary/output is missing, falls back to
Lanczos + light unsharp mask from the 1280 source. Light artifact cleanup: mild median-free denoise via
a 0.4px Gaussian blend on the sky only (smooths ESRGAN banding/JPEG blocks in flat areas, faces untouched).
Outputs (public/hero/, v1 handshake files are kept): hero-photo-v2-{960,1280,1920,2560}.{avif,webp}
and phone 5:6 crop on the two people hero-photo-v2-phone-{520,780,1170}.{avif,webp}.
Usage: python scripts/build-hero-photo-v2.py [src.jpg] [esrgan_x4.png]"""
import os, shutil, subprocess, sys
from PIL import Image, ImageFilter, ImageChops
SRC = sys.argv[1] if len(sys.argv) > 1 else "/workspace/hero-photo/hero-gulf-advisor.jpg"
X4 = sys.argv[2] if len(sys.argv) > 2 else "/workspace/hero-photo/work/advisor_x4.png"
ESRGAN = os.environ.get("ESRGAN_BIN", "/tmp/resr/realesrgan-ncnn-vulkan")
OUT = "public/hero"; V = "v2"
os.makedirs(OUT, exist_ok=True)
src = Image.open(SRC).convert("RGB"); assert src.size == (1280, 720), src.size

if not os.path.exists(X4) and os.path.exists(ESRGAN):
    os.makedirs(os.path.dirname(X4), exist_ok=True)
    env = {**os.environ, "VK_ICD_FILENAMES": "/usr/share/vulkan/icd.d/lvp_icd.json"}
    subprocess.run([ESRGAN, "-i", SRC, "-o", X4, "-n", "realesrgan-x4plus", "-s", "4", "-t", "256"], check=True, env=env)
if os.path.exists(X4):
    esr = Image.open(X4).convert("RGB"); assert esr.size == (5120, 2880), esr.size
    lz = src.resize(esr.size, Image.LANCZOS)
    # people region in source coords: advisor's blazer starts x~595, client's headscarf ends x~1222, heads from y~55
    m = Image.new("L", (1280, 720), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(m).rectangle((600, 40, 1215, 720), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(14)).resize(esr.size, Image.LANCZOS)
    big = Image.composite(esr, lz, m); method = "Real-ESRGAN x4plus (people) + Lanczos (background)"
else:
    big = None; method = "Lanczos + unsharp"
print("upscaler:", method)

def sky_soften(img):
    """Blend a tiny blur only where the image is flat and bright (sky haze) to hide banding/blocking."""
    soft = img.filter(ImageFilter.GaussianBlur(0.6 * img.size[0] / 1920))
    edges = img.convert("L").filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(5))
    lum = img.convert("L")
    mask = ImageChops.multiply(lum.point(lambda v: 255 if v > 175 else 0), edges.point(lambda v: 255 if v < 6 else 0))
    return Image.composite(soft, img, mask.filter(ImageFilter.GaussianBlur(2)))

def render(box, size):
    """box in 1280x720 source coords -> size."""
    if big is not None:
        out = big.crop(tuple(v * 4 for v in box)).resize(size, Image.LANCZOS)
    else:
        out = src.crop(box).resize(size, Image.LANCZOS)
        if size[0] / (box[2] - box[0]) > 1.05:
            out = out.filter(ImageFilter.UnsharpMask(radius=1.1, percent=55, threshold=2))
    return sky_soften(out)

def save(img, name):
    img.save(f"{OUT}/{name}.avif", "AVIF", quality=56, speed=4)
    img.save(f"{OUT}/{name}.webp", "WEBP", quality=78, method=6)
    for ext in ("avif", "webp"):
        print(f"{name}.{ext}", img.size, os.path.getsize(f"{OUT}/{name}.{ext}") // 1024, "KB")

for w in (2560, 1920, 1280, 960):
    save(render((0, 0, 1280, 720), (w, w * 9 // 16)), f"hero-photo-{V}-{w}")
# phone 5:6 crop centred between the two faces (advisor ~x790, client ~x980), both people head to waist
PHONE_BOX = (585, 0, 1185, 720)
for w in (1170, 780, 520):
    save(render(PHONE_BOX, (w, round(w * 6 / 5))), f"hero-photo-{V}-phone-{w}")
# keep a master next to the source for future edits
master = "/workspace/hero-photo/work/hero-gulf-advisor-2560-master.png"
render((0, 0, 1280, 720), (2560, 1440)).save(master); print("master", master)
