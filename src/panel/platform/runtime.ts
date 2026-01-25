// src/panel/platform/runtime.ts

import type { AnyRequest } from "../../shared/messages/requests";

/**
 * Panel runtime wrapper.
 * - runtimeSend: panel -> background requests (typed)
 * - runtimeOnMessage*: background -> panel events (generic template: unknown)
 */

export type RuntimeMessageHandler = (msg: unknown) => void;

export function runtimeSend<T = any>(msg: AnyRequest): Promise<T> {
  return chrome.runtime.sendMessage(msg) as Promise<T>;
}

// Keep a stable mapping so remove() works even if we wrap handlers.
const handlerMap = new Map<RuntimeMessageHandler, (message: any, sender: any, sendResponse: any) => void>();

export function runtimeOnMessageAdd(handler: RuntimeMessageHandler): void {
  const wrapped = (message: any, _sender: any, _sendResponse: any) => {
    handler(message);
  };
  handlerMap.set(handler, wrapped);
  chrome.runtime.onMessage.addListener(wrapped);
}

export function runtimeOnMessageRemove(handler: RuntimeMessageHandler): void {
  const wrapped = handlerMap.get(handler);
  if (!wrapped) return;
  chrome.runtime.onMessage.removeListener(wrapped);
  handlerMap.delete(handler);
}
