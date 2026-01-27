// src/panel/tabs/contour/lib/trace.ts

export type Pt = { x: number; y: number };

export function traceBoundaries(mask: Uint8Array, width: number, height: number): Pt[][] {
  const visited = new Uint8Array(mask.length);
  const polylines: Pt[][] = [];

  function idxOf(x: number, y: number): number {
    return y * width + x;
  }

  function isOn(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return mask[idxOf(x, y)] === 1;
  }

  function isBoundary(x: number, y: number): boolean {
    if (!isOn(x, y)) return false;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        if (i === 0 && j === 0) continue;
        if (!isOn(x + i, y + j)) return true;
      }
    }
    return false;
  }

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
  ];

  // Hard limits to prevent memory blow-ups on noisy masks.
  // Tune if needed, but keep them.
  const MAX_POLYLINES = 2000;
  const MAX_POINTS_PER_POLY = Math.max(2000, Math.floor((width + height) * 2));
  const MAX_TOTAL_POINTS = Math.max(200000, Math.floor(width * height * 0.25));

  let totalPoints = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (polylines.length >= MAX_POLYLINES) return polylines;
      if (totalPoints >= MAX_TOTAL_POINTS) return polylines;

      const startIdx = idxOf(x, y);
      if (visited[startIdx] === 1) continue;
      if (!isBoundary(x, y)) continue;

      const poly: Pt[] = [];
      let cx = x;
      let cy = y;

      let prevDir = 4;
      let steps = 0;

      // Smaller maxSteps: still safe, but avoids “2M points in one polyline”.
      const maxSteps = Math.min(width * height, MAX_POINTS_PER_POLY * 4);

      while (steps < maxSteps) {
        steps++;

        const cIdx = idxOf(cx, cy);
        if (visited[cIdx] === 1) {
          // If we arrive at an already-visited boundary pixel, stop.
          // This prevents wandering loops and runaway memory usage.
          break;
        }

        poly.push({ x: cx, y: cy });
        visited[cIdx] = 1;
        totalPoints++;

        if (poly.length >= MAX_POINTS_PER_POLY) break;
        if (totalPoints >= MAX_TOTAL_POINTS) break;

        let found = false;
        const startDir = (prevDir + 6) % 8;

        for (let k = 0; k < 8; k++) {
          const di = (startDir + k) % 8;
          const nx = cx + dirs[di].dx;
          const ny = cy + dirs[di].dy;

          if (!isBoundary(nx, ny)) continue;

          // Allow closing back to the start (only after some length),
          // otherwise do not step onto visited pixels.
          const nIdx = idxOf(nx, ny);
          const isClosing = nx === x && ny === y && poly.length > 10;

          if (!isClosing && visited[nIdx] === 1) continue;

          cx = nx;
          cy = ny;
          prevDir = di;
          found = true;
          break;
        }

        if (!found) break;
        if (cx === x && cy === y && poly.length > 10) break;
      }

      if (poly.length >= 20) {
        polylines.push(poly);
      } else {
        // If it’s too short, we still marked some visited pixels.
        // That’s fine; it prevents repeated tiny loops on noisy masks.
      }
    }
  }

  return polylines;
}
