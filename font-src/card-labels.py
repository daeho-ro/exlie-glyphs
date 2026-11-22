"""Regenerate the small counter outlines after updating the bundled Pretendard CSS."""
import base64
import hashlib
import io
import json
import re
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

project = Path(__file__).resolve().parent.parent
css = (project / "dist/assets/pretendard/pretendard.css").read_bytes()
data = re.search(rb'data:font/woff2;base64,([^"]+)', css)[1]
font = TTFont(io.BytesIO(base64.b64decode(data)))
cmap = font.getBestCmap()
glyphs = font.getGlyphSet()
scale = 29 / font["head"].unitsPerEm
labels = {}
for text in ["문자", "개", "glyph", "glyphs", "×", *"0123456789"]:
    pen = SVGPathPen(glyphs, ntos=lambda n: f"{n:.2f}".rstrip("0").rstrip("."))
    x = 2
    for char in text:
        glyph = glyphs[cmap[ord(char)]]
        glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x, 34)))
        x += glyph.width * scale
    labels[text] = pen.getCommands()

out = project / "social/assets/count-labels.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"source": hashlib.sha256(css).hexdigest(), "paths": labels},
                          ensure_ascii=False, separators=(",", ":")) + "\n")
