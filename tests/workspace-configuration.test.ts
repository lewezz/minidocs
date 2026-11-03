import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";
import { DEMO_USERS } from "@/lib/demo-users";
import { AppError } from "@/lib/errors";
import { validateEnvironment } from "@/lib/validation/environment";

const mocks = vi.hoisted(() => ({ environment: vi.fn(), user: vi.fn(), list: vi.fn() }));
vi.mock("@/server/environment", () => ({ getServerEnvironment: mocks.environment }));
vi.mock("@/server/demo-session", () => ({ getActiveDemoUser: mocks.user }));
vi.mock("@/server/documents", () => ({ getDocumentService: () => ({ list: mocks.list }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/actions/documents", () => ({ createDocumentAction: vi.fn(), importTxtAction: vi.fn(), deleteDocumentAction: vi.fn() }));
vi.mock("@/app/actions/demo-user", () => ({ setDemoUserAction: vi.fn() }));

const secret = "sb_secret_server_only_test_value_1234567890";
const environment = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SECRET_KEY: secret };

function createButtonDisabled(html: string) {
  const button = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
    .find((match) => match[2]?.includes("New document"));
  expect(button, "The create button should exist").toBeDefined();
  return /\sdisabled(?:=|\s|$)/.test(button?.[1] ?? "");
}

describe("create-button configuration diagnosis (server render, no Supabase writes)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.environment.mockReturnValue(validateEnvironment(environment));
    mocks.user.mockResolvedValue(DEMO_USERS[0]);
    mocks.list.mockResolvedValue({ owned: [], shared: [] });
  });

  it.each(DEMO_USERS)("enables creation for $name with configured environment", async (user) => {
    mocks.user.mockResolvedValue(user);
    const html = renderToStaticMarkup(await HomePage());
    expect(createButtonDisabled(html)).toBe(false);
    expect(mocks.list).toHaveBeenCalledWith(user.handle);
    expect(html).not.toContain(secret);
  });

  it("explains an invalid secret key without exposing its value or blaming SQL", async () => {
    const invalidSecret = "invalid_credential_do_not_expose";
    mocks.environment.mockReturnValue(validateEnvironment({ ...environment, SUPABASE_SECRET_KEY: invalidSecret }));
    const html = renderToStaticMarkup(await HomePage());
    expect(createButtonDisabled(html)).toBe(true);
    expect(html).toContain("SUPABASE_SECRET_KEY must be a server secret key starting with sb_secret_");
    expect(html).not.toContain(invalidSecret);
    expect(html).not.toContain("apply the migration and seed");
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("identifies a missing variable and keeps creation blocked", async () => {
    mocks.environment.mockReturnValue(validateEnvironment({ SUPABASE_URL: environment.SUPABASE_URL }));
    const html = renderToStaticMarkup(await HomePage());
    expect(createButtonDisabled(html)).toBe(true);
    expect(html).toContain("SUPABASE_SECRET_KEY is missing.");
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("does not treat a document-list connection error as a permanent creation disable", async () => {
    mocks.list.mockRejectedValue(new AppError("PERSISTENCE", "Unable to access documents."));
    const html = renderToStaticMarkup(await HomePage());
    expect(createButtonDisabled(html)).toBe(false);
    expect(html).toContain("Unable to access documents.");
    expect(html).not.toContain(secret);
  });
});
