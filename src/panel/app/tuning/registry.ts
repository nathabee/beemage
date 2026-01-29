// src/panel/app/tuning/registry.ts

import type {
  ComponentId,
  ComponentNode,
  ComponentRegistry,
  EngineId,
  EnginePolicy,
  ParamSchema,
} from "./types";

function n(
  id: ComponentId,
  title: string,
  implementedEngines: ReadonlyArray<EngineId>,
  defaultEnginePolicy: EnginePolicy,
  params: Record<string, ParamSchema>,
  children?: ComponentNode[],
  description?: string,
): ComponentNode {
  return { id, title, implementedEngines, defaultEnginePolicy, params, children, description };
}

function buildIndex(root: ComponentNode): ComponentRegistry {
  const byId = new Map<ComponentId, ComponentNode>();
  const parentById = new Map<ComponentId, ComponentId | null>();

  function walk(node: ComponentNode, parent: ComponentId | null) {
    if (byId.has(node.id)) {
      throw new Error(`[tuning] Duplicate component id: ${node.id}`);
    }
    byId.set(node.id, node);
    parentById.set(node.id, parent);

    for (const ch of node.children ?? []) walk(ch, node.id);
  }

  walk(root, null);
  return { root, byId, parentById };
}

/**
 * Registry is the source of truth for:
 * - component tree
 * - parameter schemas + defaults
 * - which engines are implemented (native/opencv)
 *
 * NOTE: "opencv" implementation presence is separate from runtime availability (injection).
 */
export function createComponentRegistry(): ComponentRegistry {
  const root = n(
    "app",
    "BeeContour",
    ["native", "opencv"],
    "native",
    {},
    [
      // -----------------------------
      // Contour
      // -----------------------------
      n(
        "contour",
        "Contour",
        ["native", "opencv"],
        "auto",
        {},
        [
          n(
            "contour.process",
            "Process",
            ["native"], // later: add "opencv" if you implement it
            "auto",
            {
              contourScale: { kind: "number", label: "Processing scale", min: 25, max: 100, step: 5, default: 100 },
              edgeThreshold: { kind: "number", label: "Edge threshold", min: 1, max: 255, step: 1, default: 70 },
              invertOutput: { kind: "boolean", label: "White background", default: true },
            },
          ),

          n(
            "contour.clean",
            "Clean & Smooth",
            ["native", "opencv"],  // parent clean is a container; you can keep it native-only
            "auto",
            {
              cleanMinArea: { kind: "number", label: "Min fragment size", min: 0, max: 500, step: 1, default: 12 },
              cleanRadius: { kind: "number", label: "Repair strength", min: 1, max: 3, step: 1, default: 1 },
              cleanBinaryThreshold: {
                kind: "number",
                label: "Binary threshold",
                min: 1,
                max: 254,
                step: 1,
                default: 128,
              },
            },
            [
              n(
                "contour.clean.threshold",
                "Threshold",
                ["native"],
                "auto",
                {},
              ),
              n(
                "contour.clean.removeSmallComponents",
                "Remove small components",
                ["native", "opencv"],
                "auto",
                {},
              ),
              n(
                "contour.clean.repair",
                "Repair gaps",
                ["native"],
                "auto",
                {},
              ),
              n(
                "contour.clean.smooth",
                "Smooth mask",
                ["native"],
                "auto",
                {},
              ),
              n(
                "contour.clean.quality",
                "Quality metrics",
                ["native"],
                "auto",
                {},
              ),
            ],
          ),

          n(
            "contour.vectorize",
            "Vectorize (SVG)",
            ["native"],
            "native",
            {
              pathSmoothIters: {
                kind: "number",
                label: "Path smoothing",
                min: 0,
                max: 4,
                step: 1,
                default: 2,
              },
            },
          ),
        ],
      ),

      // -----------------------------
      // Colors
      // -----------------------------
      n(
        "colors",
        "Colors",
        ["native"],
        "auto",
        {},
        [
          n(
            "colors.fill",
            "Region fill",
            ["native"],
            "auto",
            {
              edgesDark: { kind: "boolean", label: "Edges are dark", default: true },
              edgeMaskThreshold: { kind: "number", label: "Edge threshold", min: 0, max: 255, step: 1, default: 80 },
              edgeDilate: { kind: "number", label: "Gap close (px)", min: 0, max: 6, step: 1, default: 2 },
              maxRegionPx: { kind: "number", label: "Max region (px)", min: 1000, step: 1000, default: 200000 },
            },
          ),
        ],
      ),

      // -----------------------------
      // Segmentation (placeholder)
      // -----------------------------
      n(
        "segmentation",
        "Segmentation",
        ["native"],
        "auto",
        {},
        [],
        "Placeholder: will become multi-step segmentation pipeline.",
      ),
    ],
  );

  return buildIndex(root);
}
