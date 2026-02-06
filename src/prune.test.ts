import { expect, test, vi } from "vitest";
import { cached, cacheStateKey } from "../src";
import { prune } from "./prune";

test("prune removes all expired entries across all functions, leaves non-expired ones intact", () => {
  vi.useFakeTimers();
  const api = {
    a: vi.fn((id: number) => `a-${id}`),
    b: vi.fn((id: number) => `b-${id}`),
  };
  const ttl = 1000;
  const cachedApi = cached(api, { settings: { ttl } });
  const state = cachedApi[cacheStateKey];

  cachedApi.a(1);
  cachedApi.b(1);

  vi.advanceTimersByTime(ttl + 1);

  cachedApi.a(2);
  cachedApi.b(2);

  prune(cachedApi);

  const aCache = state.cache.get(state.origApi.a);
  const bCache = state.cache.get(state.origApi.b);

  expect(aCache?.size).toBe(1);
  expect(aCache?.has("2")).toBe(true);
  expect(aCache?.has("1")).toBe(false);

  expect(bCache?.size).toBe(1);
  expect(bCache?.has("2")).toBe(true);
  expect(bCache?.has("1")).toBe(false);

  vi.useRealTimers();
});

test("prune has no effect when no TTL is set", () => {
  const api = {
    a: vi.fn((id: number) => `a-${id}`),
  };
  const cachedApi = cached(api);
  const state = cachedApi[cacheStateKey];

  cachedApi.a(1);
  cachedApi.a(2);

  prune(cachedApi);

  const aCache = state.cache.get(state.origApi.a);
  expect(aCache?.size).toBe(2);
});

test("prune respects per-function TTL overrides when pruning", () => {
  vi.useFakeTimers();
  const api = {
    a: vi.fn((id: number) => `a-${id}`),
    b: vi.fn((id: number) => `b-${id}`),
  };
  const cachedApi = cached(api, {
    settings: { ttl: 5000 },
    overrides: { a: { ttl: 1000 } },
  });
  const state = cachedApi[cacheStateKey];

  cachedApi.a(1);
  cachedApi.b(1);

  vi.advanceTimersByTime(2000);

  prune(cachedApi);

  const aCache = state.cache.get(state.origApi.a);
  const bCache = state.cache.get(state.origApi.b);

  expect(aCache?.size).toBe(0);
  expect(bCache?.size).toBe(1);

  vi.useRealTimers();
});
