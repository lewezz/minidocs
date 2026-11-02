"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createDocumentAction } from "@/app/actions/documents";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { DemoUserSwitcher } from "@/components/workspace/demo-user-switcher";
import { DocumentList } from "@/components/workspace/document-list";
import { ImportTxtButton } from "@/components/workspace/import-txt-button";
import type { DemoUser } from "@/lib/demo-users";
import type { DocumentLists } from "@/lib/documents";

type WorkspaceProps = {
  configuration: "missing" | "invalid" | "configured";
  configurationIssues: string[];
  user: DemoUser;
  documents: DocumentLists;
  loadError: string | null;
};

export function Workspace({ configuration, configurationIssues, user, documents, loadError }: WorkspaceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);
  const ownedCount = loadError ? "—" : String(documents.owned.length);
  const sharedCount = loadError ? "—" : String(documents.shared.length);

  function createDocument() {
    setCreateError(null);
    startTransition(async () => {
      try {
        const result = await createDocumentAction();
        if (!result.ok) { setCreateError(result.error); return; }
        router.push(`/documents/${result.data.id}`);
      } catch {
        setCreateError("Unable to create the document. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="workspace-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="sidebar" aria-label="Workspace">
        <Link href="/" className="brand" aria-label="MiniDocs home">
          <span>MiniDocs</span>
        </Link>

        <div className="sidebar-content">
          <nav aria-label="Documents" className="sidebar-nav">
            <a href="#my-documents" className="nav-item nav-item--primary" aria-label="My documents">
              <span className="nav-label">My documents</span><span className="nav-count">{ownedCount}</span>
            </a>
            <a href="#shared-documents" className="nav-item" aria-label="Shared with me">
              <span className="nav-label">Shared with me</span>
            </a>
          </nav>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <DemoUserSwitcher user={user} />
        </header>

        <main id="main-content" className="content" tabIndex={-1}>
          <div className="page-intro">
            <h1>Documents</h1>
            <div className="page-actions">
              <ImportTxtButton disabled={pending || configuration !== "configured"} />
              <button type="button" className="button button--primary" disabled={pending || configuration !== "configured"}
                aria-describedby={configuration !== "configured" ? "create-configuration" : undefined} onClick={createDocument}>
                <Icon name="plus" width={18} height={18} />{pending ? "Creating…" : "New document"}
              </button>
            </div>
          </div>

          {configuration !== "configured" ? (
            <div className="setup-notice" id="create-configuration" role="status">
              <span className="notice-badge">CONFIGURATION</span>
              <div>
                <p>Document creation is unavailable until the server configuration is fixed.</p>
                <ul className="configuration-issues">
                  {configurationIssues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
                <p>Update .env.local and restart the server.</p>
              </div>
            </div>
          ) : null}
          {(loadError || createError) && (
            <div className="error-notice" role="alert">
              <p>{createError ?? loadError}</p>
              {loadError && <button type="button" className="text-button" onClick={() => router.refresh()}>Reload</button>}
            </div>
          )}

          <section id="my-documents" aria-labelledby="owned-heading" className="document-section">
            <div className="section-heading">
              <div><h2 id="owned-heading">My documents</h2><span className="count-badge">{ownedCount}</span></div>
            </div>
            <div className={`document-panel ${documents.owned.length ? "document-panel--filled" : ""}`}>
              {documents.owned.length ? <DocumentList documents={documents.owned} /> :
                <EmptyState title={loadError ? "Documents unavailable" : "No documents yet"} description={loadError ? "Reload to try again." : "Select New document to create one."} />}
            </div>
          </section>

          <section id="shared-documents" aria-labelledby="shared-heading" className="document-section">
            <div className="section-heading">
              <div><h2 id="shared-heading">Shared with me</h2><span className="count-badge">{sharedCount}</span></div>
            </div>
            <div className={`document-panel document-panel--shared ${documents.shared.length ? "document-panel--filled" : ""}`}>
              {documents.shared.length ? <DocumentList documents={documents.shared} /> :
                <EmptyState title={loadError ? "Documents unavailable" : "No shared documents"} />}
            </div>
          </section>

          <div className="workspace-info">
            <p id="demo-explanation">Alice and Bob are demo identities, not secure production authentication.</p>
            <p className="configuration-status"><span className={`status-dot ${configuration === "configured" ? "status-dot--present" : "status-dot--pending"}`} />
              {configuration === "configured" ? (loadError ? "Connection error" : "Connected to Supabase") : configuration === "invalid" ? "Check Supabase configuration" : "Supabase is not configured"}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
