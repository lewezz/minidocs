import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import type { DocumentSummary } from "@/lib/documents";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export function DocumentList({ documents }: { documents: DocumentSummary[] }) {
  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li key={document.id}>
          <Link href={`/documents/${document.id}`} className="document-row">
            <span className="document-row-icon"><Icon name="document" /></span>
            <span className="document-row-text">
              <strong>{document.title}</strong>
              <span>Last edited: <time dateTime={document.updatedAt}>{dateFormat.format(new Date(document.updatedAt))} UTC</time></span>
            </span>
            <span className="document-open">Open <Icon name="arrow" width={14} height={14} /></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
