// All dimensions are in pixels of the 1200 × 630 social preview.
export const WIDTH = 1200;
export const HEIGHT = 630;
export const MAX_CELLS = 24;
export const SIZES = [216, 160, 128, 104];

export function placement(count: number) {
  const rows = count <= 6 ? 1 : count <= 16 ? 2 : 3;
  const columns = Math.ceil(count / rows);
  const size = count <= 4 ? 216 : count <= 12 ? 160 : count <= 16 ? 128 : 104;
  const pitchX = Math.min(245, Math.floor(1016 / columns));
  const pitchY = rows === 1 ? 0 : rows === 2 ? 177 : 125;
  return Array.from({length:count}, (_, i) => {
    const row = Math.floor(i / columns), length = Math.min(columns, count - row * columns);
    const x = (WIDTH + (2 * (i % columns) + 1 - length) * pitchX - size) / 2;
    const y = 365 + (row - (rows - 1) / 2) * pitchY - size / 2;
    return {x:Math.round(x), y:Math.round(y), size};
  });
}
