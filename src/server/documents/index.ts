import "server-only";

import { createSupabaseAdminClient } from "@/server/db/supabase";
import { supabaseDocumentRepository } from "@/server/documents/repository";
import { documentService } from "@/server/documents/service";

export function getDocumentService() {
  return documentService(supabaseDocumentRepository(createSupabaseAdminClient()));
}
