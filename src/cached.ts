import { defaultGetCacheKey, type GetCacheKey } from "./cache-key";
import { isExpired } from "./is-expired";
import { type AnyFunction, type Cached, type CacheState, cacheStateKey } from "./types";

export type CacheResult = {
  value: unknown;
  cachedAt: number;
};

export type Cache = Map<AnyFunction, Map<string | symbol, CacheResult>>;

export type CacheSettings = {
  enabled?: boolean;
  /** Time to live in milliseconds */
  ttl?: number;
  /** Maximum number of items to keep in the cache per function */
  maxSize?: number;
};

export type CacheOptions<TApi extends object> = {
  cache?: Cache;
  debug?: boolean;
  settings?: CacheSettings;
  overrides?: {
    [fnName in keyof TApi]?: CacheSettings & {
      getCacheKey?: TApi[fnName] extends AnyFunction
        ? (...args: Parameters<TApi[fnName]>) => string | symbol | undefined
        : never;
    };
  };
  /** Customize the default cache key computation.
   * Falls back to the default behavior when `undefined` is returned.
   */
  getCacheKey?: GetCacheKey;
};

export function cached<TApi extends object>(api: TApi, opts?: CacheOptions<TApi>): Cached<TApi> {
  const definedOpts: Required<CacheOptions<TApi>> = {
    cache: opts?.cache ?? new Map(),
    debug: opts?.debug ?? false,
    settings: opts?.settings ?? {},
    overrides: opts?.overrides ?? {},
    getCacheKey: opts?.getCacheKey ?? defaultGetCacheKey,
  };

  const state: CacheState<TApi> = {
    ...definedOpts,
    origApi: api,
  };

  return new Proxy(api, {
    get(target, p, receiver) {
      if (p === cacheStateKey) {
        return state;
      }

      const value = target[p as keyof typeof target];

      const overrides = definedOpts.overrides[p as keyof TApi];

      const settings = overrides ?? definedOpts.settings;

      if (!(value instanceof Function)) {
        return Reflect.get(target, p, receiver);
      }

      if (settings.enabled === false) {
        if (definedOpts.debug) {
          console.log("[cache disabled]", p);
        }
        return Reflect.get(target, p, receiver);
      }

      return function (this: typeof receiver, ...args: unknown[]) {
        const cacheKey =
          // biome-ignore lint/suspicious/noExplicitAny: Args are unknown
          overrides?.getCacheKey?.(...(args as any)) ??
          definedOpts.getCacheKey(p, args) ??
          defaultGetCacheKey(p, args);

        let fnCache = definedOpts.cache.get(value as AnyFunction);
        if (!fnCache) {
          fnCache = new Map();
          definedOpts.cache.set(value as AnyFunction, fnCache);
        }

        let status: "hit" | "miss" | "expired" = "hit";

        let cacheRes = fnCache?.get(cacheKey);
        if (!cacheRes || isExpired(cacheRes, settings)) {
          status = cacheRes ? "expired" : "miss";
          const res = value.apply(this === receiver ? target : this, args);
          cacheRes = { value: res, cachedAt: Date.now() };
        }

        if (definedOpts.debug) {
          console.log(`[cache ${status}]`, p, cacheKey);
        }

        // LRU ordering
        // Can be skipped on cache hit if LRU eviction is disabled
        if (status !== "hit" || typeof settings.maxSize === "number") {
          fnCache.delete(cacheKey);
          fnCache.set(cacheKey, cacheRes);
        }

        if (
          status !== "hit" &&
          typeof settings.ttl === "number" &&
          typeof settings.maxSize !== "number"
        ) {
          for (const [key, value] of fnCache.entries()) {
            if (isExpired(value, settings)) {
              fnCache.delete(key);
            } else {
              // Without maxSize, map order matches expiration order (insertion order),
              // so we can break early at the first non-expired entry
              break;
            }
          }
        }

        if (typeof settings.maxSize === "number" && fnCache.size > settings.maxSize) {
          // Prune expired entries on miss to avoid evicting valid entries over expired ones
          if (status === "miss") {
            for (const [key, value] of fnCache.entries()) {
              if (isExpired(value, settings)) {
                fnCache.delete(key);
              }
            }
          }

          while (fnCache.size > settings.maxSize) {
            const first = fnCache.keys().next().value;
            if (first) {
              fnCache.delete(first);
            }
          }
        }

        return cacheRes.value;
      };
    },
  }) as Cached<TApi>;
}
