// src/panel/tabs/segmentation/model.ts
export type SegmentationModel = {
  status: string;
  report: string;
};

export function createSegmentationModel(): SegmentationModel {
  return {
    status: "Idle",
    report:
      [
        "Segmentation placeholder",
        "",
        "Planned:",
        "- Multi-step segmentation pipeline (process1..processN)",
        "- Per-step engine selection: native / opencv / auto",
        "- OpenCV injection + probing is managed in Settings (demo-only).",
      ].join("\n"),
  };
}
