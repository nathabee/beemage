// src/panel/tabs/contour/tab.ts
import type { Dom } from "../../app/dom";
import type { Bus } from "../../app/bus";
import { withBusy } from "../../app/state";

export function createContourTab(dom: Dom, _bus: Bus) {
  let loadedImageName: string | null = null;
  let hasImage = false;

  function setStatus(text: string) {
    dom.contourStatusEl.textContent = text;
  }

  function setContourBusyVisual(busy: boolean, status?: string) {
    dom.contourSpinnerEl.classList.toggle("is-hidden", !busy);
    if (status) setStatus(status);
  }

  function updateEnabled() {
    // Do not touch "busy" here; global busy state.ts will disable during operations.
    dom.btnProcessEl.disabled = !hasImage;
    dom.btnDownloadEl.disabled = !hasImage;
  }

  function clearCanvases() {
    const sctx = dom.srcCanvasEl.getContext("2d")!;
    const octx = dom.outCanvasEl.getContext("2d")!;
    sctx.clearRect(0, 0, dom.srcCanvasEl.width, dom.srcCanvasEl.height);
    octx.clearRect(0, 0, dom.outCanvasEl.width, dom.outCanvasEl.height);
  }

  async function loadImageFromFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("Unsupported file type (please drop an image).");
      return;
    }

    await withBusy(dom, async () => {
      setContourBusyVisual(true, "Loading image…");

      loadedImageName = file.name || "image";
      const url = URL.createObjectURL(file);

      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image();
          im.onload = () => resolve(im);
          im.onerror = () => reject(new Error("Failed to load image"));
          im.src = url;
        });

        // Fit image into srcCanvas while preserving aspect ratio
        const canvas = dom.srcCanvasEl;
        const ctx = canvas.getContext("2d")!;
        clearCanvases();

        const maxW = canvas.width;
        const maxH = canvas.height;

        const scale = Math.min(maxW / img.width, maxH / img.height);
        const w = Math.max(1, Math.floor(img.width * scale));
        const h = Math.max(1, Math.floor(img.height * scale));
        const x = Math.floor((maxW - w) / 2);
        const y = Math.floor((maxH - h) / 2);

        ctx.drawImage(img, x, y, w, h);

        hasImage = true;
        updateEnabled();
        setStatus(`Loaded: ${loadedImageName}`);
      } finally {
        URL.revokeObjectURL(url);
        setContourBusyVisual(false);
      }
    });
  }

  function getNumber(el: HTMLInputElement, fallback: number) {
    const n = Number(el.value);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * Simple contour-ish extraction (pure JS): Sobel edges + threshold.
   * This is intentionally minimal. We will replace/upgrade with OpenCV.js later.
   */
  async function process() {
    if (!hasImage) return;

    await withBusy(dom, async () => {
      setContourBusyVisual(true, "Processing…");

      // Allow UI to repaint spinner before heavy work
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            const src = dom.srcCanvasEl;
            const out = dom.outCanvasEl;

            const sctx = src.getContext("2d")!;
            const octx = out.getContext("2d")!;

            const img = sctx.getImageData(0, 0, src.width, src.height);
            const { data, width, height } = img;

            // grayscale
            const gray = new Uint8ClampedArray(width * height);
            for (let i = 0, p = 0; i < data.length; i += 4, p++) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              gray[p] = (0.299 * r + 0.587 * g + 0.114 * b) | 0;
            }

            // Sobel
            const gxKernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
            const gyKernel = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

            const mag = new Uint8ClampedArray(width * height);
            const threshold = Math.max(1, Math.min(255, getNumber(dom.edgeThresholdEl, 70)));
            const whiteBg = dom.invertOutputEl.checked;

            for (let y = 1; y < height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                let gx = 0;
                let gy = 0;

                let k = 0;
                for (let j = -1; j <= 1; j++) {
                  for (let i = -1; i <= 1; i++) {
                    const v = gray[(y + j) * width + (x + i)];
                    gx += v * gxKernel[k];
                    gy += v * gyKernel[k];
                    k++;
                  }
                }

                const m = Math.min(255, Math.sqrt(gx * gx + gy * gy) | 0);
                mag[y * width + x] = m >= threshold ? 255 : 0;
              }
            }

            // Write output
            const outImg = octx.createImageData(width, height);
            const outData = outImg.data;

            for (let p = 0, i = 0; p < mag.length; p++, i += 4) {
              const v = mag[p]; // 0 or 255
              if (whiteBg) {
                // black edges on white background
                const isEdge = v === 255;
                outData[i] = isEdge ? 0 : 255;
                outData[i + 1] = isEdge ? 0 : 255;
                outData[i + 2] = isEdge ? 0 : 255;
                outData[i + 3] = 255;
              } else {
                // white edges on black background
                outData[i] = v;
                outData[i + 1] = v;
                outData[i + 2] = v;
                outData[i + 3] = 255;
              }
            }

            // Ensure out canvas matches src dims
            out.width = src.width;
            out.height = src.height;
            octx.putImageData(outImg, 0, 0);

            setStatus("Done. You can download the PNG.");
          } finally {
            resolve();
          }
        }, 0);
      });

      setContourBusyVisual(false);
      updateEnabled();
    });
  }

  function downloadPng() {
    if (!hasImage) return;

    const nameBase = (loadedImageName || "beecontour")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9-_]+/gi, "_");

    const filename = `${nameBase}_contour.png`;
    const url = dom.outCanvasEl.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setStatus(`Downloaded: ${filename}`);
  }

  function bindDragDrop() {
    const dz = dom.dropZoneEl;

    function setHover(on: boolean) {
      dz.classList.toggle("is-hover", on);
    }

    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      setHover(true);
    });

    dz.addEventListener("dragleave", () => setHover(false));

    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      setHover(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      void loadImageFromFile(files[0]);
    });

    dom.fileInputEl.addEventListener("change", () => {
      const f = dom.fileInputEl.files?.[0];
      if (!f) return;
      void loadImageFromFile(f);
      // allow re-uploading same file
      dom.fileInputEl.value = "";
    });
  }

  function bind() {
    bindDragDrop();

    dom.btnProcessEl.addEventListener("click", () => void process());
    dom.btnDownloadEl.addEventListener("click", () => downloadPng());

    // initial UI (no image)
    hasImage = false;
    updateEnabled();
    setStatus("No image loaded");
    dom.contourSpinnerEl.classList.add("is-hidden");
  }

  function mount() {
    // no-op for now
  }

  function unmount() {
    // no-op for now
  }

  return {
    id: "contour" as const,
    bind,
    mount,
    unmount,
  };
}
