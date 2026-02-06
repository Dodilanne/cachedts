# `cachedts` – Simple Function-Level Caching for TypeScript APIs

`cachedts` is a lightweight utility for function-level memoization of object methods in TypeScript.
It wraps an object and automatically caches the results of its functions based on input arguments.

Perfect for avoiding repeated computations, expensive API calls, or just improving performance with minimal setup.

---

## Features

- Zero-dependency
- Memoizes function results by arguments
- Optional TTL-based expiration
- LRU cache eviction with configurable `maxSize`
- Per-function or global settings
- Debug logging
- Custom cache key generation

---

## Quick Start

```ts
import { cached } from "cachedts";

const mathApi = {
  slowSquare(x: number) {
    console.log("Calculating...");
    return x * x;
  },
};

const cachedMath = cached(mathApi);

cachedMath.slowSquare(5); // logs "Calculating..." and returns 25
cachedMath.slowSquare(5); // returns 25 instantly (from cache)
```

---

## Options

```ts
const cachedApi = cached(apiObject, {
  debug: true, // Log cache hits/misses
  settings: {
    enabled: true,
    ttl: 5000, // Cache expires after 5 seconds
    maxSize: 100, // Keep at most 100 entries per function (LRU eviction)
  },
  overrides: {
    // Per-method override
    expensiveMethod: { ttl: 10000 },
  },
  getCacheKey(methodName, args) {
    return `${methodName}-${JSON.stringify(args)}`;
  },
});
```

| Option        | Type                                        | Description                                       |
|---------------|---------------------------------------------|---------------------------------------------------|
| `cache`       | `Map`                                       | Provide a shared cache instance                   |
| `debug`       | `boolean`                                   | Enable logging for cache hits/misses              |
| `settings`    | `{ enabled?: boolean; ttl?: number; maxSize?: number; pruneOnMiss?: boolean }` | Global cache settings           |
| `overrides`   | `Partial<Record<keyof TApi, CacheSettings>>`| Per-method cache control                          |
| `getCacheKey` | `(methodName, args) => string \| symbol`    | Custom key generator for cache entries            |

---

## Example with TTL

```ts
const api = {
  greet(name: string) {
    return `Hello, ${name}`;
  },
};

const cachedApi = cached(api, {
  settings: { ttl: 1000 },
});

cachedApi.greet("Alice"); // cache miss
setTimeout(() => {
  cachedApi.greet("Alice"); // cache hit
}, 500);

setTimeout(() => {
  cachedApi.greet("Alice"); // cache expired, miss
}, 1500);
```

---

## LRU Cache Eviction

Limit the number of cached entries per function with `maxSize`. When the limit is exceeded, the least recently used entry is evicted.

```ts
const cachedApi = cached(api, {
  settings: { maxSize: 2 },
});

cachedApi.greet("Alice"); // cached
cachedApi.greet("Bob");   // cached
cachedApi.greet("Eve");   // cached, "Alice" evicted (least recently used)
```

`maxSize` can be combined with `ttl` and set per-method via `overrides`.

---

## Pruning Expired Entries

Expired entries are lazily evicted when their key is accessed again. For proactive cleanup, use `prune()` to sweep all expired entries at once, or enable `pruneOnMiss` to sweep a function's cache on every cache miss.

When both `ttl` and `maxSize` are set, pruning on miss is **forced automatically**. Without it, LRU eviction may evict valid entries while expired ones still occupy slots.

### Manual pruning

```ts
import { cached, prune } from "cachedts";

const cachedApi = cached(api, { settings: { ttl: 5000 } });

// Remove all expired entries across all functions
prune(cachedApi);
```

### Automatic pruning on miss

```ts
const cachedApi = cached(api, {
  settings: { ttl: 5000, pruneOnMiss: true },
});

// Only cache misses trigger a sweep of expired entries
cachedApi.getData("key");
```

`pruneOnMiss` only sweeps the cache of the function being called, not all functions. Both options respect per-function TTL overrides.

---

## Cache Invalidation

You can clear cached results using the `invalidate` function. It allows three levels of granularity:

### Invalidate the entire cache

```ts
import { invalidate } from "cachedts";

invalidate(cachedApi); // Clears all cached entries for all methods
```

### Invalidate a specific method's cache

```ts
invalidate(cachedApi, "getParams"); // Clears all cache entries for `getParams`
```

### Invalidate a specific method call with given arguments

```ts
invalidate(cachedApi, "getParams", "user123", 42); // Clears cache entry for `getParams("user123", 42)`
```

This is useful when the underlying data changes and a fresh fetch is needed for specific arguments.

### Notes

- No effect is applied if the method is not a function or has no cached entries.
- Cache key computation uses the same mechanism as the one used by `cached()`, including custom `getCacheKey` if provided.

---

## Advanced Usage: Custom Cache Key

By default, cache keys are generated based on the function name and serialized arguments.

To customize:

```ts
const cachedApi = cached(api, {
  getCacheKey(methodName, args) {
    if (methodName === "fetchUser") {
      return args[0]; // Use user ID directly
    }
  },
});
```

---

## Accessing Cache Internals

You can introspect the wrapped object via the `cacheStateKey`:

```ts
import { cacheStateKey } from "cachedts";

const state = cachedApi[cacheStateKey];
console.log(state.cache); // underlying Map
```

Or by using the `getCacheState` function:

```ts
import { getCacheState } from "cachedts";

const state = getCacheState(cachedApi);
console.log(state.cache); // nderlying Map
```

---

## Disabling Caching

Disable globally or per-method:

```ts
cached(api, {
  settings: { enabled: false }, // globally off
  overrides: {
    compute: { enabled: true }, // override for `compute` method
  },
});
```

---

## Installation

```bash
npm install cachedts
```

---

## License

MIT
