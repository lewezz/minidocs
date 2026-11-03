import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDocumentAction, deleteDocumentAction, saveDocumentAction, unshareDocumentAction } from "@/app/actions/documents";
import { setDemoUserAction } from "@/app/actions/demo-user";
import { DEMO_USERS } from "@/lib/demo-users";

const mocks = vi.hoisted(() => ({
  get: vi.fn(), set: vi.fn(), revalidate: vi.fn(), create: vi.fn(), save: vi.fn(), remove: vi.fn(), unshare: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.get, set: mocks.set }) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/server/documents", () => ({ getDocumentService: () => ({ create: mocks.create, save: mocks.save, remove: mocks.remove, unshare: mocks.unshare }) }));

describe("server action identity boundary", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.create.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }); });

  it.each([
    ["delete", deleteDocumentAction, mocks.remove],
    ["unshare", unshareDocumentAction, mocks.unshare],
  ] as const)("derives the %s actor from the cookie and invalidates both lists and editor", async (_label, action, operation) => {
    const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    mocks.get.mockReturnValue({ value: "bob" });
    operation.mockResolvedValue({ id });
    expect(await action(id)).toEqual({ ok: true, data: { id } });
    expect(operation).toHaveBeenCalledWith("bob", id);
    expect(mocks.revalidate).toHaveBeenCalledWith("/");
    expect(mocks.revalidate).toHaveBeenCalledWith(`/documents/${id}`);
  });

  it("rejects tampered cookies before deletion or revocation", async () => {
    mocks.get.mockReturnValue({ value: "admin" });
    expect(await deleteDocumentAction("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).toMatchObject({ ok: false, code: "VALIDATION" });
    expect(await unshareDocumentAction("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).toMatchObject({ ok: false, code: "VALIDATION" });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.unshare).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("defaults to Alice only when no cookie exists", async () => {
    expect((await createDocumentAction()).ok).toBe(true);
    expect(mocks.create).toHaveBeenCalledWith("alice");
  });

  it("derives the actor from the server cookie, ignoring attempted owner arguments", async () => {
    mocks.get.mockReturnValue({ value: "bob" });
    await Reflect.apply(createDocumentAction, undefined, [{ ownerId: DEMO_USERS[0].id, user: "alice" }]);
    expect(mocks.create).toHaveBeenCalledWith("bob");
  });

  it("rejects a tampered identity cookie before opening the document service", async () => {
    mocks.get.mockReturnValue({ value: "admin" });
    expect(await createDocumentAction()).toMatchObject({ ok: false, code: "VALIDATION" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("sets only supported demo users with HttpOnly and SameSite protection", async () => {
    expect(await setDemoUserAction("bob")).toMatchObject({ ok: true });
    expect(mocks.set).toHaveBeenCalledWith("minidocs-demo-user", "bob", expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }));
    mocks.set.mockClear();
    expect(await setDemoUserAction("mallory")).toMatchObject({ ok: false, code: "VALIDATION" });
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("uses the current cookie on every save", async () => {
    mocks.get.mockReturnValue({ value: "bob" });
    mocks.save.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", title: "Título", updatedAt: "2026-11-02T12:00:00Z" });
    const input = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", content: { type: "doc", content: [{ type: "paragraph" }] } };
    expect((await saveDocumentAction(input)).ok).toBe(true);
    expect(mocks.save).toHaveBeenCalledWith("bob", input);
  });
});
