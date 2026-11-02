import { Workspace } from "@/components/workspace/workspace";
import type { DocumentLists } from "@/lib/documents";
import { publicError } from "@/lib/errors";
import { getActiveDemoUser } from "@/server/demo-session";
import { getDocumentService } from "@/server/documents";
import { getServerEnvironment } from "@/server/environment";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getActiveDemoUser();
  const environment = getServerEnvironment();
  let documents: DocumentLists = { owned: [], shared: [] };
  let error: string | null = null;

  if (environment.status === "configured") {
    try {
      documents = await getDocumentService().list(user.handle);
    } catch (failure) {
      error = publicError(failure).message;
    }
  }

  // Only document DTOs, identity and safe status/errors cross this boundary.
  return <Workspace user={user} documents={documents} configuration={environment.status}
    configurationIssues={environment.status === "configured" ? [] : environment.issues} loadError={error} />;
}
