import { randomUUID } from "node:crypto";
import { vi } from "vitest";

import { DEMO_USERS } from "@/lib/demo-users";
import { emptyDocument, type DocumentSummary } from "@/lib/documents";
import type { DocumentRepository, StoredDocument } from "@/server/documents/types";

export const DOCUMENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

export function memoryRepository() {
  const rows = new Map<string, StoredDocument>([[DOCUMENT_ID, {
    id: DOCUMENT_ID,
    ownerId: DEMO_USERS[0].id,
    title: "Documento privado de Alice",
    content: emptyDocument(),
    createdAt: "2026-11-02T10:00:00.000Z",
    updatedAt: "2026-11-02T10:00:00.000Z",
  }]]);
  const grants = new Set<string>();
  let clock = 0;
  const timestamp = () => new Date(Date.UTC(2026, 10, 2, 12, 0, 0, ++clock)).toISOString();
  const summary = (row: StoredDocument): DocumentSummary => ({
    id: row.id, ownerId: row.ownerId, title: row.title, createdAt: row.createdAt, updatedAt: row.updatedAt,
  });
  const repository = {
    share: vi.fn(async (id: string, userId: string) => { grants.add(`${id}:${userId}`); }),
    shareRecipients: vi.fn(async (id: string) => [...grants].filter((grant) => grant.startsWith(`${id}:`)).map((grant) => grant.slice(id.length + 1))),
    listForUser: vi.fn(async (userId: string) => ({
      owned: [...rows.values()].filter((row) => row.ownerId === userId).map(summary),
      shared: [...rows.values()].filter((row) => grants.has(`${row.id}:${userId}`)).map(summary),
    })),
    findAccess: vi.fn(async (id: string, userId: string) => {
      const row = rows.get(id);
      if (!row || (row.ownerId !== userId && !grants.has(`${id}:${userId}`))) return null;
      return { ownerId: row.ownerId, canRename: row.ownerId === userId };
    }),
    findById: vi.fn(async (id: string) => structuredClone(rows.get(id) ?? null)),
    create: vi.fn(async (input: Parameters<DocumentRepository["create"]>[0]) => {
      const now = timestamp();
      const row = { id: randomUUID(), ...structuredClone(input), createdAt: now, updatedAt: now };
      rows.set(row.id, row);
      return structuredClone(row);
    }),
    save: vi.fn(async (id: string, input: Parameters<DocumentRepository["save"]>[1]) => {
      const row = rows.get(id);
      if (!row) return null;
      const updated = { ...row, content: structuredClone(input.content), title: input.title ?? row.title, updatedAt: timestamp() };
      rows.set(id, updated);
      return structuredClone(updated);
    }),
  } satisfies DocumentRepository;
  return { repository, rows, grants };
}
