import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DocumentSummary } from "@/lib/documents";
import { AppError } from "@/lib/errors";
import type { Database } from "@/server/db/database.types";
import type { DocumentRepository, StoredDocument } from "@/server/documents/types";

const summaryColumns = "id,owner_id,title,created_at,updated_at";
const documentColumns = "id,owner_id,title,content,created_at,updated_at";

type SummaryRow = Omit<Database["public"]["Tables"]["documents"]["Row"], "content">;

function summary(row: SummaryRow): DocumentSummary {
  return { id: row.id, ownerId: row.owner_id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at };
}

function document(row: Database["public"]["Tables"]["documents"]["Row"]): StoredDocument {
  return { ...summary(row), content: row.content };
}

function databaseFailure(): never {
  // Never expose database messages, request payloads, project URLs or credentials.
  throw new AppError("PERSISTENCE", "Unable to access documents. Check the Supabase connection and configuration.");
}

export function supabaseDocumentRepository(client: SupabaseClient<Database>): DocumentRepository {
  return {
    async remove(id, ownerId) {
      const { data, error } = await client.from("documents").delete()
        .eq("id", id).eq("owner_id", ownerId).select("id").maybeSingle();
      if (error) databaseFailure();
      // The existing FK removes this document's permissions in the same transaction.
      return data !== null;
    },

    async unshare(id, userId) {
      const { error } = await client.from("document_shares").delete()
        .eq("document_id", id).eq("user_id", userId).eq("permission", "editor");
      if (error) databaseFailure();
    },

    async share(id, userId) {
      const { error } = await client.from("document_shares").upsert(
        { document_id: id, user_id: userId, permission: "editor" },
        { onConflict: "document_id,user_id", ignoreDuplicates: true },
      );
      if (error) databaseFailure();
    },

    async shareRecipients(id) {
      const { data, error } = await client.from("document_shares").select("user_id").eq("document_id", id).eq("permission", "editor");
      if (error) databaseFailure();
      return data.map((row) => row.user_id);
    },

    async listForUser(userId) {
      const [owned, shared] = await Promise.all([
        client.from("documents").select(summaryColumns).eq("owner_id", userId).order("updated_at", { ascending: false }),
        client.from("document_shares").select("document:documents!inner(id,owner_id,title,created_at,updated_at)")
          .eq("user_id", userId).eq("permission", "editor"),
      ]);
      if (owned.error || shared.error) databaseFailure();
      return {
        owned: owned.data.map(summary),
        shared: shared.data.map((row) => summary(row.document)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      };
    },

    async findAccess(id, userId) {
      // Read only ownership metadata before allowing access to the document JSON.
      const { data: owner, error } = await client.from("documents").select("owner_id").eq("id", id).maybeSingle();
      if (error) databaseFailure();
      if (!owner) return null;
      if (owner.owner_id === userId) return { ownerId: owner.owner_id, canRename: true };
      const share = await client.from("document_shares").select("permission")
        .eq("document_id", id).eq("user_id", userId).eq("permission", "editor").maybeSingle();
      if (share.error) databaseFailure();
      return share.data ? { ownerId: owner.owner_id, canRename: false } : null;
    },

    async findById(id) {
      const { data, error } = await client.from("documents").select(documentColumns).eq("id", id).maybeSingle();
      if (error) databaseFailure();
      return data ? document(data) : null;
    },

    async create(input) {
      const { data, error } = await client.from("documents")
        .insert({ owner_id: input.ownerId, title: input.title, content: input.content }).select(documentColumns).single();
      if (error) databaseFailure();
      return document(data);
    },

    async save(id, input) {
      const patch = "title" in input ? { title: input.title, content: input.content } : { content: input.content };
      const { data, error } = await client.from("documents").update(patch).eq("id", id).select(documentColumns).maybeSingle();
      if (error) databaseFailure();
      return data ? document(data) : null;
    },
  };
}
