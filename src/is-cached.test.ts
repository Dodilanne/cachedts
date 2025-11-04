import { expect, test } from "vitest";
import { cached } from "./cached";
import { isCached } from "./is-cached";

test("isCached", () => {
  const cache = cached({ a: 1 });
  expect(isCached(cache)).toBe(true);
  expect(isCached({ a: 1 })).toBe(false);
});
