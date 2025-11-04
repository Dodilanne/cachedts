import { type Cached, type CacheState, cacheStateKey } from "./types";

export function getCacheState<TApi extends object>(cache: Cached<TApi>): CacheState<TApi> {
  return cache[cacheStateKey];
}
