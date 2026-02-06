import type { CacheResult, CacheSettings } from "./cached";

export function isExpired(result: CacheResult, settings: CacheSettings): boolean {
  if (typeof settings.ttl !== "number") {
    return false;
  }
  return Date.now() > result.cachedAt + settings.ttl;
}
