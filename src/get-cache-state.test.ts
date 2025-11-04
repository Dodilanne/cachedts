import { expect, test } from "vitest";
import { cached } from "./cached";
import { getCacheState } from "./get-cache-state";
import { cachedSymbol } from "./types";

test("getCacheState", () => {
  const api = { a: 1 };
  const cache = cached(api);
  expect(cache[cachedSymbol]).toBeDefined();
  expect(getCacheState(cache)).toBe(cache[cachedSymbol]);
  expect(getCacheState(cache).origApi).toBe(api);
});
