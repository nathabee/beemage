// demo/src/mocks/engine/opencvLoader.ts (demo-only skeleton)


type LoadArgs = {
  opencvJsRel: string;
  opencvWasmRel: string;
  timeoutMs: number;
};

export async function loadOpenCv(args: LoadArgs): Promise<void> {
  const jsUrl = new URL(args.opencvJsRel, document.baseURI).toString();
  const wasmUrl = new URL(args.opencvWasmRel, document.baseURI).toString();

  const g: any = globalThis as any;
  g.Module = g.Module || {};
  g.Module.locateFile = (p: string) => (p.endsWith(".wasm") ? wasmUrl : p);
  g.Module.print = () => {};
  g.Module.printErr = () => {};

  if (!g.cv) {
    await injectScript(jsUrl);
  }

  await waitForCvReady(args.timeoutMs);
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load OpenCV script: ${src}`));
    document.head.appendChild(s);
  });
}

async function waitForCvReady(timeoutMs: number): Promise<void> {
  const start = Date.now();
  const g: any = globalThis as any;

  while (Date.now() - start < timeoutMs) {
    if (g.cv && typeof g.cv.Mat === "function") {
      const m = new g.cv.Mat();
      m.delete?.();
      return;
    }
    await new Promise((r) => setTimeout(r, 75));
  }

  throw new Error("OpenCV initialization timeout");
}
