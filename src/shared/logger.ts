// src/shared/logger.ts

// do not call directly
// Panel logger: prints to the panel page console, reads panel devConfig store
// from panel  call please : from /panel/app/log 

//  Background logger: prints to the service worker console, reads background devConfig store (or the same shared store if you unify)
// from background call please : from /background/util/log 

import * as debugTrace from "./debugTrace";

function prefix(level: string) {
  return `[BCT][${level}]`;
}

export function createLogger(opts: {
  scope: "background" | "panel" | "colors" | "contour" | "settings"  | "logs" | "ui";
  traceOn: () => boolean; // reads the right dev config snapshot for that runtime
}) {
  function logTrace(...args: any[]) {
    if (!opts.traceOn()) return;
    console.log(prefix("trace"), ...args);
  }

  function logWarn(...args: any[]) {
    console.warn(prefix("warn"), ...args);
  }

  function logError(...args: any[]) {
    console.error(prefix("error"), ...args);
  }

  function traceScope(message: string, meta?: Record<string, unknown>) {
    logTrace(message, meta);
    void debugTrace.append({
      scope: opts.scope,
      kind: "debug",
      message,
      meta,
    });
  }

  return { logTrace, logWarn, logError, traceScope };
}
