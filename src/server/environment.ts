import "server-only";

import { validateEnvironment } from "@/lib/validation/environment";

export function getServerEnvironment() {
  return validateEnvironment({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
}
