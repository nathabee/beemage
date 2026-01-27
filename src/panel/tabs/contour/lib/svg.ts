// src/panel/tabs/contour/lib/svg.ts

import type { Pt } from "./trace";

export function buildSvgFromPolylines(polylines: Pt[][], width: number, height: number): string {
  const paths: string[] = [];

  for (const pts of polylines) {
    const d = catmullRomToBezierPath(pts);
    if (!d) continue;

    paths.push(
      `<path d="${d}" fill="none" stroke="#000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n` +
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#fff"/>\n` +
    paths.join("\n") +
    `\n</svg>\n`
  );
}

export function catmullRomToBezierPath(points: Pt[]): string {
  if (points.length < 2) return "";

  const pts = points.slice();

  // If nearly closed, force closure by appending first point
  const first = pts[0];
  const last = pts[pts.length - 1];
  const dx = first.x - last.x;
  const dy = first.y - last.y;
  const closed = dx * dx + dy * dy <= 4;
  if (closed) pts.push({ x: first.x, y: first.y });

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    // Catmull-Rom to Bezier conversion (tension = 0.5)
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(
      2
    )} ${p2.y.toFixed(2)}`;
  }

  if (closed) d += " Z";
  return d;
}
