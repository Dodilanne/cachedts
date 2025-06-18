import { type Cached, cachedSymbol } from "./types";

export function isCached<TObj extends object>(obj: TObj): obj is Cached<TObj> {
  return typeof obj === "object" && obj !== null && obj[cachedSymbol as keyof TObj] === true;
}
