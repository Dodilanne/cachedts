export const defaultCacheKey = "__CACHEDTS__default_cache_key";

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
    return defaultCacheKey;
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
