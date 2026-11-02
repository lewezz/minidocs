import { writeFileSync, mkdirSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { DEMO_USERS } from "@/lib/demo-users";
import { validateDocumentContent } from "@/lib/validation/documents";
import { createSupabaseAdminClient } from "@/server/db/supabase";
import { getDocumentService } from "@/server/documents";

vi.mock("server-only", () => ({}));

// Explicit opt-in: this test creates two retained, labeled verification documents.
describe.skipIf(process.env.MINIDOCS_LIVE_TEST !== "1")("REAL Supabase persistence and authorization (not a browser test)", () => {
  it("creates, saves, reloads, shares once, edits as Bob, rejects forbidden actions and imports TXT", async () => {
    const service = getDocumentService();
    const client = createSupabaseAdminClient();
    const document = await service.create("alice");
    const title = `Assessment verification ${new Date().toISOString()}`;
    const content = validateDocumentContent({ type: "doc", content: [
      ...[1, 2, 3].map((level) => ({ type: "heading", attrs: { level }, content: [{ type: "text", text: `Heading ${level}` }] })),
      { type: "paragraph", content: [{ type: "text", text: "Café 日本語", marks: [{ type: "bold" }, { type: "italic" }, { type: "underline" }] }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Bullet item" }] }] }] },
      { type: "orderedList", attrs: { start: 1, type: null }, content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Numbered item" }] }] }] },
    ] });
    await service.save("alice", { id: document.id, title, content });
    expect((await service.get("alice", document.id)).document.content).toEqual(content);
    expect((await service.list("alice")).owned.some((row) => row.id === document.id)).toBe(true);
    await expect(service.get("bob", document.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.save("bob", { id: document.id, content })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.share("bob", document.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await service.share("alice", document.id);
    await service.share("alice", document.id);
    const shares = await client.from("document_shares").select("user_id", { count: "exact", head: true })
      .eq("document_id", document.id).eq("user_id", DEMO_USERS[1].id);
    expect(shares.error).toBeNull();
    expect(shares.count).toBe(1);
    expect((await service.list("bob")).shared.some((row) => row.id === document.id)).toBe(true);
    expect((await service.get("bob", document.id)).canRename).toBe(false);
    const edited = validateDocumentContent({ ...content, content: [...content.content, { type: "paragraph", content: [{ type: "text", text: "Edited and saved by Bob" }] }] });
    await service.save("bob", { id: document.id, content: edited });
    expect((await service.get("alice", document.id)).document.content).toEqual(edited);
    await expect(service.save("bob", { id: document.id, title: "Not allowed", content: edited })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(service.share("bob", document.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const imported = await service.importTxt("alice", new File(["Café 日本語 📝\r\n\r\n<script>literal text</script>\r\n"], "Import verification.txt"));
    const reopened = (await service.get("alice", imported.id)).document;
    expect(reopened.content).toEqual(imported.content);
    expect(reopened.content.content).toHaveLength(4);
    expect(reopened.content.content[2]?.content?.[0]?.text).toBe("<script>literal text</script>");
    expect(reopened.ownerId).toBe(DEMO_USERS[0].id);
    const base = process.env.MINIDOCS_TEST_URL ?? "http://localhost:3000";
    for (const handle of ["alice", "bob"]) {
      const response = await fetch(`${base}/documents/${document.id}`, { headers: { Cookie: `minidocs-demo-user=${handle}` }, signal: AbortSignal.timeout(15000) });
      expect(response.status).toBe(200);
      const markup = await response.text();
      expect(markup).toContain("Document title");
      expect(markup).toContain("Back to documents");
    }
    mkdirSync("docs/verification", { recursive: true });
    writeFileSync("docs/verification/live-supabase.json", JSON.stringify({
      verifiedAt: new Date().toISOString(), database: "real Supabase", browser: false,
      documentId: document.id, importedDocumentId: imported.id,
      checks: ["create", "rename", "rich JSON save/reopen", "private read/write/share denied", "share persisted", "duplicate count=1", "Bob shared list", "Bob edit", "Alice reads Bob changes", "recipient rename/reshare denied", "TXT UTF-8/blank lines/literal HTML persisted", "authorized HTTP document pages"],
      retainedDocuments: true,
    }, null, 2) + "\n");
  }, 90000);
});
