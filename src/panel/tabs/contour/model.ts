// src/panel/tabs/contour/model.ts
export type ContourTabState = {
  loadedImageName: string | null;
  hasImage: boolean;
  lastError?: string;
};

export function createInitialContourTabState(): ContourTabState {
  return { loadedImageName: null, hasImage: false, lastError: undefined };
}

export function resetContourTabState(state: ContourTabState): void {
  state.loadedImageName = null;
  state.hasImage = false;
  state.lastError = undefined;
}
