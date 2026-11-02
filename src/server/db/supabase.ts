import "server-only";

import { createClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/errors";
import type { Database } from "@/server/db/database.types";
import { getServerEnvironment } from "@/server/environment";

// Lazy: the initial UI can build/render before Supabase is configured.
// The elevated key bypasses RLS. Only the authorized document service uses it.
export function createSupabaseAdminClient() {
  const environment = getServerEnvironment();

  if (environment.status !== "configured") {
    throw new AppError("CONFIGURATION", "Configure Supabase on the server to work with documents.");
  }

  return createClient<Database>(environment.config.url, environment.config.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(15_000) }) },
  });
}
