// src/panel/tabs/segmentation/tab.ts
import type { Dom } from "../../app/dom";
import type { Bus } from "../../app/bus";
import { logTrace, logError } from "../../app/log";
import { getBusy, withBusy } from "../../app/state";

export function createSegmentationTab(dom: Dom, _bus: Bus) {



  function setSegBusy(isBusy: boolean) {
    dom.segSpinner.classList.toggle("is-hidden", !isBusy);
    dom.segSpinner.setAttribute("aria-hidden", isBusy ? "false" : "true");

    // IMPORTANT (CGO rule): no dom.btnSegLoadCv.disabled here.
    // Global busy gating owns disabled state via applyBusy().
  }


  function setStatus(text: string) {
    dom.segStatus.textContent = text || "";
  }

  function setReport(text: string) {
    dom.segCvReport.textContent = text || "";
  }

  // panel.html lives at:
  // - extension: /panel/panel.html  => ../assets/... resolves to /assets/...
  // - demo:      /__app/panel.html  => ../assets/... resolves to /assets/...
  //
  // Relative path (no leading "/") also works for GH Pages with base "./".
  const OPENCV_JS_URL = "../assets/opencv/opencv.js";
  const OPENCV_WASM_URL = "../assets/opencv/opencv.wasm";

  function ensureModuleConfig() {
    const g: any = globalThis as any;
    g.Module = g.Module || {};

    // Must be set BEFORE opencv.js evaluates.
    g.Module.locateFile = (p: string) => (p.endsWith(".wasm") ? OPENCV_WASM_URL : p);

    // IMPORTANT:
    // OpenCV/Emscripten can print a lot during init. Routing that to console can
    // effectively starve the event loop and make us "hang" in awaits like setTimeout(0).
    // Keep it quiet for now.
    g.Module.print = () => { };
    g.Module.printErr = (msg: any) => {
      // keep it visible in DevTools even if your app log pipeline is busy
      console.error("[OpenCV][stderr]", msg);
    };


    // Optional: capture fatal aborts without flooding the console
    g.Module.onAbort = (msg: any) => {
      logError("[segmentation] OpenCV aborted", { msg: String(msg) });
    };

    logTrace("[segmentation] Module configured", {
      locateFileType: typeof g.Module.locateFile,
      expectedWasmUrl: OPENCV_WASM_URL,
      docUrl: String(globalThis.location?.href || ""),
    });
  }

  async function wasmReachabilityCheck(): Promise<void> {
    try {
      // Range request often returns 206 (Partial Content) — that's normal.
      const r = await fetch(OPENCV_WASM_URL, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        cache: "no-store",
      });
      logTrace("[segmentation] wasm reachability check", {
        wasmUrl: OPENCV_WASM_URL,
        ok: r.ok,
        status: r.status,
      });
    } catch (e: any) {
      logTrace("[segmentation] wasm reachability check failed (non-fatal)", {
        wasmUrl: OPENCV_WASM_URL,
        msg: String(e?.message ?? e),
      });
    }
  }

  async function injectScriptOnce(src: string): Promise<void> {
    const abs = new URL(src, document.baseURI).toString();

    const existing = Array.from(document.scripts).find((s) => s.src === abs) as HTMLScriptElement | undefined;
    if (existing) {
      logTrace("[segmentation] opencv.js script already present", { src, abs });
      return;
    }

    logTrace("[segmentation] injecting opencv.js script", { src, abs });

    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = abs;
      s.async = true;
      s.onload = () => {
        logTrace("[segmentation] opencv.js script onload", { src: abs });
        resolve();
      };
      s.onerror = () => reject(new Error(`Failed to load script: ${abs}`));
      document.head.appendChild(s);
    });
  }




  async function waitForCvMatReady(timeoutMs: number): Promise<boolean> {
    const g: any = globalThis as any;
    const started = Date.now();
    let tick = 0;

    while (Date.now() - started < timeoutMs) {
      tick++;

      const cv = g.cv;
      const matType = typeof cv?.Mat;

      if (tick === 1 || tick % 10 === 0 || matType === "function") {
        logTrace("[segmentation] cv poll", {
          tick,
          elapsedMs: Date.now() - started,
          cvType: typeof cv,
          matType,
        });
      }

      if (cv && typeof cv.Mat === "function") {
        try {
          const m = new cv.Mat();
          if (typeof m?.delete === "function") m.delete();

          console.log("[segmentation] smoke ok: Mat ctor (console)");

          // CRITICAL: resolve with a primitive, not cv
          return true;
        } catch (e: any) {
          if (tick === 1 || tick % 10 === 0) {
            logTrace("[segmentation] Mat ctor threw (still initializing)", {
              elapsedMs: Date.now() - started,
              msg: String(e?.message ?? e),
            });
          }
        }
      }

      logTrace("[segmentation] waitForCvMatReady await setTimeout promise");
      await new Promise((r) => setTimeout(r, 75));
    }

    throw new Error(
      `OpenCV init timeout after ${timeoutMs}ms. typeof globalThis.cv=${typeof (g as any).cv}, typeof cv?.Mat=${typeof (g as any).cv?.Mat}.`
    );
  }


  async function loadOpenCv(timeoutMs: number): Promise<void> {
    ensureModuleConfig();
    await wasmReachabilityCheck();

    const g: any = globalThis as any;

    if (!g.cv) {
      await injectScriptOnce(OPENCV_JS_URL);
    } else {
      logTrace("[segmentation] cv already exists before injection", { cvType: typeof g.cv });
    }

    logTrace("[segmentation] after inject/onload", {
      cvType: typeof (globalThis as any).cv,
      moduleType: typeof (globalThis as any).Module,
    });

    logTrace("[segmentation] loadOpenCv: before waitForCvMatReady", { timeoutMs });

    const ok = await waitForCvMatReady(timeoutMs);
    console.log("[segmentation] loadOpenCv resumed after waitForCvMatReady (console)", ok);

    // DO NOT return cv (it wedges promise resolution in this environment)
    if (!(globalThis as any).cv || typeof (globalThis as any).cv?.Mat !== "function") {
      throw new Error("OpenCV ready check failed: globalThis.cv missing or cv.Mat not a function");
    }

    console.log("[segmentation] OpenCV ready (global cv present)");
  }



  function probeCv(cv: any): string {
    const lines: string[] = [];
    lines.push("OpenCV probe report");
    lines.push(`At: ${new Date().toISOString()}`);
    lines.push("");

    lines.push(`cv present: ${!!cv}`);
    lines.push(`Mat: ${typeof cv?.Mat}`);
    lines.push(`getBuildInformation: ${typeof cv?.getBuildInformation}`);
    lines.push("");

    lines.push("Build info: (skipped — can be slow/hang in some builds)");
    lines.push("");

    lines.push("Top-level keys (first 80):");
    try {
      const keys = Object.keys(cv || {}).sort();
      lines.push(keys.slice(0, 80).join(", "));
      if (keys.length > 80) lines.push(`… (${keys.length - 80} more)`);
    } catch (e: any) {
      lines.push(`ERROR listing keys: ${String(e?.message ?? e)}`);
    }

    return lines.join("\n");
  }



  async function onLoadAndProbe() {
    if (getBusy()) {
      logTrace("[segmentation] click ignored (busy)");
      return;
    }

    setSegBusy(true);
    setStatus("Loading OpenCV…");
    setReport("Loading OpenCV…");

    let cv: any = null;

    try {
      await withBusy(dom, async () => {
        logTrace("[segmentation] load: start", { OPENCV_JS_URL, OPENCV_WASM_URL });

        await loadOpenCv(20000);

        // Now read cv from global AFTER await (no promise-resolution-with-cv)
        cv = (globalThis as any).cv;

        logTrace("[segmentation] load: cv ready (Mat usable)");
      });


      // IMPORTANT: at this point, global busy has been released.
      setStatus("OpenCV ready");

      // Build a *light* report immediately (won’t lock UI).
      const report = probeCv(cv);
      setReport(report);
      logTrace("[segmentation] probe: report built", { reportChars: report.length });

      // Optional: if you really want build info, do it AFTER busy is released,
      // and do it in a macrotask so UI can repaint first.
      //
      // setTimeout(() => {
      //   try {
      //     if (typeof cv?.getBuildInformation === "function") {
      //       const bi = String(cv.getBuildInformation());
      //       setReport(report + "\n\nBuild info prefix:\n" + bi.slice(0, 1200));
      //     }
      //   } catch (e: any) {
      //     setReport(report + "\n\nBuild info ERROR:\n" + String(e?.message ?? e));
      //   }
      // }, 0);

      logTrace("[segmentation] load: done");
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err);
      setStatus("OpenCV load failed");
      setReport(`ERROR\n\n${msg}`);
      logError("[segmentation] load: fail", { msg });
    } finally {
      setSegBusy(false);
      logTrace("[segmentation] load: finally (seg spinner cleared)");
    }
  }


  // src/panel/tabs/segmentation/tab.ts
  function bind() {
    dom.btnSegLoadCv.addEventListener("click", (e) => {
      e.preventDefault?.();

      if (getBusy()) {
        logTrace("[segmentation] click ignored (busy)");
        return;
      }

      void onLoadAndProbe();
    });
  }


  function mount() {
    setSegBusy(false);
    setStatus("Idle");
    if (!dom.segCvReport.textContent?.trim()) {
      setReport("Click “Load OpenCV & Probe”.");
    }
  }

  function unmount() { }
  function refresh() { }
  function dispose() { }

  return { bind, mount, unmount, refresh, dispose };
}
