import { defaultGetCacheKey, type GetCacheKey } from "./cache-key";
import { type AnyFunction, type Cached, type CacheState, cacheStateKey } from "./types";

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
        const existing = definedOpts.cache.get(value as AnyFunction)?.get(cacheKey);
        if (existing && !isExpired(existing, settings)) {
          if (definedOpts.debug) {
            console.log("[cache hit]", p, cacheKey);
          }
          return existing.value;
        }
        if (definedOpts.debug) {
          console.log("[cache miss]", p, cacheKey);
        }
        const res = value.apply(this === receiver ? target : this, args);
        const cacheRes: CacheResult = {
          value: res,
          cachedAt: Date.now(),
        };
        const fctCache = definedOpts.cache.get(value as AnyFunction);
        if (fctCache) {
          fctCache.set(cacheKey, cacheRes);
        } else {
          definedOpts.cache.set(value as AnyFunction, new Map([[cacheKey, cacheRes]]));
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
