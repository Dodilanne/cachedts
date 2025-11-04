import { expect, test, vi } from "vitest";
import { type CacheOptions, cached, cacheStateKey } from "../src";

test("simple caching", async () => {
  const api = {
    getParams: () => ({ async: false }),
    getParamsAsync: vi.fn(async () => {
      return { async: true };
    }),
  };
  const cachedApi = cached(api);
  expect(cachedApi[cacheStateKey]).toBeDefined();
  const [first, ...results] = await Promise.all([
    cachedApi.getParamsAsync(),
    cachedApi.getParamsAsync(),
  ]);
  expect(api.getParamsAsync).toHaveBeenCalledOnce();
  expect(first).toStrictEqual({ async: true });
  for (const r of results) {
    expect(r).toBe(first);
  }
});

test("caching with params", async () => {
  const api = {
    getName: vi.fn(async (id: number) => {
      if (id === 1) return "first";
      return "some guy";
    }),
  };
  const cachedApi = cached(api);
  expect(cachedApi[cacheStateKey]).toBeDefined();
  const results = await Promise.all([
    cachedApi.getName(1),
    cachedApi.getName(2),
    cachedApi.getName(1),
    cachedApi.getName(2),
  ]);
  expect(api.getName).toHaveBeenCalledTimes(2);
  expect(results.at(0)).toBe("first");
  expect(results.at(1)).toBe("some guy");
  expect(results.at(2)).toBe("first");
  expect(results.at(3)).toBe("some guy");
});

test("caching with object params", async () => {
  const api = {
    getName: vi.fn(async (id: number, opts?: { secret: string }) => {
      if (opts) return opts.secret;
      if (id === 1) return "first";
      return "some guy";
    }),
  };
  const cachedApi = cached(api);
  expect(cachedApi[cacheStateKey]).toBeDefined();
  const results = await Promise.all([
    cachedApi.getName(1, { secret: "override" }),
    cachedApi.getName(2),
    cachedApi.getName(1),
    cachedApi.getName(2),
  ]);
  expect(api.getName).toHaveBeenCalledTimes(3);
  expect(results.at(0)).toBe("override");
  expect(results.at(1)).toBe("some guy");
  expect(results.at(2)).toBe("first");
  expect(results.at(3)).toBe("some guy");
});

test("caching disabled", async () => {
  const api = {
    getParams: () => ({ async: false }),
    getParamsAsync: vi.fn(async () => {
      return { async: true };
    }),
  };
  const opts: CacheOptions<typeof api> = {
    settings: { enabled: false },
  };
  const cachedApi = cached(api, opts);
  expect(cachedApi[cacheStateKey]).toMatchObject(opts);
  const [first, ...results] = await Promise.all([
    cachedApi.getParamsAsync(),
    cachedApi.getParamsAsync(),
  ]);
  expect(api.getParamsAsync).toHaveBeenCalledTimes(2);
  expect(first).toStrictEqual({ async: true });
  for (const r of results) {
    expect(r).toStrictEqual(first);
    expect(r).not.toBe(first);
  }
});

test("caching with ttl", async () => {
  vi.useFakeTimers();
  const api = {
    getParams: () => ({ async: false }),
    getParamsAsync: vi.fn(async () => {
      return { async: true };
    }),
  };
  const ttl = 2000;
  const opts: CacheOptions<typeof api> = {
    settings: { ttl },
  };
  const cachedApi = cached(api, opts);
  expect(cachedApi[cacheStateKey]).toMatchObject(opts);
  const [first, ...results] = await Promise.all([
    cachedApi.getParamsAsync(),
    cachedApi.getParamsAsync(),
  ]);
  expect(api.getParamsAsync).toHaveBeenCalledOnce();
  expect(first).toStrictEqual({ async: true });
  for (const r of results) {
    expect(r).toBe(first);
  }
  vi.advanceTimersByTime(ttl + 1);
  const [newFirst, ...newResults] = await Promise.all([
    cachedApi.getParamsAsync(),
    cachedApi.getParamsAsync(),
  ]);
  expect(api.getParamsAsync).toHaveBeenCalledTimes(2);
  expect(newFirst).toStrictEqual({ async: true });
  expect(newFirst).not.toBe(first);
  for (const r of newResults) {
    expect(r).not.toBe(first);
    expect(r).toBe(newFirst);
  }
  vi.useRealTimers();
});

test("caching with enabled override", async () => {
  const api = {
    getParams: vi.fn(async () => {
      return { async: true };
    }),
    getCachedParams: vi.fn(async () => {
      return { async: true };
    }),
  };
  const opts: CacheOptions<typeof api> = {
    settings: { enabled: false },
    overrides: { getCachedParams: { enabled: true } },
  };
  const cachedApi = cached(api, opts);
  expect(cachedApi[cacheStateKey]).toMatchObject(opts);
  await (async () => {
    const [first, ...results] = await Promise.all([cachedApi.getParams(), cachedApi.getParams()]);
    expect(api.getParams).toHaveBeenCalledTimes(2);
    expect(first).toStrictEqual({ async: true });
    for (const r of results) {
      expect(r).not.toBe(first);
    }
  })();
  await (async () => {
    const [first, ...results] = await Promise.all([
      cachedApi.getCachedParams(),
      cachedApi.getCachedParams(),
    ]);
    expect(api.getCachedParams).toHaveBeenCalledOnce();
    expect(first).toStrictEqual({ async: true });
    for (const r of results) {
      expect(r).toBe(first);
    }
  })();
});

test("caching with ttl override", async () => {
  const ttl = 2000;
  const api = {
    getParamsWithTtl: vi.fn(async () => {
      return { async: true };
    }),
    getParams: vi.fn(async () => {
      return { async: true };
    }),
  };
  const opts: CacheOptions<typeof api> = {
    settings: { ttl },
    overrides: { getParams: {} },
  };
  const cachedApi = cached(api, opts);
  expect(cachedApi[cacheStateKey]).toMatchObject(opts);
  await (async () => {
    vi.useFakeTimers();
    const [first, ...results] = await Promise.all([
      cachedApi.getParamsWithTtl(),
      cachedApi.getParamsWithTtl(),
    ]);
    expect(api.getParamsWithTtl).toHaveBeenCalledOnce();
    expect(first).toStrictEqual({ async: true });
    for (const r of results) {
      expect(r).toBe(first);
    }
    vi.advanceTimersByTime(ttl + 1);
    const [newFirst, ...newResults] = await Promise.all([
      cachedApi.getParamsWithTtl(),
      cachedApi.getParamsWithTtl(),
    ]);
    expect(api.getParamsWithTtl).toHaveBeenCalledTimes(2);
    expect(newFirst).toStrictEqual({ async: true });
    expect(newFirst).not.toBe(first);
    for (const r of newResults) {
      expect(r).not.toBe(first);
      expect(r).toBe(newFirst);
    }
    vi.useRealTimers();
  })();
  await (async () => {
    vi.useFakeTimers();
    const [first, ...results] = await Promise.all([cachedApi.getParams(), cachedApi.getParams()]);
    expect(api.getParams).toHaveBeenCalledOnce();
    expect(first).toStrictEqual({ async: true });
    for (const r of results) {
      expect(r).toBe(first);
    }
    vi.advanceTimersByTime(ttl + 1);
    const [newFirst, ...newResults] = await Promise.all([
      cachedApi.getParams(),
      cachedApi.getParams(),
    ]);
    expect(api.getParams).toHaveBeenCalledOnce();
    expect(newFirst).toStrictEqual({ async: true });
    expect(newFirst).toBe(first);
    for (const r of newResults) {
      expect(r).toBe(first);
      expect(r).toBe(newFirst);
    }
    vi.useRealTimers();
  })();
});

test("caching with per-function getCacheKey override", async () => {
  const cachedApi = cached(
    {
      a: vi.fn(async (id: number, _opts: { includeDetails?: boolean }) => {
        return { id, name: `User ${id}` };
      }),
      b: vi.fn(async (id: number, title: string) => {
        return { id, title };
      }),
    },
    { overrides: { a: { getCacheKey: (id) => `user-${id}` } } },
  );

  await cachedApi.a(1, { includeDetails: true });
  const aCache = cachedApi[cacheStateKey].cache.get(cachedApi[cacheStateKey].origApi.a);
  expect(aCache?.size).toBe(1);
  expect(aCache?.has("user-1")).toBe(true);

  await cachedApi.b(1, "the-title");
  const bCache = cachedApi[cacheStateKey].cache.get(cachedApi[cacheStateKey].origApi.b);
  expect(bCache?.size).toBe(1);
  expect(bCache?.has("1-the-title")).toBe(true);
});

test("caching with per-function getCacheKey override and global getCacheKey", async () => {
  const cachedApi = cached(
    {
      a: vi.fn(async (id: number, _opts: { includeDetails?: boolean }) => {
        return { id, name: `User ${id}` };
      }),
      b: vi.fn(async (id: number, title: string) => {
        return { id, title };
      }),
    },
    {
      getCacheKey: (fnName, args) => `${String(fnName)}-${args[0]}`,
      overrides: { a: { getCacheKey: (id) => `user-${id}` } },
    },
  );

  await cachedApi.a(1, { includeDetails: true });
  const aCache = cachedApi[cacheStateKey].cache.get(cachedApi[cacheStateKey].origApi.a);
  expect(aCache?.size).toBe(1);
  expect(aCache?.has("user-1")).toBe(true);

  await cachedApi.b(1, "the-title");
  const bCache = cachedApi[cacheStateKey].cache.get(cachedApi[cacheStateKey].origApi.b);
  expect(bCache?.size).toBe(1);
  expect(bCache?.has("b-1")).toBe(true);
});
