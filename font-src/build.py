"""Build the compositional webfont. Requires fontTools and Brotli."""
import base64
import json
from pathlib import Path
from xml.etree import ElementTree as ET

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.svgLib.path import parse_path

HERE = Path(__file__).resolve().parent
DEST = HERE.parent / 'dist' / 'assets'
SVG = '{http://www.w3.org/2000/svg}'
ROLES = ('noun', 'verb', 'adjective', 'adverb')
COLOUR_MATERIALS = {'red': 'fire', 'blue': 'sea', 'white': 'salt', 'clear': 'glass', 'black': 'charcoal'}
BARE_ROOT_START = 0xEA00


def outline(path):
    pen = TTGlyphPen(None)
    curve = Cu2QuPen(pen, max_err=0.65)
    # 160 reference units equal one cell. The mark is the horizontal anchor. Each
    # root retains the side bearings and baseline offsets measured around it.
    if path:
        parse_path(path, TransformPen(curve, (5.5, 0, 0, -5.5, 0, 910)))
    return pen.glyph()


def purple_body(path):
    # This measured sign contains one open angular body and two lower colour dots.
    # Its material has no attested bare sign, so retain the exact body outline.
    contours = ['M' + contour for contour in path.split('M') if contour]
    if len(contours) != 3:
        raise ValueError('Check the body and two dots in the purple master.')
    def height(contour):
        bounds = BoundsPen(None)
        parse_path(contour, bounds)
        return bounds.bounds[3] - bounds.bounds[1]
    return max(contours, key=height)


def composed(glyphs, root, role):
    pen = TTGlyphPen(glyphs)
    pen.addComponent(f'root-{root}', (1, 0, 0, 1, 0, 0))
    pen.addComponent(f'mark-{role}', (1, 0, 0, 1, 0, 0))
    return pen.glyph()


def main():
    spec = json.loads((HERE / 'specimens.json').read_text())
    glyphs = {name: outline('') for name in ('.notdef', 'space')}
    for symbol in ET.parse(HERE / 'outlines.svg').findall(SVG + 'symbol'):
        name = symbol.get('id')
        path = symbol.find(SVG + 'path').get('d')
        glyphs[name] = outline(path)
        if name == 'root-purple':
            glyphs['bare-purple'] = outline(purple_body(path))

    cmap = {32: 'space'}
    observed = {key: item['code'] for key, item in spec['used'].items()}
    by_id = {}
    spellings = {}
    for key, item in spec['used'].items():
        if 'root' in item:
            by_id[key] = item['root']
            spellings[(item['root'], item['role'])] = key
        else:
            cmap[item['code']] = f'atom-{key}'

    forms = {}
    for root, base_code in spec['roots'].items():
        forms[root] = {}
        for i, role in enumerate(ROLES):
            attested_id = spellings.get((root, role))
            # Keeping a separate, stable range for productive inflections prevents
            # a historical shared puzzle from silently changing its reading.
            code = observed[attested_id] if attested_id else 0xE200 + 4 * (base_code - 0xE001) + i
            name = f'form-{root}-{role}'
            glyphs[name] = composed(glyphs, root, role)
            cmap[code] = name
            forms[root][role] = {'code': code, 'attested': attested_id is not None, 'id': attested_id}

    # Dictionary illustrations share the existing, unmarked root outlines. These
    # display-only code points are outside both sets of writable sign codes.
    bare_codes = {}
    for root in forms:
        material = COLOUR_MATERIALS.get(root, root)
        code = BARE_ROOT_START + spec['roots'][material] - 0xE001
        bare_codes[root] = code
        name = 'bare-purple' if material == 'purple' else f'root-{material}'
        if code in cmap and cmap[code] != name:
            raise ValueError(f'Conflicting display-only code point for {material}.')
        cmap[code] = name

    font = FontBuilder(1000, isTTF=True)
    font.setupGlyphOrder(list(glyphs))
    font.setupCharacterMap(cmap)
    font.setupGlyf(glyphs)
    font.setupHorizontalMetrics({key: (300 if key == 'space' else 880, getattr(g, 'xMin', 0)) for key, g in glyphs.items()})
    font.setupHorizontalHeader(ascent=900, descent=-150)
    font.setupNameTable({
        'familyName': 'Exile Glyphs', 'styleName': 'Regular',
        'uniqueFontIdentifier': 'ExileGlyphs-2.0', 'fullName': 'Exile Glyphs Regular',
        'psName': 'ExileGlyphs-Regular', 'version': 'Version 2.0',
        'description': 'Unofficial study of Exile Zone signs. Lexical glyphs combine shared root and grammatical mark outlines.',
    })
    font.setupOS2(sTypoAscender=900, sTypoDescender=-150, usWinAscent=900, usWinDescent=150)
    font.setupPost()
    font.setupMaxp()
    # The release date is in the OpenType epoch (1904). Rebuilds are byte-stable.
    font.font.recalcTimestamp = False
    font.font['head'].created = font.font['head'].modified = 3878150400
    font.font.flavor = 'woff2'
    DEST.mkdir(exist_ok=True, parents=True)
    output = DEST / 'exile-glyphs.woff2'
    font.save(output)
    encoded = base64.b64encode(output.read_bytes()).decode('ascii')
    (DEST / 'font.css').write_text(
        "@font-face {\n  font-family: 'ExileGlyphs';\n"
        f"  src: url('data:font/woff2;base64,{encoded}') format('woff2');\n"
        "  font-weight: normal;\n  font-style: normal;\n  font-display: swap;\n}\n"
    )
    compact = {'separators': (',', ':')}
    (DEST / 'glyph-map.js').write_text(
        '// Generated by font-src/build.py from the verified glyph measurements.\n'
        f'window.ExileGlyphMap = {json.dumps(observed, **compact)};\n'
        f'window.ExileComposition = {json.dumps({"byId": by_id, "forms": forms, "bareCodes": bare_codes}, **compact)};\n'
        """(() => {
  const composition = window.ExileComposition;
  const codes = new Map(Object.entries(window.ExileGlyphMap));
  for (const [root, forms] of Object.entries(composition.forms)) {
    for (const [role, form] of Object.entries(forms)) {
      codes.set(form.id || root + '--' + role, composition.bareCodes[root]);
    }
  }
  composition.rootGlyph = id => codes.has(id) ? String.fromCodePoint(codes.get(id)) : '';
})();
"""
    )


if __name__ == '__main__':
    main()
