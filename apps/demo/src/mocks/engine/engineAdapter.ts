
// demo/src/mocks/engine/engineAdapter.ts (demo override)

import { setEngineAvailable, setEngineUnavailable } from "../../../../../src/panel/app/engine/engineAvailability";
import { loadOpenCv } from "./opencvLoader";

export function supportsOpenCvLoad(): boolean {
  return true;
}

export async function attemptLoadOpenCv(): Promise<void> {
  try {
    await loadOpenCv({
      opencvJsRel: "../assets/opencv/opencv.js",
      opencvWasmRel: "../assets/opencv/opencv.wasm",
      timeoutMs: 20000,
    });

    setEngineAvailable("opencv");
  } catch (e: any) {
    setEngineUnavailable("opencv", e?.message ? String(e.message) : String(e));
    throw e;
  }
}
