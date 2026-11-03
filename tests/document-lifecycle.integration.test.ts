import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { DEMO_USERS } from "@/lib/demo-users";
import { emptyDocument } from "@/lib/documents";
import { createSupabaseAdminClient } from "@/server/db/supabase";
import { getDocumentService } from "@/server/documents";

vi.mock("server-only", () => ({}));

// Explicit opt-in: creates and deletes ONLY its own labeled verification document.
describe.skipIf(process.env.MINIDOCS_LIVE_TEST !== "1")("REAL Supabase deletion/revocation (not browser interaction)", () => {
  it("revokes access, rejects subsequent edits and deletes the document with its permissions", async () => {
    const client = createSupabaseAdminClient();
    const nonexistent = randomUUID();
    const documentGrant = await client.from("documents").delete().eq("id", nonexistent).select("id");
    const shareGrant = await client.from("document_shares").delete().eq("document_id", nonexistent).select("document_id");
    if (documentGrant.error?.code === "42501" || shareGrant.error?.code === "42501") {
      throw new Error("Apply supabase/migrations/20261103000100_document_deletion.sql before running this test. No test document was created.");
    }
    if (documentGrant.error || shareGrant.error) {
      throw new Error("Supabase deletion preflight failed. Check the server configuration and database connection. No test document was created.");
    }

    const service = getDocumentService();
    const created = await service.create("alice");
    const title = `Deletion verification ${new Date().toISOString()}`;
    await service.save("alice", { id: created.id, title, content: emptyDocument() });
    await service.share("alice", created.id);
    expect((await service.get("bob", created.id)).document.title).toBe(title);
    await expect(service.remove("bob", created.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(service.unshare("bob", created.id)).rejects.toMatchObject({ code: "FORBIDDEN" });

    const base = process.env.MINIDOCS_TEST_URL ?? "http://127.0.0.1:3010";
    const page = (handle: string) => fetch(`${base}/documents/${created.id}`, {
      headers: { Cookie: `minidocs-demo-user=${handle}` }, signal: AbortSignal.timeout(15000),
    });
    expect((await page("bob")).status).toBe(200);
    const ownerPage = await page("alice");
    expect(ownerPage.status).toBe(200);
    const ownerMarkup = await ownerPage.text();
    expect(ownerMarkup).toContain("Stop sharing");
    expect(ownerMarkup).toContain(`Delete ${title}`);

    await service.unshare("alice", created.id);
    await service.unshare("alice", created.id);
    expect((await service.get("alice", created.id)).document.title).toBe(title);
    expect((await service.get("alice", created.id)).sharedWith).toEqual([]);
    expect((await service.list("bob")).shared.some((row) => row.id === created.id)).toBe(false);
    await expect(service.get("bob", created.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.save("bob", { id: created.id, content: emptyDocument() })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await page("bob")).status).toBe(404);

    await service.share("alice", created.id);
    expect((await service.get("bob", created.id)).document.id).toBe(created.id);
    await service.remove("alice", created.id);
    for (const handle of ["alice", "bob"]) {
      await expect(service.get(handle, created.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect((await page(handle)).status).toBe(404);
    }
    const document = await client.from("documents").select("id", { head: true, count: "exact" }).eq("id", created.id);
    const shares = await client.from("document_shares").select("user_id", { head: true, count: "exact" })
      .eq("document_id", created.id).eq("user_id", DEMO_USERS[1].id);
    expect(document.error).toBeNull();
    expect(shares.error).toBeNull();
    expect(document.count).toBe(0);
    expect(shares.count).toBe(0);
    expect((await service.list("alice")).owned.some((row) => row.id === created.id)).toBe(false);
    expect((await service.list("bob")).shared.some((row) => row.id === created.id)).toBe(false);

    writeFileSync("docs/verification/lifecycle-live.json", JSON.stringify({
      verifiedAt: new Date().toISOString(), database: "real Supabase", browser: false,
      documentId: created.id, deletedOnlyTestFixture: true,
      checks: ["owner-only deletion/revocation", "revocation is idempotent", "document preserved after revocation", "Bob next read/save denied", "Bob HTTP 404 after revocation", "can share again", "document deletion", "cascading permissions removed", "both HTTP pages 404 after deletion", "owned/shared lists updated"],
    }, null, 2) + "\n");
  }, 90000);
});
