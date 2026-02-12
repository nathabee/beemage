// demo/src/mocks/engine/helpers/cv.ts
export function getCvOrNull(): any | null {
  const g: any = globalThis as any;
  return g?.cv && typeof g.cv.Mat === "function" ? g.cv : null;
}
