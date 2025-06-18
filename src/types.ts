import type { CacheOptions } from "./cached";

export const cachedSymbol = Symbol("cached");

export type CacheState<TApi extends object> = Required<CacheOptions<TApi> & { origApi: TApi }>;

export type Cached<TApi extends object> = TApi & {
  [cachedSymbol]: CacheState<TApi>;
};

// biome-ignore lint/suspicious/noExplicitAny: It's any function
export type AnyFunction<T = any> = (...args: any[]) => T;
