// /apps/demo/vite.config.ts
import { defineConfig, type Plugin } from "vite";
import path from "node:path";
import fs from "node:fs";

const repoRoot = path.resolve(__dirname, "../.."); // repo root (because __dirname = apps/demo)

function tracePlatformResolves(): Plugin {
  return {
    name: "app-trace-platform-resolves",
    enforce: "pre",
    async resolveId(source, importer, options) {
      const shouldTrace =
        source === "./opsDispatchImpl" ||
        source.endsWith("/opsDispatchImpl") ||
        source.endsWith("/opsDispatchImpl.ts") ||
        source.includes("panel/platform/runtime") ||
        source.includes("shared/platform/storage") ||
        source.includes("panel/platform/engineAdapter") ||
        source.includes("panel/platform/opsDispatchImpl") ||
        source.includes("platform/runtime") ||
        source.includes("platform/storage") ||
        source.includes("platform/engineAdapter") ||
        source.includes("platform/opsDispatchImpl");

      if (shouldTrace) {
        const r = await this.resolve(source, importer, { ...options, skipSelf: true });
        console.log("[app-trace] source   :", source);
        console.log("[app-trace] importer :", importer);
        console.log("[app-trace] resolved :", r?.id);
        console.log("----");
      }

      return null;
    },
  };
}

function seamSwapPlugin(): Plugin {
  const mockRuntimePath = path.resolve(__dirname, "src/mocks/runtime.ts");
  const mockStoragePath = path.resolve(__dirname, "src/mocks/storage.ts");
  const mockEngineAdapterPath = path.resolve(__dirname, "src/mocks/engine/engineAdapter.ts");
  const mockOpsDispatchImplPath = path.resolve(__dirname, "src/mocks/engine/opsDispatchImpl.ts");

  function clean(id: string) {
    return id.split("?")[0].replace(/\\/g, "/");
  }

  function isPanelRuntime(id: string): boolean {
    return (
      id.includes("/src/panel/platform/runtime") ||
      id.endsWith("/src/panel/platform/runtime.ts") ||
      id.endsWith("/src/panel/platform/runtime.js")
    );
  }

  function isSharedStorage(id: string): boolean {
    return (
      id.includes("/src/shared/platform/storage") ||
      id.endsWith("/src/shared/platform/storage.ts") ||
      id.endsWith("/src/shared/platform/storage.js")
    );
  }

  function isEngineAdapter(id: string): boolean {
    return (
      id.includes("/src/panel/platform/engineAdapter") ||
      id.endsWith("/src/panel/platform/engineAdapter.ts") ||
      id.endsWith("/src/panel/platform/engineAdapter.js")
    );
  }

  function isOpsDispatchImpl(id: string): boolean {
    return (
      id.includes("/src/panel/platform/opsDispatchImpl") ||
      id.endsWith("/src/panel/platform/opsDispatchImpl.ts") ||
      id.endsWith("/src/panel/platform/opsDispatchImpl.js")
    );
  }

  return {
    name: "app-seam-swap",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer) return null;

      const r = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!r?.id) return null;

      const id = clean(r.id);

      // IMPORTANT: keep demo builds free of Chrome APIs by swapping seams.
      if (isPanelRuntime(id)) {
        console.log("[seam] runtime -> mock");
        console.log("       from:", id);
        console.log("       to  :", mockRuntimePath);
        console.log("----");
        return mockRuntimePath;
      }

      if (isSharedStorage(id)) {
        console.log("[seam] storage -> mock");
        return mockStoragePath;
      }

      if (isEngineAdapter(id)) {
        console.log("[seam] engineAdapter -> mock");
        return mockEngineAdapterPath;
      }

      if (isOpsDispatchImpl(id)) {
        console.log("[seam] opsDispatchImpl -> mock");
        return mockOpsDispatchImplPath;
      }

      return null;
    },
  };
}

function panelAssetsPlugin(): Plugin {
  const panelHtml = path.resolve(repoRoot, "src/panel/panel.html");
  const panelCss = path.resolve(repoRoot, "src/panel/panel.css");

  function readOrNull(p: string): string | null {
    try {
      return fs.readFileSync(p, "utf8");
    } catch {
      return null;
    }
  }

  function sanitizePanelHtml(html: string): string {
    // Remove extension bundle script
    html = html.replace(
      /<script\s+type=["']module["']\s+src=["'][^"']*panel\.js["']\s*>\s*<\/script>\s*/gi,
      "",
    );

    // Ensure panel.css is referenced relatively
    html = html.replace(/href=["'][^"']*panel\.css["']/gi, 'href="app/panel.css"');

    return html;
  }

  function assertHtml(): string {
    const html = readOrNull(panelHtml);
    if (!html) throw new Error(`Missing panel HTML at: ${panelHtml}`);

    if (!html.includes('id="appRoot"')) {
      throw new Error(`Wrong panel HTML file (no #appRoot): ${panelHtml}`);
    }

    return sanitizePanelHtml(html);
  }

  return {
    name: "app-panel-assets",

    // DEV only: serve assets (production uses the emitted files)
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        if (req.url.endsWith("/app/panel.html")) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(assertHtml());
          return;
        }

        if (req.url.endsWith("/app/panel.css")) {
          const css = readOrNull(panelCss);
          if (!css) {
            res.statusCode = 404;
            res.end(`Missing panel CSS at: ${panelCss}`);
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/css; charset=utf-8");
          res.end(css);
          return;
        }

        next();
      });
    },

    // BUILD: emit into dist
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "app/panel.html", source: assertHtml() });

      const css = readOrNull(panelCss);
      if (css) this.emitFile({ type: "asset", fileName: "app/panel.css", source: css });
    },
  };
}

function ensureOpenCvPublicPlugin(): Plugin {
  const docsCvDir = path.resolve(repoRoot, "docs/assets/opencv");
  const nmCvDir = path.resolve(__dirname, "node_modules/@opencv.js/wasm");

  // Vite copies demo/public/* into dist/*
  const dstDir = path.resolve(__dirname, "public/assets/opencv");
  const dstJs = path.resolve(dstDir, "opencv.js");
  const dstWasm = path.resolve(dstDir, "opencv.wasm");

  function fileExists(p: string): boolean {
    try {
      fs.accessSync(p, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  function copyIfDifferent(src: string, dst: string): boolean {
    const srcBuf = fs.readFileSync(src);
    if (fileExists(dst)) {
      const dstBuf = fs.readFileSync(dst);
      if (dstBuf.length === srcBuf.length && dstBuf.equals(srcBuf)) return false;
    }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, srcBuf);
    return true;
  }

  function ensureOpenCv(): void {
    const docsJs = path.resolve(docsCvDir, "opencv.js");
    const docsWasm = path.resolve(docsCvDir, "opencv.wasm");

    const nmJs = path.resolve(nmCvDir, "opencv.js");
    const nmWasm = path.resolve(nmCvDir, "opencv.wasm");

    let srcJs = "";
    let srcWasm = "";

    // Prefer committed runtime, fallback to node_modules.
    if (fileExists(docsJs) && fileExists(docsWasm)) {
      srcJs = docsJs;
      srcWasm = docsWasm;
    } else if (fileExists(nmJs) && fileExists(nmWasm)) {
      srcJs = nmJs;
      srcWasm = nmWasm;
    } else {
      throw new Error(
        [
          "OpenCV runtime not found.",
          "Expected either:",
          `- ${docsCvDir}/opencv.{js,wasm} (committed)`,
          `- ${nmCvDir}/opencv.{js,wasm} (after npm install)`,
        ].join("\n"),
      );
    }

    fs.mkdirSync(dstDir, { recursive: true });

    const jsChanged = copyIfDifferent(srcJs, dstJs);
    const wasmChanged = copyIfDifferent(srcWasm, dstWasm);

    if (jsChanged || wasmChanged) {
      console.log(`[opencv] ensured public assets (updated=${String(jsChanged || wasmChanged)})`);
    } else {
      console.log("[opencv] ensured public assets (no changes)");
    }
  }

  return {
    name: "app-ensure-opencv-public",
    enforce: "pre",

    // Build: must run BEFORE Vite copies publicDir
    configResolved() {
      ensureOpenCv();
    },

    // Dev: ensure once when server starts
    configureServer() {
      ensureOpenCv();
    },
  };
}

function ensurePipelinesPublicPlugin(): Plugin {
  // Source of truth (repo root)
  const srcDir = path.resolve(repoRoot, "assets/pipelines");

  // Destination that Vite copies verbatim into dist/
  const dstDir = path.resolve(__dirname, "public/assets/pipelines");

  function isReadableDir(p: string): boolean {
    try {
      const st = fs.statSync(p);
      return st.isDirectory();
    } catch {
      return false;
    }
  }

  function listJsonFilesRecursive(dir: string): string[] {
    const out: string[] = [];

    function walk(d: string) {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const e of entries) {
        const abs = path.join(d, e.name);
        if (e.isDirectory()) walk(abs);
        else if (e.isFile() && e.name.toLowerCase().endsWith(".json")) out.push(abs);
      }
    }

    walk(dir);
    return out;
  }

  function readBuf(p: string): Buffer {
    return fs.readFileSync(p);
  }

  function copyIfDifferent(src: string, dst: string): boolean {
    const srcBuf = readBuf(src);

    try {
      const dstBuf = readBuf(dst);
      if (dstBuf.length === srcBuf.length && dstBuf.equals(srcBuf)) return false;
    } catch {
      // dst missing -> copy
    }

    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, srcBuf);
    return true;
  }

  function ensurePipelines(): void {
    if (!isReadableDir(srcDir)) {
      throw new Error(
        [
          "Pipeline JSON assets not found.",
          "Expected directory:",
          `- ${srcDir}`,
          "Create it and place your JSON files there (committed).",
        ].join("\n"),
      );
    }

    fs.mkdirSync(dstDir, { recursive: true });

    const srcFiles = listJsonFilesRecursive(srcDir);

    // Copy/update JSON files
    let changed = 0;
    for (const absSrc of srcFiles) {
      const rel = path.relative(srcDir, absSrc); // keep subfolders if any
      const absDst = path.resolve(dstDir, rel);
      if (copyIfDifferent(absSrc, absDst)) changed++;
    }

    // Cleanup: remove stale json in dst that no longer exists in src
    const dstFiles = isReadableDir(dstDir) ? listJsonFilesRecursive(dstDir) : [];
    const srcRelSet = new Set(srcFiles.map((p) => path.relative(srcDir, p).replace(/\\/g, "/")));
    let removed = 0;

    for (const absDst of dstFiles) {
      const rel = path.relative(dstDir, absDst).replace(/\\/g, "/");
      if (!srcRelSet.has(rel)) {
        fs.unlinkSync(absDst);
        removed++;
      }
    }

    console.log(`[pipelines] ensured public assets (copied=${changed}, removed=${removed}, total=${srcFiles.length})`);
  }

  return {
    name: "app-ensure-pipelines-public",
    enforce: "pre",

    // Build: must run BEFORE Vite copies publicDir
    configResolved() {
      ensurePipelines();
    },

    // Dev: ensure once when server starts
    configureServer() {
      ensurePipelines();
    },
  };
}

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    root: __dirname,
    base: "./",
    plugins: [
      ...(isDev ? [tracePlatformResolves()] : []),
      ensureOpenCvPublicPlugin(),
      ensurePipelinesPublicPlugin(),
      seamSwapPlugin(),
      panelAssetsPlugin(),
    ],
    server: {
      // Allow reading shared code + assets from repo root
      fs: { allow: [repoRoot, __dirname] },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
