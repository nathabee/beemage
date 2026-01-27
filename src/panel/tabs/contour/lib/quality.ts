// src/panel/tabs/contour/lib/quality.ts

export type QualityMetrics = {
  onPixels: number;
  boundaryPixels: number;
  components: number;
  endpoints: number;
  junctions: number;
  thicknessRatio: number; // onPixels / max(1,boundaryPixels)
};

export function computeMaskQuality(
  mask: Uint8Array,
  width: number,
  height: number
): QualityMetrics {
  const visited = new Uint8Array(mask.length);

  function idx(x: number, y: number) {
    return y * width + x;
  }

  function isOn(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return mask[idx(x, y)] === 1;
  }

  let onPixels = 0;
  let boundaryPixels = 0;
  let endpoints = 0;
  let junctions = 0;
  let components = 0;

  const n8: Array<[number, number]> = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ];

  // Pass 1: degree stats + boundary + onPixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isOn(x, y)) continue;
      onPixels++;

      let deg = 0;
      let hasOffNeighbor = false;

      for (const [dx, dy] of n8) {
        if (isOn(x + dx, y + dy)) deg++;
        else hasOffNeighbor = true;
      }

      if (hasOffNeighbor) boundaryPixels++;
      if (deg === 1) endpoints++;
      else if (deg >= 3) junctions++;
    }
  }

  // Pass 2: connected components (4-neighborhood)
  const n4: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  const qx = new Int32Array(mask.length);
  const qy = new Int32Array(mask.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i0 = idx(x, y);
      if (mask[i0] === 0 || visited[i0] === 1) continue;

      components++;
      visited[i0] = 1;

      let head = 0;
      let tail = 0;
      qx[tail] = x;
      qy[tail] = y;
      tail++;

      while (head < tail) {
        const cx = qx[head];
        const cy = qy[head];
        head++;

        for (const [dx, dy] of n4) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

          const ii = idx(nx, ny);
          if (mask[ii] === 0 || visited[ii] === 1) continue;

          visited[ii] = 1;
          qx[tail] = nx;
          qy[tail] = ny;
          tail++;
        }
      }
    }
  }

  const thicknessRatio = onPixels / Math.max(1, boundaryPixels);

  return { onPixels, boundaryPixels, components, endpoints, junctions, thicknessRatio };
}
