import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_USERS } from "@/lib/demo-users";
import { emptyDocument, MAX_TXT_BYTES } from "@/lib/documents";
import { parseTxtImport } from "@/lib/validation/txt-import";
import { documentService } from "@/server/documents/service";
import { DOCUMENT_ID, memoryRepository } from "./helpers/document-repository";

vi.mock("server-only", () => ({}));

describe("sharing authorization and duplicate prevention", () => {
  let fixture: ReturnType<typeof memoryRepository>;
  let service: ReturnType<typeof documentService>;
  beforeEach(() => { fixture = memoryRepository(); service = documentService(fixture.repository); });

  it("shares only with the other demo user and remains idempotent", async () => {
    expect(await service.share("alice", DOCUMENT_ID)).toMatchObject({ recipientId: DEMO_USERS[1].id, recipientName: "Bob" });
    await service.share("alice", DOCUMENT_ID);
    expect(fixture.grants.size).toBe(1);
    expect((await service.list("bob")).shared.map((row) => row.id)).toContain(DOCUMENT_ID);
    expect((await service.get("alice", DOCUMENT_ID)).sharedWith).toEqual([DEMO_USERS[1].id]);
  });

  it("rejects a non-owner before granting access", async () => {
    await expect(service.share("bob", DOCUMENT_ID)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(fixture.repository.share).not.toHaveBeenCalled();
  });
  it("also lets Bob share an owned document with Alice", async () => {
    const owned = await service.create("bob");
    expect(await service.share("bob", owned.id)).toMatchObject({ recipientId: DEMO_USERS[0].id, recipientName: "Alice" });
    expect((await service.get("alice", owned.id)).canRename).toBe(false);
  });

  it("allows the recipient to edit but not rename or reshare", async () => {
    await service.share("alice", DOCUMENT_ID);
    const content = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bob's update" }] }] };
    await service.save("bob", { id: DOCUMENT_ID, content });
    expect((await service.get("alice", DOCUMENT_ID)).document.content).toEqual(content);
    await expect(service.share("bob", DOCUMENT_ID)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(service.save("bob", { id: DOCUMENT_ID, title: "Stolen title", content })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects invalid actors and IDs before sharing", async () => {
    await expect(service.share("admin", DOCUMENT_ID)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(service.share("alice", "not-a-uuid")).rejects.toMatchObject({ code: "VALIDATION" });
    expect(fixture.repository.share).not.toHaveBeenCalled();
  });

  it("imports for the active owner and never writes invalid files", async () => {
    const file = new File(["First\nSecond"], "notes.txt", { type: "text/plain" });
    const imported = await service.importTxt("bob", file);
    expect(imported.ownerId).toBe(DEMO_USERS[1].id);
    expect(imported.title).toBe("notes");
    expect((await service.get("bob", imported.id)).document.content).toEqual(imported.content);
    fixture.repository.create.mockClear();
    await expect(service.importTxt("alice", new File(["x"], "wrong.pdf"))).rejects.toThrow();
    expect(fixture.repository.create).not.toHaveBeenCalled();
  });
});

describe("UTF-8 TXT import", () => {
  it("preserves Unicode, blank/trailing lines and literal HTML as text nodes", async () => {
    const result = await parseTxtImport(new File(["\uFEFFCafé 日本語 📝\r\n\r\n<script>alert(1)</script>\r\n"], "example.TXT"));
    expect(result.title).toBe("example");
    expect(result.content.content.map((node) => node.content?.map((text) => text.text ?? "").join("") ?? "")).toEqual([
      "Café 日本語 📝", "", "<script>alert(1)</script>", "",
    ]);
    expect(result.content.content.every((node) => node.type === "paragraph")).toBe(true);
  });

  it("does not rely on an unreliable browser MIME type", async () => {
    expect((await parseTxtImport(new File(["Text"], "note.txt", { type: "application/octet-stream" }))).content.content).toHaveLength(1);
  });

  it.each(["file.pdf", "file.txt.exe", "file", "file.html"])("rejects unsupported extensions: %s", async (name) => {
    await expect(parseTxtImport(new File(["text"], name))).rejects.toThrow("Only .txt");
  });

  it("rejects missing, empty and oversized uploads", async () => {
    await expect(parseTxtImport(null)).rejects.toThrow("Select a text file");
    await expect(parseTxtImport(new File([], "empty.txt"))).rejects.toThrow("empty");
    await expect(parseTxtImport(new File(["a".repeat(MAX_TXT_BYTES + 1)], "large.txt"))).rejects.toThrow("256 KiB");
  });

  it("rejects malformed UTF-8 and binary NUL", async () => {
    await expect(parseTxtImport(new File([new Uint8Array([0xc3, 0x28])], "bad.txt"))).rejects.toThrow("UTF-8");
    await expect(parseTxtImport(new File(["a\u0000b"], "binary.txt"))).rejects.toThrow("binary");
  });

  it("handles lone CR and bounds line count", async () => {
    expect((await parseTxtImport(new File(["a\rb"], "cr.txt"))).content.content).toHaveLength(2);
    await expect(parseTxtImport(new File(["\n".repeat(2000)], "lines.txt"))).rejects.toThrow("2,000-line");
  });

  it("caps titles and supplies a name for an empty stem", async () => {
    expect((await parseTxtImport(new File(["Text"], `${"a".repeat(200)}.txt`))).title).toHaveLength(160);
    expect((await parseTxtImport(new File(["Text"], ".txt"))).title).toBe("Imported document");
    expect(emptyDocument().type).toBe("doc");
  });
});
