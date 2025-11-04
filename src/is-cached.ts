import { type Cached, cacheStateKey } from "./types";

export function isCached<TObj extends object>(obj: TObj): obj is Cached<TObj> {
  return typeof obj === "object" && obj !== null && obj[cacheStateKey as keyof TObj] !== undefined;
}
