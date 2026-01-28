// src/panel/app/dom.ts
export type Dom = ReturnType<typeof getDom>;

export function getDom() {
  function must<T extends Element>(el: T | null, id: string): T {
    if (!el) throw new Error(`[dom] Missing #${id}`);
    return el;
  }

  // Root
  const rootEl = must(document.getElementById("appRoot") as HTMLDivElement | null, "appRoot");

  // -----------------------------
  // Tabs + views
  // -----------------------------
  const tabContour = must(document.getElementById("tabContour") as HTMLButtonElement | null, "tabContour");
  const tabColors = must(document.getElementById("tabColors") as HTMLButtonElement | null, "tabColors");
  const tabSettings = must(document.getElementById("tabSettings") as HTMLButtonElement | null, "tabSettings");
  const tabLogs = must(document.getElementById("tabLogs") as HTMLButtonElement | null, "tabLogs");
  const tabSegmentation = must(document.getElementById("tabSegmentation") as HTMLButtonElement | null, "tabSegmentation");

  const viewContour = must(document.getElementById("viewContour") as HTMLElement | null, "viewContour");
  const viewColors = must(document.getElementById("viewColors") as HTMLElement | null, "viewColors");
  const viewSettings = must(document.getElementById("viewSettings") as HTMLElement | null, "viewSettings");
  const viewLogs = must(document.getElementById("viewLogs") as HTMLElement | null, "viewLogs");
  const viewSegmentation = must(document.getElementById("viewSegmentation") as HTMLElement | null, "viewSegmentation");


  // -----------------------------
  // Contour tab
  // -----------------------------
  const dropZoneEl = must(document.getElementById("dropZone") as HTMLDivElement | null, "dropZone");
  const fileInputEl = must(document.getElementById("fileInput") as HTMLInputElement | null, "fileInput");
  const btnProcessEl = must(document.getElementById("btnProcess") as HTMLButtonElement | null, "btnProcess");
  const btnCleanEl = must(document.getElementById("btnClean") as HTMLButtonElement | null, "btnClean");
  const btnDownloadEl = must(document.getElementById("btnDownload") as HTMLButtonElement | null, "btnDownload");

  const contourStatusEl = must(document.getElementById("contourStatus") as HTMLSpanElement | null, "contourStatus");
  const contourSpinnerEl = must(document.getElementById("contourSpinner") as HTMLSpanElement | null, "contourSpinner");

  const srcCanvasEl = must(document.getElementById("srcCanvas") as HTMLCanvasElement | null, "srcCanvas");
  const outCanvasEl = must(document.getElementById("outCanvas") as HTMLCanvasElement | null, "outCanvas");
  const clean1CanvasEl = must(document.getElementById("clean1Canvas") as HTMLCanvasElement | null, "clean1Canvas");
  const clean2CanvasEl = must(document.getElementById("clean2Canvas") as HTMLCanvasElement | null, "clean2Canvas");

  const edgeThresholdEl = must(document.getElementById("edgeThreshold") as HTMLInputElement | null, "edgeThreshold");
  const invertOutputEl = must(document.getElementById("invertOutput") as HTMLInputElement | null, "invertOutput");

  const cleanMinAreaEl = must(document.getElementById("cleanMinArea") as HTMLInputElement | null, "cleanMinArea");
  const cleanRadiusEl = must(document.getElementById("cleanRadius") as HTMLInputElement | null, "cleanRadius");
  const cleanBinaryThresholdEl = must(
    document.getElementById("cleanBinaryThreshold") as HTMLInputElement | null,
    "cleanBinaryThreshold"
  );

  const cleanQualityBadgeEl = must(document.getElementById("cleanQualityBadge") as HTMLSpanElement | null, "cleanQualityBadge");
  const cleanQualityFillEl = must(document.getElementById("cleanQualityFill") as HTMLDivElement | null, "cleanQualityFill");
  const cleanQualityTextEl = must(document.getElementById("cleanQualityText") as HTMLSpanElement | null, "cleanQualityText");

  const contourScaleEl = must(document.getElementById("contourScale") as HTMLInputElement | null, "contourScale");


  const btnVectorizeEl = must(document.getElementById("btnVectorize") as HTMLButtonElement | null, "btnVectorize");
  const btnDownloadSvgEl = must(document.getElementById("btnDownloadSvg") as HTMLButtonElement | null, "btnDownloadSvg");

  const svgPreviewImgEl = must(document.getElementById("svgPreviewImg") as HTMLImageElement | null, "svgPreviewImg");
  const svgPreviewTextEl = must(document.getElementById("svgPreviewText") as HTMLPreElement | null, "svgPreviewText");
  const pathSmoothItersEl = must(
    document.getElementById("pathSmoothIters") as HTMLInputElement | null,
    "pathSmoothIters"
  );

  // -----------------------------
  // Segmentation tab 
  // ----------------------------- 


  // -----------------------------
  // Colors tab
  // -----------------------------

  const colorsCanvasEl = must(document.getElementById("colorsCanvas") as HTMLCanvasElement | null, "colorsCanvas");

  const paletteEl = must(document.getElementById("palette") as HTMLDivElement | null, "palette");

  const btnColorsApplyEl = must(
    document.getElementById("btnColorsApply") as HTMLButtonElement | null,
    "btnColorsApply"
  );
  const btnColorsCancelEl = must(
    document.getElementById("btnColorsCancel") as HTMLButtonElement | null,
    "btnColorsCancel"
  );
  const btnColorsResetEl = must(
    document.getElementById("btnColorsReset") as HTMLButtonElement | null,
    "btnColorsReset"
  );

  const edgesDarkEl = must(document.getElementById("edgesDark") as HTMLInputElement | null, "edgesDark");
  const edgeMaskThresholdEl = must(
    document.getElementById("edgeMaskThreshold") as HTMLInputElement | null,
    "edgeMaskThreshold"
  );
  const edgeDilateEl = must(document.getElementById("edgeDilate") as HTMLInputElement | null, "edgeDilate");
  const maxRegionPxEl = must(document.getElementById("maxRegionPx") as HTMLInputElement | null, "maxRegionPx");
  const colorsStatusEl = must(document.getElementById("colorsStatus") as HTMLSpanElement | null, "colorsStatus");

  // -----------------------------
  // Settings
  // -----------------------------
  const cfgShowDevToolsEl = must(
    document.getElementById("cfgShowDevTools") as HTMLInputElement | null,
    "cfgShowDevTools"
  );
  const settingsGeneralStatusEl = must(
    document.getElementById("settingsGeneralStatus") as HTMLElement | null,
    "settingsGeneralStatus"
  );

  const devConfigDetailsEl = must(
    document.getElementById("devConfigDetails") as HTMLDetailsElement | null,
    "devConfigDetails"
  );

  const cfgTraceConsoleEl = must(
    document.getElementById("cfgTraceConsole") as HTMLInputElement | null,
    "cfgTraceConsole"
  );

  const cfgActionLogMaxEl = must(
    document.getElementById("cfgActionLogMax") as HTMLInputElement | null,
    "cfgActionLogMax"
  );
  const cfgDebugTraceMaxEl = must(
    document.getElementById("cfgDebugTraceMax") as HTMLInputElement | null,
    "cfgDebugTraceMax"
  );
  const cfgFailureLogsPerRunEl = must(
    document.getElementById("cfgFailureLogsPerRun") as HTMLInputElement | null,
    "cfgFailureLogsPerRun"
  );

  const logsCbDebugEl = must(document.getElementById("logsCbDebug") as HTMLInputElement | null, "logsCbDebug");

  const btnCfgResetDefaults = must(
    document.getElementById("btnCfgResetDefaults") as HTMLButtonElement | null,
    "btnCfgResetDefaults"
  );
  const cfgStatusEl = must(document.getElementById("cfgStatus") as HTMLElement | null, "cfgStatus");

   // Engine (OpenCV probe) — now in Settings
 
  const cfgOpenCvSpinner = must(
    document.getElementById("cfgOpenCvSpinner") as HTMLSpanElement | null,
    "cfgOpenCvSpinner",
  );
  const cfgOpenCvStatus = must(
    document.getElementById("cfgOpenCvStatus") as HTMLSpanElement | null,
    "cfgOpenCvStatus",
  );
  const cfgOpenCvReport = must(
    document.getElementById("cfgOpenCvReport") as HTMLPreElement | null,
    "cfgOpenCvReport",
  );

  const settingsEngineBoxEl = must(
  document.getElementById("settingsEngineBox") as HTMLDetailsElement | null,
  "settingsEngineBox",
);

const cfgUseOpenCvEl = must(
  document.getElementById("cfgUseOpenCv") as HTMLInputElement | null,
  "cfgUseOpenCv",
);


  // About
  const settingsVersionEl = must(document.getElementById("settingsVersion") as HTMLElement | null, "settingsVersion");
  const settingsGitHubLinkEl = must(
    document.getElementById("settingsGitHubLink") as HTMLAnchorElement | null,
    "settingsGitHubLink"
  );

  // -----------------------------
  // Logs (audit)
  // -----------------------------
  const logsLimitEl = must(document.getElementById("logsLimit") as HTMLInputElement | null, "logsLimit");
  const btnLogsRefresh = must(document.getElementById("btnLogsRefresh") as HTMLButtonElement | null, "btnLogsRefresh");
  const logsStatusEl = must(document.getElementById("logsStatus") as HTMLSpanElement | null, "logsStatus");

  const logsTrimKeepEl = must(document.getElementById("logsTrimKeep") as HTMLInputElement | null, "logsTrimKeep");
  const btnLogsTrim = must(document.getElementById("btnLogsTrim") as HTMLButtonElement | null, "btnLogsTrim");
  const btnLogsExport = must(document.getElementById("btnLogsExport") as HTMLButtonElement | null, "btnLogsExport");
  const btnLogsClear = must(document.getElementById("btnLogsClear") as HTMLButtonElement | null, "btnLogsClear");

  const logsOutEl = must(document.getElementById("logsOut") as HTMLPreElement | null, "logsOut");

  // -----------------------------
  // Debug trace (shown in Logs view)
  // -----------------------------
  const debugLimitEl = must(document.getElementById("debugLimit") as HTMLInputElement | null, "debugLimit");
  const btnDebugRefresh = must(document.getElementById("btnDebugRefresh") as HTMLButtonElement | null, "btnDebugRefresh");
  const btnDebugExport = must(document.getElementById("btnDebugExport") as HTMLButtonElement | null, "btnDebugExport");
  const btnDebugClear = must(document.getElementById("btnDebugClear") as HTMLButtonElement | null, "btnDebugClear");
  const debugStatusEl = must(document.getElementById("debugStatus") as HTMLSpanElement | null, "debugStatus");
  const debugOutEl = must(document.getElementById("debugOut") as HTMLPreElement | null, "debugOut");

  return {
    rootEl,

    // Tabs + views
    tabContour,
    tabColors,
    tabSettings,
    tabLogs,
    tabSegmentation,


    viewContour,
    viewSegmentation,
    viewColors,
    viewSettings,
    viewLogs,

    // Contour
    dropZoneEl,
    fileInputEl,
    btnProcessEl,
    btnCleanEl,
    btnDownloadEl,
    contourStatusEl,
    contourSpinnerEl,
    srcCanvasEl,
    outCanvasEl,
    clean1CanvasEl,
    clean2CanvasEl,
    edgeThresholdEl,
    invertOutputEl,

    cleanMinAreaEl,
    cleanRadiusEl,
    cleanBinaryThresholdEl,
    cleanQualityBadgeEl,
    cleanQualityFillEl,
    cleanQualityTextEl,
    btnVectorizeEl,
    btnDownloadSvgEl,
    svgPreviewImgEl,
    svgPreviewTextEl,

    contourScaleEl,
    pathSmoothItersEl,

    // Segmentation  


    // Colors 
    colorsCanvasEl,
    paletteEl,
    btnColorsApplyEl,
    btnColorsCancelEl,
    btnColorsResetEl,
    edgesDarkEl,
    edgeMaskThresholdEl,
    edgeDilateEl,
    maxRegionPxEl,
    colorsStatusEl,

    // Settings
    cfgShowDevToolsEl,
    settingsGeneralStatusEl,
    devConfigDetailsEl,
    cfgTraceConsoleEl,
    cfgActionLogMaxEl,
    cfgDebugTraceMaxEl,
    cfgFailureLogsPerRunEl,
    logsCbDebugEl,
    btnCfgResetDefaults,
    cfgStatusEl,
    settingsVersionEl,
    settingsGitHubLinkEl,

    // Settings engine (OpenCV probe) 
    cfgOpenCvSpinner,
    cfgOpenCvStatus,
    cfgOpenCvReport,
    settingsEngineBoxEl,
    cfgUseOpenCvEl,


    // Logs (audit)
    logsLimitEl,
    btnLogsRefresh,
    logsStatusEl,
    logsTrimKeepEl,
    btnLogsTrim,
    btnLogsExport,
    btnLogsClear,
    logsOutEl,

    // Debug trace
    debugLimitEl,
    btnDebugRefresh,
    btnDebugExport,
    btnDebugClear,
    debugStatusEl,
    debugOutEl,
  };
}
