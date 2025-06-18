import { expect, test, vi } from "vitest";
import { cached, cachedSymbol, invalidate } from "../src";

test("invalidate the entire cache", async () => {
  const api = {
    getParams: vi.fn(() => ({ async: false })),
    getParamsAsync: vi.fn(async () => ({ async: true })),
  };
  const cachedApi = cached(api);
  expect(cachedApi[cachedSymbol]).toBeDefined();
  cachedApi.getParams();
  cachedApi.getParams();
  await Promise.all([cachedApi.getParamsAsync(), cachedApi.getParamsAsync()]);

  expect(api.getParams).toHaveBeenCalledOnce();
  expect(api.getParamsAsync).toHaveBeenCalledOnce();

  invalidate(cachedApi);

  cachedApi.getParams();
  cachedApi.getParams();
  await Promise.all([cachedApi.getParamsAsync(), cachedApi.getParamsAsync()]);

  expect(api.getParams).toHaveBeenCalledTimes(2);
  expect(api.getParamsAsync).toHaveBeenCalledTimes(2);
});

test("invalidate a specific function", async () => {
  const api = {
    getParams: vi.fn(() => ({ async: false })),
    getParamsAsync: vi.fn(async () => ({ async: true })),
  };
  const cachedApi = cached(api);
  expect(cachedApi[cachedSymbol]).toBeDefined();
  cachedApi.getParams();
  cachedApi.getParams();
  await Promise.all([cachedApi.getParamsAsync(), cachedApi.getParamsAsync()]);

  expect(api.getParams).toHaveBeenCalledOnce();
  expect(api.getParamsAsync).toHaveBeenCalledOnce();

  invalidate(cachedApi, "getParams");

  cachedApi.getParams();
  cachedApi.getParams();
  await Promise.all([cachedApi.getParamsAsync(), cachedApi.getParamsAsync()]);

  expect(api.getParams).toHaveBeenCalledTimes(2);
  expect(api.getParamsAsync).toHaveBeenCalledOnce();
});

test("invalidate a specific function with specific params", async () => {
  const api = {
    getParams: vi.fn((_name: string, _value: number) => ({ async: false })),
  };
  const cachedApi = cached(api);
  expect(cachedApi[cachedSymbol]).toBeDefined();

  cachedApi.getParams("a", 1);
  cachedApi.getParams("a", 1);
  cachedApi.getParams("a", 2);
  cachedApi.getParams("a", 2);
  cachedApi.getParams("b", 1);
  cachedApi.getParams("b", 1);
  cachedApi.getParams("b", 2);
  cachedApi.getParams("b", 2);

  expect(api.getParams).toHaveBeenNthCalledWith(1, "a", 1);
  expect(api.getParams).toHaveBeenNthCalledWith(2, "a", 2);
  expect(api.getParams).toHaveBeenNthCalledWith(3, "b", 1);
  expect(api.getParams).toHaveBeenNthCalledWith(4, "b", 2);

  invalidate(cachedApi, "getParams", "b", 2);

  cachedApi.getParams("a", 1);
  cachedApi.getParams("a", 1);
  cachedApi.getParams("a", 2);
  cachedApi.getParams("a", 2);
  cachedApi.getParams("b", 1);
  cachedApi.getParams("b", 1);
  cachedApi.getParams("b", 2);
  cachedApi.getParams("b", 2);

  expect(api.getParams).toHaveBeenNthCalledWith(5, "b", 2);

  expect(api.getParams).toHaveBeenCalledTimes(5);
});
