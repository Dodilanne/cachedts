import { expect, test } from "vitest";
import { cached } from "./cached";
import { getCacheState } from "./get-cache-state";
import { cacheStateKey } from "./types";

test("getCacheState", () => {
  const api = { a: 1 };
  const cache = cached(api);
  expect(cache[cacheStateKey]).toBeDefined();
  expect(getCacheState(cache)).toBe(cache[cacheStateKey]);
  expect(getCacheState(cache).origApi).toBe(api);
});
