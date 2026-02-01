// src/panel/tabs/segmentation/lib/morphology.ts

export type MorphologyParams = {
  morphAlgo: number;  // 0..3
  morphK: number;     // odd >=1
  morphIters: number; // 1..5
};

export function morphologyNative(mask: Uint8Array, width: number, height: number, params: MorphologyParams): Uint8Array {
  if (!width || !height) return mask;

  const algo = Math.floor(Number(params.morphAlgo ?? 2));
  const iters = clampInt(Math.floor(Number(params.morphIters ?? 1)), 1, 20);

  const kRaw = Math.floor(Number(params.morphK ?? 5));
  const k = normalizeOddKernel(kRaw);
  const r = (k - 1) >> 1;

  if (algo <= 0 || k <= 1) return mask;

  // Use double-buffering explicitly to avoid type issues and ensure correctness.
  let a: Uint8Array = mask;
  let b: Uint8Array = new Uint8Array(width * height);

  for (let it = 0; it < iters; it++) {
    if (algo === 1) {
      // erode: a -> b, then swap
      erode(a, b, width, height, r);
      const t = a;
      a = b;
      b = t;
      continue;
    }

    if (algo === 2) {
      // dilate: a -> b, then swap
      dilate(a, b, width, height, r);
      const t = a;
      a = b;
      b = t;
      continue;
    }

    // algo === 3: close = dilate then erode
    // dilate: a -> b
    dilate(a, b, width, height, r);

    // erode: b -> a (write back into a buffer)
    // If 'a' is the original input mask and you don't want to mutate it, make sure a is not aliasing mask.
    // We ensure that by copying once on first close iteration if needed.
    if (a === mask && it === 0) {
      a = new Uint8Array(mask); // detach from input for safety
    }
    erode(b, a, width, height, r);

    // After this iteration:
    // a holds the result, b is temp. Keep them as-is (no swap needed).
  }

  return a;
}


function normalizeOddKernel(k: number): number {
  if (!Number.isFinite(k)) return 5;
  if (k < 1) return 1;
  if (k % 2 === 0) return k + 1;
  return k;
}

function dilate(src: Uint8Array, dst: Uint8Array, w: number, h: number, r: number): void {
  dst.fill(0);

  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h - 1, y + r);

    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w - 1, x + r);

      let on = 0;
      for (let yy = y0; yy <= y1 && !on; yy++) {
        let idx = yy * w + x0;
        for (let xx = x0; xx <= x1; xx++, idx++) {
          if (src[idx]) {
            on = 1;
            break;
          }
        }
      }

      dst[y * w + x] = on;
    }
  }
}

function erode(src: Uint8Array, dst: Uint8Array, w: number, h: number, r: number): void {
  dst.fill(0);

  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h - 1, y + r);

    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w - 1, x + r);

      // Erode: require all pixels in window to be 1.
      // Out-of-bounds treated as 0 by clamping window to image bounds.
      let on = 1;
      for (let yy = y0; yy <= y1 && on; yy++) {
        let idx = yy * w + x0;
        for (let xx = x0; xx <= x1; xx++, idx++) {
          if (!src[idx]) {
            on = 0;
            break;
          }
        }
      }

      dst[y * w + x] = on;
    }
  }
}

function clampInt(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

 