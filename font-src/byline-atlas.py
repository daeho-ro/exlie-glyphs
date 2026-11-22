"""Bake the optional share-card credit using Pillow and fontTools[woff].

Run with the Regular face from the upstream Pretendard JP v1.3.9 release:
https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard-jp/dist/web/static/woff2/PretendardJP-Regular.woff2
The original WOFF2 SHA-256 is ca8abbe573f57f235faa68525e427646532c7aa5ab65d0c267c179e9a0ff76b8.
Licensing is recorded in dist/assets/pretendard/OFL.txt. The resulting bitmap
is checked in so normal site builds and live requests never download a font.
"""
import argparse
from io import BytesIO
from pathlib import Path
import struct
import unicodedata

from fontTools.ttLib import TTFont
from PIL import ImageFont

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("font", type=Path)
parser.add_argument("--output", type=Path, default=root / "social/assets/author-glyphs.bin")
args = parser.parse_args()
# Pillow's FreeType build may have no WOFF2 support. FontTools decodes the
# container once, and both the cmap and rasterizer use that same source.
sfnt = BytesIO()
with TTFont(args.font) as face:
    cmap = face.getBestCmap()
    face.flavor = None
    face.save(sfnt)
sfnt.seek(0)
font = ImageFont.truetype(sfnt, size=24)
index, pixels = bytearray(), bytearray()
fallback = 0x25a1
codepoints = sorted(cp for cp in cmap if not unicodedata.category(chr(cp)).startswith("C"))
if fallback not in cmap:
    raise ValueError("Font must contain the missing-glyph square")

for cp in codepoints:
    char = chr(cp)
    mask, (left, top) = font.getmask2(char, mode="L", anchor="ls")
    width, height = mask.size
    advance = round(font.getlength(char))
    index.extend(struct.pack(">II", cp, len(pixels)))
    pixels.extend(struct.pack(">bbBBB", left, top, width, height, advance))
    # Four antialiased pixels per byte. Left and top are relative to the baseline.
    values = bytes(mask)
    for start in range(0, len(values), 4):
        packed = 0
        for shift, opacity in enumerate(values[start:start + 4]):
            packed |= ((opacity + 42) // 85) << (6 - shift * 2)
        pixels.append(packed)

args.output.write_bytes(struct.pack(">I", len(codepoints)) + index + pixels)
print(f"{len(codepoints)} code points, {args.output.stat().st_size:,} bytes")
