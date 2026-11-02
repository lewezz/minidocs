import { describe, expect, it } from "vitest";

import { validateEnvironment } from "@/lib/validation/environment";

const secretKey = "sb_secret_test_key_only_1234567890";
const validEnvironment = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: secretKey,
};

describe("server environment validation", () => {
  it("allows the initial UI without credentials and reports both missing variables", () => {
    expect(validateEnvironment({})).toEqual({
      status: "missing",
      issues: ["SUPABASE_URL is missing.", "SUPABASE_SECRET_KEY is missing."],
    });
  });

  it("treats blank configuration as missing", () => {
    expect(validateEnvironment({ SUPABASE_URL: " ", SUPABASE_SECRET_KEY: "\n" }).status).toBe("missing");
  });

  it("normalizes whitespace and a trailing slash", () => {
    expect(validateEnvironment({
      SUPABASE_URL: " https://example.supabase.co/ ",
      SUPABASE_SECRET_KEY: ` ${secretKey} `,
    })).toEqual({
      status: "configured",
      config: { url: validEnvironment.SUPABASE_URL, secretKey },
    });
  });

  it.each([
    "http://example.supabase.co",
    "javascript:alert(1)",
    "not-a-url",
    "https://user:password@example.supabase.co",
    "https://example.supabase.co/rest/v1",
    "https://example.supabase.co/?token=private",
    "https://example.supabase.co/#private",
  ])("rejects an invalid or unsafe project URL: %s", (url) => {
    expect(validateEnvironment({ ...validEnvironment, SUPABASE_URL: url }).status).toBe("invalid");
  });

  it.each(["http://localhost:54321", "http://127.0.0.1:54321", "http://[::1]:54321"])(
    "allows local Supabase development at %s", (url) => {
      expect(validateEnvironment({ ...validEnvironment, SUPABASE_URL: url }).status).toBe("configured");
    },
  );

  it.each(["sb_publishable_test_1234567890", "sb_secret_short", "not-a-secret"])(
    "rejects publishable keys and malformed secrets", (key) => {
      expect(validateEnvironment({ ...validEnvironment, SUPABASE_SECRET_KEY: key }).status).toBe("invalid");
    },
  );

  it("never includes secret values or URL credentials in validation errors", () => {
    const result = validateEnvironment({
      SUPABASE_URL: "https://private-user:private-password@example.supabase.co",
      SUPABASE_SECRET_KEY: "private-key-do-not-log",
    });
    expect(result.status).toBe("invalid");
    expect(JSON.stringify(result)).not.toContain("private-");
    expect(result).not.toHaveProperty("config");
  });
});
