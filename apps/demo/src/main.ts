// demo/src/main.ts

function getBasePath(): string {
  // Vite injects this based on `base` in vite.config.ts
  // - "./" becomes something like "/beemage-demo/" at runtime when served from that folder
  // - on GitHub pages it becomes "/repo/beemage-demo/"
  let b = import.meta.env.BASE_URL || "/";
  if (!b.endsWith("/")) b += "/";
  return b;
}

function joinBase(base: string, rel: string): string {
  // base ends with "/", rel may start with "/"
  rel = rel.replace(/^\/+/, "");
  return base + rel;
}

function ensureCss(href: string) {
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

async function boot() {
  const root = document.getElementById("beemage-demo-root");
  if (!root) throw new Error("Missing #beemage-demo-root");

  const base = getBasePath();

  // NOTE: "app" is a stable internal prefix emitted by vite.config.ts (panelAssetsPlugin).
  const cssUrl = joinBase(base, "app/panel.css");
  const htmlUrl = joinBase(base, "app/panel.html");

  ensureCss(cssUrl);

  const r = await fetch(htmlUrl);
  if (!r.ok) throw new Error(`Failed to fetch ${htmlUrl}: ${r.status} ${r.statusText}`);
  const html = await r.text();

  root.innerHTML = html;

  // Boot the real panel entrypoint (extension panel code)
  await import("../../../src/panel/panel"); // no .ts
}

boot().catch((e) => {
  document.body.innerHTML = `<pre style="white-space:pre-wrap">${String((e as any)?.stack || e)}</pre>`;
});
