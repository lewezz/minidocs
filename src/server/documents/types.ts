import type { DocumentContent, DocumentLists, DocumentRecord } from "@/lib/documents";

export type DocumentAccess = { ownerId: string; canRename: boolean };
export type StoredDocument = Omit<DocumentRecord, "content"> & { content: unknown };

export interface DocumentRepository {
  listForUser(userId: string): Promise<DocumentLists>;
  findAccess(id: string, userId: string): Promise<DocumentAccess | null>;
  findById(id: string): Promise<StoredDocument | null>;
  create(input: { ownerId: string; title: string; content: DocumentContent }): Promise<StoredDocument>;
  save(id: string, input: { content: DocumentContent; title?: string }): Promise<StoredDocument | null>;
  share(id: string, userId: string): Promise<void>;
  unshare(id: string, userId: string): Promise<void>;
  remove(id: string, ownerId: string): Promise<boolean>;
  shareRecipients(id: string): Promise<string[]>;
}
