// src/panel/tabs/contour/lib/simplify.ts

import type { Pt } from "./trace";

export function rdpSimplifyIterative(points: Pt[], epsilon: number): Pt[] {
  if (points.length < 3) return points;

  const eps2 = epsilon * epsilon;

  function distToSeg2(p: Pt, a: Pt, b: Pt): number {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;

    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return (p.x - a.x) ** 2 + (p.y - a.y) ** 2;

    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return (p.x - b.x) ** 2 + (p.y - b.y) ** 2;

    const t = c1 / c2;
    const px = a.x + t * vx;
    const py = a.y + t * vy;
    return (p.x - px) ** 2 + (p.y - py) ** 2;
  }

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stackStart: number[] = [0];
  const stackEnd: number[] = [points.length - 1];

  while (stackStart.length > 0) {
    const start = stackStart.pop()!;
    const end = stackEnd.pop()!;
    if (end <= start + 1) continue;

    const a = points[start];
    const b = points[end];

    let maxD = 0;
    let idx = -1;

    for (let i = start + 1; i < end; i++) {
      const d = distToSeg2(points[i], a, b);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }

    if (idx !== -1 && maxD > eps2) {
      keep[idx] = 1;
      stackStart.push(start);
      stackEnd.push(idx);
      stackStart.push(idx);
      stackEnd.push(end);
    }
  }

  const out: Pt[] = [];
  for (let i = 0; i < points.length; i++) {
    if (keep[i] === 1) out.push(points[i]);
  }

  const dedup: Pt[] = [];
  for (const p of out) {
    const last = dedup[dedup.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) dedup.push(p);
  }

  return dedup;
}

export function chaikinSmooth(points: Pt[], iterations: number): Pt[] {
  let pts = points;

  for (let it = 0; it < iterations; it++) {
    if (pts.length < 3) return pts;

    const out: Pt[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      out.push(
        { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y },
        { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y }
      );
    }

    // keep closed-ish feel by connecting end to start if it looks closed
    const first = pts[0];
    const last = pts[pts.length - 1];
    const dx = first.x - last.x;
    const dy = first.y - last.y;
    const closed = dx * dx + dy * dy <= 4;

    if (closed) {
      const p0 = pts[pts.length - 1];
      const p1 = pts[0];
      out.push(
        { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y },
        { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y }
      );
    }

    pts = out;
  }

  return pts;
}
