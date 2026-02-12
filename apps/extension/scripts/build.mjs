// apps/extension/scripts/build.mjs
import { build, context } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url"; // ✅ REQUIRED for ESM __dirname emulation

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Deterministic roots (independent of where you run node from)
const appRoot = path.resolve(__dirname, "..");      // .../apps/extension
const repoRoot = path.resolve(appRoot, "../..");    // .../ (repo root)
const distDir = path.join(appRoot, "dist");         // .../apps/extension/dist

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dst) {
  mkdirp(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

function copyDir(srcDir, dstDir, opts = {}) {
  const { excludeFileNames = new Set() } = opts;
  mkdirp(dstDir);

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (excludeFileNames.has(entry.name)) continue;

    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);

    if (entry.isDirectory()) copyDir(src, dst, opts);
    else copyFile(src, dst);
  }
}

function copyStatic({ isDev }) {
  // manifest (extension-only)
  copyFile(path.join(appRoot, "manifest.json"), path.join(distDir, "manifest.json"));

  // panel files (shared kernel UI)
  copyFile(path.join(repoRoot, "src/panel/panel.html"), path.join(distDir, "panel/panel.html"));
  copyFile(path.join(repoRoot, "src/panel/panel.css"), path.join(distDir, "panel/panel.css"));

  // assets (shared)
  const assetsSrc = path.join(repoRoot, "assets");
  if (fs.existsSync(assetsSrc)) {
    const excludeFileNames = isDev ? new Set() : new Set(["icon.svg"]);
    copyDir(assetsSrc, path.join(distDir, "assets"), { excludeFileNames });
  }
}

function watchIfExists(fileOrDir, opts, cb) {
  if (!fs.existsSync(fileOrDir)) return;
  try {
    fs.watch(fileOrDir, opts, cb);
  } catch {
    // ignore watcher failures (platform quirks)
  }
}

function runTypecheckOnce() {
  const tscBin = process.platform === "win32" ? "tsc.cmd" : "tsc";
  const r = spawnSync(tscBin, ["-p", "tsconfig.json", "--noEmit"], {
    cwd: appRoot,
    stdio: "inherit",
    shell: false,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function runTypecheckWatch() {
  const tscBin = process.platform === "win32" ? "tsc.cmd" : "tsc";
  const child = spawn(tscBin, ["-p", "tsconfig.json", "--noEmit", "--watch"], {
    cwd: appRoot,
    stdio: "inherit",
    shell: false,
  });
  child.on("exit", (code) => {
    if (code && code !== 0) process.exitCode = code;
  });
}

const isWatch = process.argv.includes("--watch");
const wantsTypecheckInWatch = process.argv.includes("--typecheck");
const isDev = isWatch || process.argv.includes("--dev");

if (!isWatch) rmrf(distDir);
mkdirp(distDir);

const entryPoints = {
  content: path.join(appRoot, "src/content.ts"),   // extension-only
  panel: path.join(repoRoot, "src/panel/panel.ts") // shared
};

const common = {
  bundle: true,
  format: "esm",
  target: "es2022",
  sourcemap: isDev,
  outdir: distDir,
  platform: "browser",
  logLevel: "info",
};

async function runOnce() {
  runTypecheckOnce();
  await build({ ...common, entryPoints, entryNames: "[name]" });
  copyStatic({ isDev });
}

async function runWatch() {
  if (wantsTypecheckInWatch) runTypecheckWatch();

  const ctx = await context({ ...common, entryPoints, entryNames: "[name]" });
  await ctx.watch();
  copyStatic({ isDev });

  watchIfExists(path.join(appRoot, "manifest.json"), {}, () => copyStatic({ isDev }));
  watchIfExists(path.join(repoRoot, "src/panel"), { recursive: true }, () => copyStatic({ isDev }));
  watchIfExists(path.join(repoRoot, "assets"), { recursive: true }, () => copyStatic({ isDev }));

  console.log("Watching…");
}

if (isWatch) await runWatch();
else await runOnce();
