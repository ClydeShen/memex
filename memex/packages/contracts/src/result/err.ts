import type { Result } from "./result.ts";

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
