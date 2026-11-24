import type { Result } from "./result.ts";

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
