// The sorted code point index points directly into fixed-size-type bitmap records.
// All offsets are relative to the glyph data following the index.
export function createBylinePainter(art: ArrayBuffer) {
  const bytes = new Uint8Array(art);
  const view = new DataView(art);
  const count = view.getUint32(0);
  const dataStart = 4 + count * 8;
  const fallback = 0x25a1;
  const shades = [0, 4, 8, 12];

  function findGlyph(code: number) {
    let left = 0;
    let right = count - 1;
    while (left <= right) {
      const middle = Math.floor((left + right) / 2);
      const index = 4 + middle * 8;
      const candidate = view.getUint32(index);
      if (candidate === code) return dataStart + view.getUint32(index + 4);
      if (candidate < code) left = middle + 1;
      else right = middle - 1;
    }
    return null;
  }
  const missingGlyph = findGlyph(fallback);
  if (missingGlyph === null) throw new Error('Byline font is missing its fallback glyph.');
  const missing: number = missingGlyph;

  return function paintByline(pixels: Uint8Array, rowBytes: number, name: string) {
    const author = Array.from(name.trim().normalize('NFC')).slice(0, 32).join('');
    if (!author) return;
    let pen = 0;
    let left = 0;
    let right = 0;
    const glyphs = Array.from('by ' + author, char => {
      const offset = findGlyph(char.codePointAt(0) ?? fallback) ?? missing;
      const x = pen + view.getInt8(offset);
      pen += bytes[offset + 4];
      left = Math.min(left, x);
      right = Math.max(right, x + bytes[offset + 2], pen);
      return {offset, x};
    });
    // Include the ink overhanging a character's advance when fitting the footer.
    const scale = Math.min(1, (1106 - 90) / (right - left));
    const origin = 1106 - right * scale;
    const baseline = 566;
    for (const {offset, x} of glyphs) {
      const top = view.getInt8(offset + 1);
      const width = bytes[offset + 2];
      const height = bytes[offset + 3];
      const start = offset + 5;
      for (let j = 0; j < height; j++) {
        const row = (baseline + Math.floor((top + j) * scale)) * rowBytes + 1;
        for (let i = 0; i < width; i++) {
          const at = j * width + i;
          const level = (bytes[start + (at >> 2)] >> (6 - (at & 3) * 2)) & 3;
          if (level) {
            const dest = row + Math.floor(origin + (x + i) * scale);
            const ink = shades[level];
            // Several source pixels can hit one destination in a scaled credit.
            pixels[dest] = scale === 1 ? ink : Math.max(ink, pixels[dest]);
          }
        }
      }
    }
  };
}
