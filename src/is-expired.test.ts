import { expect, test, vi } from "vitest";
import type { CacheResult, CacheSettings } from "./cached";
import { isExpired } from "./is-expired";

test("returns false when no TTL is set", () => {
  const result: CacheResult = { value: "hello", cachedAt: Date.now() };
  const settings: CacheSettings = {};
  expect(isExpired(result, settings)).toBe(false);
});

test("returns false when entry is within TTL", () => {
  vi.useFakeTimers();
  const result: CacheResult = { value: "hello", cachedAt: Date.now() };
  const settings: CacheSettings = { ttl: 5000 };
  vi.advanceTimersByTime(3000);
  expect(isExpired(result, settings)).toBe(false);
  vi.useRealTimers();
});

test("returns true when entry has exceeded TTL", () => {
  vi.useFakeTimers();
  const result: CacheResult = { value: "hello", cachedAt: Date.now() };
  const settings: CacheSettings = { ttl: 5000 };
  vi.advanceTimersByTime(5001);
  expect(isExpired(result, settings)).toBe(true);
  vi.useRealTimers();
});
