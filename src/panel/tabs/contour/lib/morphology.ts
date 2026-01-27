// src/panel/tabs/contour/lib/morphology.ts

export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n | 0));
}

export function renderMask(
  mask: Uint8Array,
  width: number,
  height: number,
  whiteBg: boolean
): ImageData {
  const img = new ImageData(width, height);
  const d = img.data;

  for (let p = 0, i = 0; p < mask.length; p++, i += 4) {
    const isEdge = mask[p] === 1;
    if (whiteBg) {
      // black edges on white background
      const v = isEdge ? 0 : 255;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    } else {
      // white edges on black background
      const v = isEdge ? 255 : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
  }

  return img;
}

export function dilate(
  src: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  const dst = new Uint8Array(src.length);
  const r = Math.max(1, radius);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 0;

      for (let j = -r; j <= r && !on; j++) {
        const yy = y + j;
        if (yy < 0 || yy >= height) continue;
        const row = yy * width;

        for (let i = -r; i <= r; i++) {
          const xx = x + i;
          if (xx < 0 || xx >= width) continue;
          if (src[row + xx] === 1) {
            on = 1;
            break;
          }
        }
      }

      dst[y * width + x] = on;
    }
  }

  return dst;
}

export function erode(
  src: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  const dst = new Uint8Array(src.length);
  const r = Math.max(1, radius);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 1;

      for (let j = -r; j <= r && on; j++) {
        const yy = y + j;
        if (yy < 0 || yy >= height) {
          on = 0;
          break;
        }
        const row = yy * width;

        for (let i = -r; i <= r; i++) {
          const xx = x + i;
          if (xx < 0 || xx >= width) {
            on = 0;
            break;
          }
          if (src[row + xx] === 0) {
            on = 0;
            break;
          }
        }
      }

      dst[y * width + x] = on;
    }
  }

  return dst;
}

export function removeSmallComponents(
  src: Uint8Array,
  width: number,
  height: number,
  minArea: number
): Uint8Array {
  const dst = new Uint8Array(src); // start as copy
  const visited = new Uint8Array(src.length);

  const qx = new Int32Array(src.length);
  const qy = new Int32Array(src.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx0 = y * width + x;
      if (src[idx0] === 0 || visited[idx0] === 1) continue;

      // BFS for this component (4-neighborhood is enough for speck removal)
      let head = 0;
      let tail = 0;
      visited[idx0] = 1;
      qx[tail] = x;
      qy[tail] = y;
      tail++;

      const members: number[] = [idx0];

      while (head < tail) {
        const cx = qx[head];
        const cy = qy[head];
        head++;

        const n = [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ];

        for (const [nx, ny] of n) {
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const idx = ny * width + nx;
          if (src[idx] === 0 || visited[idx] === 1) continue;

          visited[idx] = 1;
          qx[tail] = nx;
          qy[tail] = ny;
          tail++;
          members.push(idx);
        }
      }

      if (members.length < minArea) {
        for (const idx of members) dst[idx] = 0;
      }
    }
  }

  return dst;
}
