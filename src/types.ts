import type { CacheOptions } from "./cached";

export const cacheStateKey = "__CACHEDTS__state";

export type CacheState<TApi extends object> = Required<CacheOptions<TApi> & { origApi: TApi }>;

export type Cached<TApi extends object> = TApi & {
  [cacheStateKey]: CacheState<TApi>;
};

// biome-ignore lint/suspicious/noExplicitAny: It's any function
export type AnyFunction<T = any> = (...args: any[]) => T;
