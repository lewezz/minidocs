import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_USERS } from "@/lib/demo-users";
import { DEFAULT_TITLE, emptyDocument } from "@/lib/documents";
import { publicError } from "@/lib/errors";
import { documentService } from "@/server/documents/service";
import { DOCUMENT_ID, memoryRepository } from "./helpers/document-repository";

vi.mock("server-only", () => ({}));

describe("document operations and authorization (memory repository, not database E2E)", () => {
  let fixture: ReturnType<typeof memoryRepository>;
  let service: ReturnType<typeof documentService>;
  beforeEach(() => { fixture = memoryRepository(); service = documentService(fixture.repository); });

  it("creates a document owned by the validated active demo user", async () => {
    const created = await service.create("bob");
    expect(created.ownerId).toBe(DEMO_USERS[1].id);
    expect(created.title).toBe(DEFAULT_TITLE);
    expect(created.content).toEqual(emptyDocument());
    expect((await service.list("bob")).owned.map((document) => document.id)).toContain(created.id);
    expect((await service.list("alice")).owned.map((document) => document.id)).not.toContain(created.id);
  });

  it("saves title + rich JSON together and reads back formatting without changing ownership or creation date", async () => {
    const original = (await service.get("alice", DOCUMENT_ID)).document;
    const content = { type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Café", marks: [{ type: "underline" }, { type: "bold" }] }] }] };
    await service.save("alice", { id: DOCUMENT_ID, title: "  Revisión  ", content });
    const reopened = (await service.get("alice", DOCUMENT_ID)).document;
    expect(reopened.title).toBe("Revisión");
    // ProseMirror normalizes equivalent mark sets into schema order.
    expect(reopened.content).toEqual({ type: "doc", content: [{
      type: "heading", attrs: { level: 2 },
      content: [{ type: "text", text: "Café", marks: [{ type: "bold" }, { type: "underline" }] }],
    }] });
    expect(reopened.ownerId).toBe(original.ownerId);
    expect(reopened.createdAt).toBe(original.createdAt);
    expect(reopened.updatedAt).not.toBe(original.updatedAt);
  });

  it("rejects Bob before loading Alice's private content", async () => {
    await expect(service.get("bob", DOCUMENT_ID)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(fixture.repository.findById).not.toHaveBeenCalled();
  });

  it("rejects an unauthorized save without any write", async () => {
    await expect(service.save("bob", { id: DOCUMENT_ID, content: emptyDocument() })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(fixture.repository.save).not.toHaveBeenCalled();
  });

  it("allows an already granted editor to read and save content, but never rename", async () => {
    fixture.grants.add(`${DOCUMENT_ID}:${DEMO_USERS[1].id}`);
    expect((await service.get("bob", DOCUMENT_ID)).canRename).toBe(false);
    const content = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Edición de Bob" }] }] };
    await service.save("bob", { id: DOCUMENT_ID, content });
    expect((await service.get("alice", DOCUMENT_ID)).document.content).toEqual(content);
    fixture.repository.save.mockClear();
    await expect(service.save("bob", { id: DOCUMENT_ID, content, title: "Título ajeno" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fixture.repository.save).not.toHaveBeenCalled();
  });

  it("checks access again on every save", async () => {
    fixture.grants.add(`${DOCUMENT_ID}:${DEMO_USERS[1].id}`);
    await service.get("bob", DOCUMENT_ID);
    fixture.grants.clear();
    await expect(service.save("bob", { id: DOCUMENT_ID, content: emptyDocument() })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(fixture.repository.save).not.toHaveBeenCalled();
  });

  it.each(["admin", DEMO_USERS[0].id, undefined])("rejects arbitrary actors before querying: %j", async (actor) => {
    await expect(service.create(actor)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(service.get(actor, DOCUMENT_ID)).rejects.toMatchObject({ code: "VALIDATION" });
    expect(fixture.repository.create).not.toHaveBeenCalled();
    expect(fixture.repository.findAccess).not.toHaveBeenCalled();
  });

  it("rejects invalid title or injected owner without modifying the document", async () => {
    await expect(service.save("alice", { id: DOCUMENT_ID, title: " ", content: emptyDocument() })).rejects.toThrow();
    await expect(service.save("alice", { id: DOCUMENT_ID, ownerId: DEMO_USERS[1].id, content: emptyDocument() })).rejects.toThrow();
    expect(fixture.repository.save).not.toHaveBeenCalled();
  });

  it("handles a document disappearing between permission check and load/save", async () => {
    fixture.repository.findAccess.mockImplementation(async () => {
      fixture.rows.delete(DOCUMENT_ID);
      return { ownerId: DEMO_USERS[0].id, canRename: true };
    });
    await expect(service.get("alice", DOCUMENT_ID)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.save("alice", { id: DOCUMENT_ID, content: emptyDocument() })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("never returns raw unexpected database errors to clients", () => {
    const result = publicError(new Error("private database url / sb_secret_do_not_leak"));
    expect(JSON.stringify(result)).not.toContain("sb_secret");
    expect(result.code).toBe("PERSISTENCE");
  });
});
