import { getCacheState } from "./get-cache-state";
import { isExpired } from "./is-expired";
import { keys } from "./keys";
import type { AnyFunction, Cached } from "./types";

export function prune<TApi extends object>(api: Cached<TApi>): void {
  const state = getCacheState(api);

  for (const fnName of keys(state.origApi)) {
    const settings = state.overrides[fnName as keyof TApi] ?? state.settings;
    if (typeof settings.ttl !== "number") {
      continue;
    }

    const fn = state.origApi[fnName];
    if (!(fn instanceof Function)) {
      continue;
    }

    const fnCache = state.cache.get(fn as AnyFunction);
    if (!fnCache) {
      continue;
    }

    for (const [key, value] of fnCache.entries()) {
      if (isExpired(value, settings)) {
        fnCache.delete(key);
      }
    }
  }
}
