import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { DeleteDocumentButton } from "@/components/workspace/delete-document-button";
import type { DocumentSummary } from "@/lib/documents";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export function DocumentList({ documents, allowDelete = false }: { documents: DocumentSummary[]; allowDelete?: boolean }) {
  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li key={document.id} className="document-list-item">
          <Link href={`/documents/${document.id}`} className="document-row">
            <span className="document-row-icon"><Icon name="document" /></span>
            <span className="document-row-text">
              <strong>{document.title}</strong>
              <span>Last edited: <time dateTime={document.updatedAt}>{dateFormat.format(new Date(document.updatedAt))} UTC</time></span>
            </span>
            <span className="document-open">Open <Icon name="arrow" width={14} height={14} /></span>
          </Link>
          {allowDelete && <div className="document-list-actions"><DeleteDocumentButton id={document.id} title={document.title} /></div>}
        </li>
      ))}
    </ul>
  );
}
