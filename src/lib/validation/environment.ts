type EnvironmentInput = Readonly<Record<string, string | undefined>>;

type SupabaseConfiguration = Readonly<{
  url: string;
  secretKey: string;
}>;

export type EnvironmentResult =
  | { status: "missing"; issues: string[] }
  | { status: "invalid"; issues: string[] }
  | { status: "configured"; config: SupabaseConfiguration };

// Pure validation: never include environment values in errors or logs.
export function validateEnvironment(env: EnvironmentInput): EnvironmentResult {
  const url = env.SUPABASE_URL?.trim();
  const secretKey = env.SUPABASE_SECRET_KEY?.trim();
  const missing = [
    ...(!url ? ["SUPABASE_URL is missing."] : []),
    ...(!secretKey ? ["SUPABASE_SECRET_KEY is missing."] : []),
  ];

  if (!url || !secretKey) return { status: "missing", issues: missing };

  const issues: string[] = [];

  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    const validProtocol = parsed.protocol === "https:" || (local && parsed.protocol === "http:");

    if (
      !validProtocol ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== "/"
    ) {
      issues.push("SUPABASE_URL must be an HTTPS project URL without credentials, a path, or parameters.");
    }
  } catch {
    issues.push("SUPABASE_URL is not a valid URL.");
  }

  if (!/^sb_secret_[A-Za-z0-9_-]{16,}$/.test(secretKey)) {
    issues.push("SUPABASE_SECRET_KEY must be a server secret key starting with sb_secret_.");
  }

  return issues.length > 0
    ? { status: "invalid", issues }
    : { status: "configured", config: { url: url.replace(/\/$/, ""), secretKey } };
}
