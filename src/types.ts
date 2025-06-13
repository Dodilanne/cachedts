export const cachedSymbol = Symbol("cached");

export type Cached<TApi> = TApi & { [cachedSymbol]: true };

// biome-ignore lint/suspicious/noExplicitAny: It's any function
export type AnyFunction<T = any> = (...args: any[]) => T;
