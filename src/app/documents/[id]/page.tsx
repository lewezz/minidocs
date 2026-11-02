import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentEditor } from "@/components/editor/document-editor";
import type { DocumentRecord } from "@/lib/documents";
import { AppError, publicError } from "@/lib/errors";
import { validateDocumentId } from "@/lib/validation/documents";
import { getActiveDemoUser } from "@/server/demo-session";
import { getDocumentService } from "@/server/documents";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Document — MiniDocs" };

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try { validateDocumentId(id); } catch { notFound(); }
  const user = await getActiveDemoUser();
  let loaded: { document: DocumentRecord; canRename: boolean; sharedWith: string[] } | null = null;
  let message = "Unable to open the document.";
  try {
    loaded = await getDocumentService().get(user.handle, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    message = publicError(error).message;
  }
  if (!loaded) {
    return (
      <main className="fallback-page">
        <h1>Unable to open the document</h1>
        <p role="alert">{message}</p>
        <Link href="/" className="button button--primary">Back to documents</Link>
      </main>
    );
  }
  return <DocumentEditor key={`${loaded.document.id}:${user.id}`} document={loaded.document} user={user} canRename={loaded.canRename} sharedWith={loaded.sharedWith} />;
}
