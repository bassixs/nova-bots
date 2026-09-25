"""Regenerate the NOVA social preview and compact app icons (requires Pillow)."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
BG = (8, 9, 13)


def icon(size):
    scale = max(4, 512 // size)
    side = size * scale
    image = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    unit = side / 100
    box = (2 * unit, 2 * unit, 98 * unit, 98 * unit)
    draw.rounded_rectangle(box, radius=21 * unit, fill=(*BG, 255), outline=(85, 111, 198, 150), width=max(1, round(unit)))
    polygon = [(19, 77), (19, 24), (33, 24), (77, 67), (60, 67), (33, 42), (33, 77)]
    draw.polygon([(round(x * unit), round(y * unit)) for x, y in polygon], fill=(247, 249, 255, 255))
    star = [(76, 17), (78, 24), (85, 26), (78, 28), (76, 35), (74, 28), (67, 26), (74, 24)]
    draw.polygon([(round(x * unit), round(y * unit)) for x, y in star], fill=(247, 249, 255, 255))
    return image.resize((size, size), Image.Resampling.LANCZOS)


def make_icons():
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect x="2" y="2" width="96" height="96" rx="21" fill="#08090d" stroke="#556fc6" stroke-opacity=".6"/>
<path fill="#f7f9ff" d="M19 77V24h14l44 43H60L33 42v35H19Z"/>
<path fill="#f7f9ff" d="M76 17 78 24 85 26 78 28 76 35 74 28 67 26 74 24Z"/>
</svg>'''
    (ASSETS / "favicon.svg").write_text(svg, encoding="utf-8")
    icon(32).save(ASSETS / "favicon-32.png", optimize=True)
    icon(180).save(ROOT / "public" / "apple-touch-icon.png", optimize=True)
    icon(192).save(ASSETS / "icon-192.png", optimize=True)
    icon(512).save(ASSETS / "icon-512.png", optimize=True)
    icon(64).save(ROOT / "public" / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])


def make_og():
    width, height = 1200, 630
    image = Image.new("RGBA", (width, height), (*BG, 255))

    logo = Image.open(ASSETS / "nova-logo.png").convert("RGBA").crop((64, 64, 1190, 1190))
    logo = logo.resize((455, 455), Image.Resampling.LANCZOS)
    image.alpha_composite(logo, (710, 88))

    draw = ImageDraw.Draw(image)
    font_dir = Path("C:/Windows/Fonts")
    regular = font_dir / "segoeui.ttf"
    bold = font_dir / "seguisb.ttf"
    draw.ellipse((73, 115, 81, 123), fill=(151, 178, 255))
    draw.text((96, 105), "NOVA lab", font=ImageFont.truetype(bold, 27), fill=(215, 226, 255))
    draw.text((74, 187), "Чат-боты", font=ImageFont.truetype(bold, 78), fill=(246, 249, 255))
    draw.text((74, 282), "в MAX", font=ImageFont.truetype(bold, 78), fill=(197, 212, 255))
    draw.line((77, 406, 607, 406), fill=(91, 111, 161), width=1)
    draw.text((75, 432), "Разработка для бизнеса", font=ImageFont.truetype(regular, 29), fill=(190, 201, 223))
    draw.text((75, 471), "и организаций", font=ImageFont.truetype(regular, 29), fill=(190, 201, 223))
    image.convert("RGB").save(ASSETS / "nova-og.png", optimize=True)


def make_optimized_site_media():
    logo = Image.open(ASSETS / "nova-logo.png").convert("RGB")
    logo.resize((256, 256), Image.Resampling.LANCZOS).save(
        ASSETS / "nova-logo-display.webp", "WEBP", quality=92, method=6
    )
    tables = Image.open(ASSETS / "outdoor-tables-triptych.png").convert("RGB")
    tables.thumbnail((1500, 700), Image.Resampling.LANCZOS)
    tables.save(ASSETS / "outdoor-tables-triptych.webp", "WEBP", quality=90, method=6)


if __name__ == "__main__":
    make_icons()
    make_og()
    make_optimized_site_media()
