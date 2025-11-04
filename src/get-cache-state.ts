import { type Cached, type CacheState, cachedSymbol } from "./types";

export function getCacheState<TApi extends object>(cache: Cached<TApi>): CacheState<TApi> {
  return cache[cachedSymbol];
}
