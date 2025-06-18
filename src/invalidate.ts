import { defaultGetCacheKey } from "./cache-key";
import { type AnyFunction, type Cached, cachedSymbol } from "./types";

export function invalidate<TApi extends object>(api: Cached<TApi>): void;
export function invalidate<TApi extends object, TKey extends keyof TApi>(
  api: Cached<TApi>,
  key: TKey,
): void;
export function invalidate<TApi extends object, TKey extends keyof TApi>(
  api: Cached<TApi>,
  key: TKey,
  // biome-ignore lint/suspicious/noExplicitAny: We don't care about the return value
  ...args: TApi[TKey] extends (...args: infer TArgs) => any ? TArgs : never
): void;
export function invalidate<TApi extends object, TKey extends keyof TApi>(
  api: Cached<TApi>,
  key?: TKey,
  // biome-ignore lint/suspicious/noExplicitAny: We don't care about the return value
  ...args: TApi[TKey] extends (...args: infer TArgs) => any ? TArgs : never
): void {
  const state = api[cachedSymbol];

  if (typeof key === "undefined") {
    state.cache.clear();
    return;
  }

  const fn = state.origApi[key];
  if (!(fn instanceof Function)) {
    return;
  }

  const fnCache = state.cache.get(fn as AnyFunction);
  if (!fnCache) {
    return;
  }

  if (args.length === 0) {
    fnCache.clear();
  }

  const cacheKey = state.getCacheKey(key, args) ?? defaultGetCacheKey(key, args);
  fnCache.delete(cacheKey);
}
