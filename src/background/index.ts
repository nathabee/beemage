// src/background/index.ts
import { MSG, type AnyRequest } from "../shared/messages";
import { logTrace, logWarn, logError } from "./util/log";

/**
 * Generic background:
 * - Configure side panel behavior (optional, safe)
 * - Handle minimal messages (PING)
 * - Everything else is intentionally NOT implemented in the template
 */

function safeSend(sendResponse: (x: any) => void, payload: any) {
  try {
    sendResponse(payload);
  } catch {
    // ignore: sendResponse may be closed
  }
}

/* -----------------------------------------------------------
 * Side panel behavior
 * ----------------------------------------------------------- */
try {
  chrome.runtime.onInstalled.addListener(() => {
    // Safe: sidePanel may not exist in some Chromium variants
    chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(() => {});
  });
} catch {
  // ignore: background should never crash on load
}

/* -----------------------------------------------------------
 * Message handler
 * ----------------------------------------------------------- */
try {
  chrome.runtime.onMessage.addListener((msg: AnyRequest, _sender, sendResponse) => {
    (async () => {
      try {
        if (msg?.type === MSG.PING) {
          safeSend(sendResponse, { ok: true });
          return;
        }

        // Template intentionally does not implement any other message handlers.
        // When you add a real feature, add a new MSG.* case here.
        logWarn("Unknown message (template)", { msgType: (msg as any)?.type });
        safeSend(sendResponse, { ok: false, error: "Unknown message." });
      } catch (e: any) {
        logError("background handler crashed", {
          error: e?.message || String(e),
          msgType: (msg as any)?.type,
        });
        safeSend(sendResponse, { ok: false, error: "Background handler crashed." });
      }
    })();

    // async response
    return true;
  });

  logTrace("background booted", {});
} catch (e: any) {
  // If this throws, something is fundamentally wrong (but we still avoid hard crash loops)
  logError("background failed to initialize", { error: e?.message || String(e) });
}
