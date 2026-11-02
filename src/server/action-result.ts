import "server-only";

import type { ActionResult } from "@/lib/action-result";
import { publicError } from "@/lib/errors";

export async function runAction<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    const safe = publicError(error);
    return { ok: false, error: safe.message, code: safe.code };
  }
}
