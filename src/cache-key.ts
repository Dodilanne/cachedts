export const defaultCacheKeySymbol = Symbol("default");

export type GetCacheKey = (
  fnName: string | number | symbol,
  args: unknown[],
) => string | symbol | undefined;

/** Recursively loops through arguments to build a dash separated key. */
export const defaultGetCacheKey = ((
  fnName: string | number | symbol,
  args: unknown[],
): string | symbol => {
  if (args.length === 0) {
    return defaultCacheKeySymbol;
  }
  return args
    .map((arg) => {
      if (Array.isArray(arg)) {
        return defaultGetCacheKey(fnName, arg);
      }
      if (typeof arg === "object") {
        return JSON.stringify(arg);
      }
      return String(arg);
    })
    .join("-");
}) satisfies GetCacheKey;
