// demo/src/mocks/runtime.ts
import type { AnyEvent } from "../../../src/shared/messages";
import type { AnyRequest } from "../../../src/shared/messages/requests";

type RuntimeMessageHandler = (msg: AnyEvent) => void;
const listeners = new Set<RuntimeMessageHandler>();

export function emitEvent(ev: AnyEvent) {
  for (const h of Array.from(listeners)) h(ev);
}

export function runtimeOnMessageAdd(handler: RuntimeMessageHandler): void {
  listeners.add(handler);
}

export function runtimeOnMessageRemove(handler: RuntimeMessageHandler): void {
  listeners.delete(handler);
}

export async function runtimeSend<T = any>(_msg: AnyRequest): Promise<T> {
  // Generic demo: no background features
  return { ok: true } as T;
}
