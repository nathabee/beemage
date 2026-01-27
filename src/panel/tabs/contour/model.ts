// src/panel/tabs/contour/model.ts

export type ContourTabState = {
  loadedImageName: string | null;
  hasImage: boolean;
  hasOutput: boolean;
  svgText?: string;

  edgeMask?: Uint8Array;
  repairedMask?: Uint8Array;
  smoothedMask?: Uint8Array;
};

export function createInitialContourTabState(): ContourTabState {
  return {
    loadedImageName: null,
    hasImage: false,
    hasOutput: false,
    edgeMask: undefined,
    repairedMask: undefined,
    smoothedMask: undefined,
    svgText: undefined,
  };
}

export function resetContourTabState(state: ContourTabState): void {
  state.loadedImageName = null;
  state.hasImage = false;
  state.hasOutput = false;

  state.edgeMask = undefined;
  state.repairedMask = undefined;
  state.smoothedMask = undefined;
  state.svgText = undefined;
}
