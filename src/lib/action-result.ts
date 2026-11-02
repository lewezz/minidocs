import type { ErrorCode } from "@/lib/errors";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: ErrorCode };
