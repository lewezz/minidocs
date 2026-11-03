import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { DEMO_USERS } from "@/lib/demo-users";
import { emptyDocument } from "@/lib/documents";
import type { Database } from "@/server/db/database.types";
import { supabaseDocumentRepository } from "@/server/documents/repository";
import { DOCUMENT_ID } from "./helpers/document-repository";

vi.mock("server-only", () => ({}));

const row = {
  id: DOCUMENT_ID, owner_id: DEMO_USERS[0].id, title: "Nota", content: emptyDocument(),
  created_at: "2026-11-02T10:00:00Z", updated_at: "2026-11-02T10:00:00Z",
};

function adapter(responder: (url: URL, init: RequestInit | undefined) => Response) {
  const requests: { url: URL; init: RequestInit | undefined }[] = [];
  const client = createClient<Database>("https://example.supabase.co", "sb_secret_fake_test_only_1234567890", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      requests.push({ url, init });
      return responder(url, init);
    } },
  });
  return { repository: supabaseDocumentRepository(client), requests };
}

describe("Supabase query adapter (mock HTTP, not a remote database)", () => {
  it("deletes only the matching document and owner, returning whether a row was deleted", async () => {
    const { repository, requests } = adapter(() => Response.json({ id: DOCUMENT_ID }));
    expect(await repository.remove(DOCUMENT_ID, DEMO_USERS[0].id)).toBe(true);
    expect(requests[0]?.init?.method).toBe("DELETE");
    expect(requests[0]?.url.pathname).toMatch(/\/documents$/);
    expect(requests[0]?.url.searchParams.get("id")).toBe(`eq.${DOCUMENT_ID}`);
    expect(requests[0]?.url.searchParams.get("owner_id")).toBe(`eq.${DEMO_USERS[0].id}`);
    expect(requests[0]?.url.searchParams.get("select")).toBe("id");
    const missing = adapter(() => Response.json(null));
    expect(await missing.repository.remove(DOCUMENT_ID, DEMO_USERS[0].id)).toBe(false);
  });

  it("revokes only the matching document, recipient and editor grant", async () => {
    const { repository, requests } = adapter(() => new Response(null, { status: 204 }));
    await repository.unshare(DOCUMENT_ID, DEMO_USERS[1].id);
    expect(requests[0]?.init?.method).toBe("DELETE");
    expect(requests[0]?.url.pathname).toMatch(/\/document_shares$/);
    expect(requests[0]?.url.searchParams.get("document_id")).toBe(`eq.${DOCUMENT_ID}`);
    expect(requests[0]?.url.searchParams.get("user_id")).toBe(`eq.${DEMO_USERS[1].id}`);
    expect(requests[0]?.url.searchParams.get("permission")).toBe("eq.editor");
  });

  it("returns safe persistence errors for denied deletions and revocations", async () => {
    const { repository } = adapter(() => Response.json({ code: "42501", message: "private database detail" }, { status: 403 }));
    await expect(repository.remove(DOCUMENT_ID, DEMO_USERS[0].id)).rejects.toMatchObject({ code: "PERSISTENCE" });
    await expect(repository.unshare(DOCUMENT_ID, DEMO_USERS[1].id)).rejects.toMatchObject({ code: "PERSISTENCE" });
    await expect(repository.remove(DOCUMENT_ID, DEMO_USERS[0].id)).rejects.not.toThrow("private database detail");
  });

  it("filters both lists by the actor and never fetches document content in a listing", async () => {
    const { repository, requests } = adapter((url) => Response.json(url.pathname.endsWith("/documents") ? [row] : []));
    const lists = await repository.listForUser(DEMO_USERS[0].id);
    expect(lists.owned[0]?.id).toBe(DOCUMENT_ID);
    expect(lists.owned[0]).not.toHaveProperty("content");
    const owned = requests.find((request) => request.url.pathname.endsWith("/documents"));
    const shared = requests.find((request) => request.url.pathname.endsWith("/document_shares"));
    expect(owned?.url.searchParams.get("owner_id")).toBe(`eq.${DEMO_USERS[0].id}`);
    expect(shared?.url.searchParams.get("user_id")).toBe(`eq.${DEMO_USERS[0].id}`);
    expect(shared?.url.searchParams.get("permission")).toBe("eq.editor");
    for (const request of requests) expect(request.url.searchParams.get("select")).not.toContain("content");
  });

  it("loads only metadata when checking owner access", async () => {
    const { repository, requests } = adapter(() => Response.json([{ owner_id: DEMO_USERS[0].id }]));
    expect(await repository.findAccess(DOCUMENT_ID, DEMO_USERS[0].id)).toEqual({ ownerId: DEMO_USERS[0].id, canRename: true });
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url.searchParams.get("select")).toBe("owner_id");
    expect(requests[0]?.url.searchParams.get("id")).toBe(`eq.${DOCUMENT_ID}`);
  });

  it("requires a matching document + user + permission for non-owner access", async () => {
    const { repository, requests } = adapter((url) => Response.json(url.pathname.endsWith("/documents") ? [{ owner_id: DEMO_USERS[0].id }] : []));
    expect(await repository.findAccess(DOCUMENT_ID, DEMO_USERS[1].id)).toBeNull();
    expect(requests[1]?.url.searchParams.get("document_id")).toBe(`eq.${DOCUMENT_ID}`);
    expect(requests[1]?.url.searchParams.get("user_id")).toBe(`eq.${DEMO_USERS[1].id}`);
    expect(requests[1]?.url.searchParams.get("permission")).toBe("eq.editor");
  });

  it("writes structured JSON and omits ownership from update payloads", async () => {
    const { repository, requests } = adapter(() => Response.json(row));
    await repository.save(DOCUMENT_ID, { title: "Renombrado", content: emptyDocument() });
    expect(requests[0]?.init?.method).toBe("PATCH");
    expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({ title: "Renombrado", content: emptyDocument() });
    expect(requests[0]?.url.searchParams.get("id")).toBe(`eq.${DOCUMENT_ID}`);
  });

  it("hides raw database error messages", async () => {
    const { repository } = adapter(() => Response.json({ message: "private project detail sb_secret_hidden", code: "42501" }, { status: 403 }));
    const failure: unknown = await repository.listForUser(DEMO_USERS[0].id).catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: "PERSISTENCE" });
    expect(String(failure)).not.toContain("sb_secret_hidden");
    expect(String(failure)).not.toContain("private project");
  });
});
