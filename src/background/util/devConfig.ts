// src/background/util/devConfig.ts
export {
  ensureDevConfigLoaded,
  getDevConfigSnapshot,
  setDevConfig,
  resetDevConfigDefaults,
  DEV_CONFIG_DEFAULTS,
} from "../../shared/devConfigStore";

export type { DevConfig } from "../../shared/devConfigStore";
