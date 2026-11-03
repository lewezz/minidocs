import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_USERS } from "@/lib/demo-users";
import { emptyDocument } from "@/lib/documents";
import { AppError } from "@/lib/errors";
import { documentService } from "@/server/documents/service";
import { DOCUMENT_ID, memoryRepository } from "./helpers/document-repository";

vi.mock("server-only", () => ({}));

describe("document deletion and sharing revocation (memory repository)", () => {
  let fixture: ReturnType<typeof memoryRepository>;
  let service: ReturnType<typeof documentService>;
  beforeEach(() => { fixture = memoryRepository(); service = documentService(fixture.repository); });

  it("deletes only the owner's document and cascades only its grants", async () => {
    await service.share("alice", DOCUMENT_ID);
    const other = await service.create("alice");
    await service.share("alice", other.id);
    expect(await service.remove("alice", DOCUMENT_ID)).toEqual({ id: DOCUMENT_ID });
    expect(fixture.repository.remove).toHaveBeenCalledWith(DOCUMENT_ID, DEMO_USERS[0].id);
    expect(fixture.grants.has(`${DOCUMENT_ID}:${DEMO_USERS[1].id}`)).toBe(false);
    expect(fixture.grants.has(`${other.id}:${DEMO_USERS[1].id}`)).toBe(true);
    expect((await service.list("alice")).owned.map((row) => row.id)).toEqual([other.id]);
    expect((await service.list("bob")).shared.map((row) => row.id)).toEqual([other.id]);
    await expect(service.get("alice", DOCUMENT_ID)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.save("bob", { id: DOCUMENT_ID, content: emptyDocument() })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("lets Bob delete his own documents too", async () => {
    const created = await service.create("bob");
    await service.remove("bob", created.id);
    expect(fixture.repository.remove).toHaveBeenCalledWith(created.id, DEMO_USERS[1].id);
    expect(fixture.rows.has(DOCUMENT_ID)).toBe(true);
  });

  it.each(["remove", "unshare"] as const)("rejects private access and collaborator %s before writing", async (operation) => {
    await expect(service[operation]("bob", DOCUMENT_ID)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await service.share("alice", DOCUMENT_ID);
    await expect(service[operation]("bob", DOCUMENT_ID)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fixture.repository[operation]).not.toHaveBeenCalled();
  });

  it.each(["remove", "unshare"] as const)("validates identity and ID before %s queries", async (operation) => {
    await expect(service[operation]("admin", DOCUMENT_ID)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(service[operation]("alice", { id: DOCUMENT_ID, ownerId: DEMO_USERS[0].id })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(service[operation]("alice", "invalid-id")).rejects.toMatchObject({ code: "VALIDATION" });
    expect(fixture.repository.findAccess).not.toHaveBeenCalled();
    expect(fixture.repository[operation]).not.toHaveBeenCalled();
  });

  it("revokes idempotently, preserves the document and denies the next read/save from an already-open editor", async () => {
    await service.share("alice", DOCUMENT_ID);
    const original = (await service.get("bob", DOCUMENT_ID)).document;
    const other = await service.create("alice");
    await service.share("alice", other.id);
    expect(await service.unshare("alice", DOCUMENT_ID)).toMatchObject({ recipientId: DEMO_USERS[1].id });
    await service.unshare("alice", DOCUMENT_ID);
    expect((await service.get("alice", DOCUMENT_ID)).document).toEqual(original);
    expect((await service.get("alice", DOCUMENT_ID)).sharedWith).toEqual([]);
    expect((await service.list("bob")).shared.map((row) => row.id)).toEqual([other.id]);
    await expect(service.get("bob", DOCUMENT_ID)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.save("bob", { id: DOCUMENT_ID, content: emptyDocument() })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(fixture.repository.save).not.toHaveBeenCalled();
    await service.share("alice", DOCUMENT_ID);
    expect((await service.get("bob", DOCUMENT_ID)).document.id).toBe(DOCUMENT_ID);
  });

  it("allows Bob to stop sharing his own document with Alice", async () => {
    const owned = await service.create("bob");
    await service.share("bob", owned.id);
    await service.unshare("bob", owned.id);
    expect(fixture.repository.unshare).toHaveBeenCalledWith(owned.id, DEMO_USERS[0].id);
    await expect(service.get("alice", owned.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("reports not found when a document disappears before deletion", async () => {
    fixture.repository.remove.mockResolvedValue(false);
    await expect(service.remove("alice", DOCUMENT_ID)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it.each(["remove", "unshare"] as const)("does not report success when persistence fails during %s", async (operation) => {
    await service.share("alice", DOCUMENT_ID);
    fixture.repository[operation].mockRejectedValue(new AppError("PERSISTENCE", "Unable to access documents."));
    await expect(service[operation]("alice", DOCUMENT_ID)).rejects.toMatchObject({ code: "PERSISTENCE" });
    expect(fixture.rows.has(DOCUMENT_ID)).toBe(true);
    expect(fixture.grants.has(`${DOCUMENT_ID}:${DEMO_USERS[1].id}`)).toBe(true);
  });
});
