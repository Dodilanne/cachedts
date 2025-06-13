import { type GetCacheKey, defaultGetCacheKey } from "./cache-key";
import { type AnyFunction, type Cached, cachedSymbol } from "./types";

export type CacheResult = {
  value: unknown;
  cachedAt: number;
};

export type Cache = Map<AnyFunction, Map<string | symbol, CacheResult>>;

export type Milliseconds = number;

export type CacheSettings = {
  enabled?: boolean;
  ttl?: Milliseconds;
};

export type CacheOptions<TApi extends object> = {
  cache?: Cache;
  debug?: boolean;
  settings?: CacheSettings;
  overrides?: Partial<Record<keyof TApi, CacheSettings>>;
  /** Customize the default cache key computation.
   * Falls back to the default behavior when `undefined` is returned.
   */
  getCacheKey?: GetCacheKey;
};

export function cached<TApi extends object>(api: TApi, opts?: CacheOptions<TApi>): Cached<TApi> {
  const cache: Cache = opts?.cache ?? new Map();
  return new Proxy(api, {
    get(target, p, receiver) {
      if (p === cachedSymbol) {
        return true;
      }

      const value = target[p as keyof typeof target];

      const settings: CacheSettings = opts?.overrides?.[p as keyof TApi] ?? opts?.settings ?? {};

      if (!(value instanceof Function)) {
        return Reflect.get(target, p, receiver);
      }

      if (settings.enabled === false) {
        if (opts?.debug) {
          console.log("[cache disabled]", p);
        }
        return Reflect.get(target, p, receiver);
      }

      return function (this: typeof receiver, ...args: unknown[]) {
        const cacheKey = opts?.getCacheKey?.(p, args) ?? defaultGetCacheKey(args);
        const existing = cache.get(value as AnyFunction)?.get(cacheKey);
        if (existing && !isExpired(existing, settings)) {
          if (opts?.debug) {
            console.log("[cache hit]", p, cacheKey);
          }
          return existing.value;
        }
        if (opts?.debug) {
          console.log("[cache miss]", p, cacheKey);
        }
        const res = value.apply(this === receiver ? target : this, args);
        const cacheRes: CacheResult = {
          value: res,
          cachedAt: Date.now(),
        };
        const fctCache = cache.get(value as AnyFunction);
        if (fctCache) {
          fctCache.set(cacheKey, cacheRes);
        } else {
          cache.set(value as AnyFunction, new Map([[cacheKey, cacheRes]]));
        }
        return res;
      };
    },
  }) as Cached<TApi>;
}

function isExpired(result: CacheResult, settings: CacheSettings): boolean {
  if (typeof settings.ttl !== "number") {
    return false;
  }
  return Date.now() > result.cachedAt + settings.ttl;
}
