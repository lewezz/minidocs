import "server-only";

import { DEFAULT_TITLE, emptyDocument } from "@/lib/documents";
import { DEMO_USERS } from "@/lib/demo-users";
import { AppError } from "@/lib/errors";
import { validateDocumentContent, validateDocumentId, validateSaveInput } from "@/lib/validation/documents";
import { requireDemoUser } from "@/lib/validation/demo-user";
import { parseTxtImport } from "@/lib/validation/txt-import";
import type { DocumentRepository } from "@/server/documents/types";

const inaccessible = () => new AppError("NOT_FOUND", "The document does not exist or you do not have access.");

export function documentService(repository: DocumentRepository) {
  return {
    async importTxt(handle: unknown, file: unknown) {
      const actor = requireDemoUser(handle);
      const parsed = await parseTxtImport(file);
      const created = await repository.create({ ownerId: actor.id, ...parsed });
      return { ...created, content: validateDocumentContent(created.content) };
    },

    async share(handle: unknown, inputId: unknown) {
      const actor = requireDemoUser(handle);
      const id = validateDocumentId(inputId);
      const access = await repository.findAccess(id, actor.id);
      if (!access) throw inaccessible();
      if (!access.canRename) throw new AppError("FORBIDDEN", "Only the owner can share the document.");
      const recipient = DEMO_USERS.find((user) => user.id !== actor.id);
      if (!recipient) throw new AppError("VALIDATION", "No demo recipient is available.");
      await repository.share(id, recipient.id);
      return { id, recipientId: recipient.id, recipientName: recipient.name };
    },

    async list(handle: unknown) {
      const actor = requireDemoUser(handle);
      return repository.listForUser(actor.id);
    },

    async create(handle: unknown) {
      const actor = requireDemoUser(handle);
      const created = await repository.create({ ownerId: actor.id, title: DEFAULT_TITLE, content: emptyDocument() });
      return { ...created, content: validateDocumentContent(created.content) };
    },

    async get(handle: unknown, inputId: unknown) {
      const actor = requireDemoUser(handle);
      const id = validateDocumentId(inputId);
      const access = await repository.findAccess(id, actor.id);
      if (!access) throw inaccessible();
      const document = await repository.findById(id);
      if (!document) throw inaccessible();
      const sharedWith = access.canRename ? await repository.shareRecipients(id) : [];
      return { document: { ...document, content: validateDocumentContent(document.content) }, canRename: access.canRename, sharedWith };
    },

    async save(handle: unknown, input: unknown) {
      const actor = requireDemoUser(handle);
      const data = validateSaveInput(input);
      const access = await repository.findAccess(data.id, actor.id);
      if (!access) throw inaccessible();
      if ("title" in data && !access.canRename) {
        throw new AppError("FORBIDDEN", "Only the owner can rename the document.");
      }
      const updated = await repository.save(data.id, data);
      if (!updated) throw inaccessible();
      return { id: data.id, title: updated.title, updatedAt: updated.updatedAt };
    },
  };
}
