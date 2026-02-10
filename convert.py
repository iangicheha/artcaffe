import os
from pathlib import Path
from typing import Optional
from io import BytesIO

from PIL import Image

# Optional: AVIF support (pip install pillow-avif-plugin)
try:
    import pillow_avif  # noqa: F401
except ImportError:
    pillow_avif = None

# Optional: SVG support (pip install cairosvg)
try:
    import cairosvg
except ImportError:
    cairosvg = None


# ==========================
# CONFIGURATION
# ==========================

# Your correct directory:
# cloud-api/public/icon

ICONS_DIR = Path(
    r"C:\Users\ADMIN\OneDrive\Desktop\Artcafe\cloud-api\public\icon"
)

JPEG_QUALITY = 95
BACKGROUND_COLOR = (255, 255, 255)  # white


# ==========================
# HELPERS
# ==========================
def convert_svg_to_png_bytes(svg_path: Path) -> Optional[bytes]:
    """Convert SVG to PNG bytes using cairosvg."""
    if cairosvg is None:
        print(f"Skipping SVG (cairosvg not installed): {svg_path}")
        return None

    try:
        with open(svg_path, "rb") as f:
            svg_data = f.read()
        return cairosvg.svg2png(bytestring=svg_data)
    except Exception as e:
        print(f"Failed to rasterize SVG {svg_path}: {e}")
        return None


def to_rgb_with_background(img: Image.Image) -> Image.Image:
    """Convert image to RGB, preserving transparency with a white background."""
    if img.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", img.size, BACKGROUND_COLOR)
        bg.paste(img, mask=img.split()[-1])
        return bg
    return img.convert("RGB")


# ==========================
# CORE LOGIC
# ==========================
def convert_image_to_jpg(src_path: Path):
    """Convert a single image to JPG and delete original on success."""
    if src_path.suffix.lower() == ".jpg":
        return

    try:
        # Handle SVG separately
        if src_path.suffix.lower() == ".svg":
            png_bytes = convert_svg_to_png_bytes(src_path)
            if png_bytes is None:
                return
            with Image.open(BytesIO(png_bytes)) as img:
                rgb_img = to_rgb_with_background(img)

        else:
            with Image.open(src_path) as img:
                rgb_img = to_rgb_with_background(img)

        # Save JPG version
        dst_path = src_path.with_suffix(".jpg")
        rgb_img.save(dst_path, "JPEG", quality=JPEG_QUALITY)

        print(f"Converted: {src_path} -> {dst_path}")

        # Delete original file after success
        src_path.unlink()
        print(f"Deleted original: {src_path}")

    except Exception as e:
        print(f"Failed to convert {src_path}: {e}")


def convert_all_images():
    """Walk through icon directory and convert all images to JPG."""
    if not ICONS_DIR.exists():
        print(f"Directory not found: {ICONS_DIR}")
        return

    for root, _, files in os.walk(ICONS_DIR):
        for name in files:
            src = Path(root) / name

            # Convert everything except JPG
            if src.is_file() and src.suffix.lower() != ".jpg":
                convert_image_to_jpg(src)


# ==========================
# ENTRY POINT
# ==========================
if __name__ == "__main__":
    convert_all_images()
    print("DONE: All possible images converted to JPG.")
