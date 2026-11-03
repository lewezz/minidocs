"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type MouseEvent } from "react";

import { saveDocumentAction } from "@/app/actions/documents";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { DocumentShareButton } from "@/components/editor/document-share-button";
import { Icon } from "@/components/ui/icon";
import { DemoUserSwitcher } from "@/components/workspace/demo-user-switcher";
import { DeleteDocumentButton } from "@/components/workspace/delete-document-button";
import { DEMO_USERS, type DemoUser } from "@/lib/demo-users";
import { MAX_TITLE_LENGTH, type DocumentRecord } from "@/lib/documents";
import { documentExtensions } from "@/lib/editor/extensions";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export function DocumentEditor({ document, user, canRename, sharedWith }: { document: DocumentRecord; user: DemoUser; canRename: boolean; sharedWith: string[] }) {
  const [title, setTitle] = useState(document.title);
  const [contentJson, setContentJson] = useState(() => JSON.stringify(document.content));
  const [saved, setSaved] = useState(() => ({ title: document.title, contentJson: JSON.stringify(document.content) }));
  const [updatedAt, setUpdatedAt] = useState(document.updatedAt);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = title !== saved.title || contentJson !== saved.contentJson;
  const owner = DEMO_USERS.find((candidate) => candidate.id === document.ownerId);
  const extensions = useMemo(() => documentExtensions(), []);
  const editor = useEditor({
    extensions,
    content: document.content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: { attributes: { role: "textbox", "aria-label": "Document content", "aria-multiline": "true", spellcheck: "true" } },
    onUpdate: ({ editor }) => setContentJson(JSON.stringify(editor.getJSON())),
  });

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function confirmDiscard() {
    return !dirty || window.confirm("You have unsaved changes. Discard them and leave?");
  }

  function guardNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !confirmDiscard()) event.preventDefault();
  }

  function save() {
    if (pending || !editor || !dirty) return;
    const snapshot = { title, contentJson };
    setError(null);
    startTransition(async () => {
      try {
        const payload = { id: document.id, content: JSON.parse(snapshot.contentJson) as unknown };
        const result = await saveDocumentAction(canRename ? { ...payload, title: snapshot.title } : payload);
        if (!result.ok) { setError(result.error); return; }
        // Preserve edits made while the request was in flight.
        setTitle((current) => current === snapshot.title ? result.data.title : current);
        setSaved({ title: result.data.title, contentJson: snapshot.contentJson });
        setUpdatedAt(result.data.updatedAt);
      } catch {
        setError("Unable to save. Your changes are still in the editor. Check your connection and try again.");
      }
    });
  }

  const status = pending ? "Saving…" : error ? "Save failed" : dirty ? "Unsaved changes" : "Saved";

  return (
    <div className="editor-shell">
      <a href="#editor-content" className="skip-link">Skip to editor</a>
      <header className="editor-header">
        <div className="editor-navigation">
          <Link href="/" className="editor-brand" onClick={guardNavigation}>MiniDocs</Link>
          <span aria-hidden="true">/</span>
          <Link href="/" className="editor-back" onClick={guardNavigation}>Back to documents</Link>
        </div>
        <DemoUserSwitcher user={user} beforeChange={confirmDiscard} returnToDocuments />
      </header>

      <main className="editor-main" id="editor-content" tabIndex={-1}>
        <h1 className="sr-only">Document editor</h1>
        <div className="editor-heading">
          <div className="editor-title-group">
            <label htmlFor="document-title" className="sr-only">Document title</label>
            <input id="document-title" className="editor-title" value={title} maxLength={MAX_TITLE_LENGTH}
              readOnly={!canRename} aria-describedby="title-help" onChange={(event) => setTitle(event.target.value)} />
            <p id="title-help" className="title-help">{canRename ? `Up to ${MAX_TITLE_LENGTH} characters.` : "You can edit the content. Only the owner can change the title."}</p>
          </div>
          <div className="editor-save">
            {canRename && <DocumentShareButton id={document.id} user={user} sharedWith={sharedWith} disabled={dirty || pending} />}
            <span className={`save-status ${dirty ? "save-status--dirty" : ""}`} role="status" aria-live="polite">{status}</span>
            <button type="button" className="button button--primary" onClick={save} disabled={pending || !dirty || !editor}>
              <Icon name="check" width={17} height={17} />{pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {canRename && dirty && <p className="title-help share-hint">Save your changes before changing access.</p>}
        {error && <p className="error-notice" role="alert">{error}</p>}
        <section className="editor-surface" aria-label="Text editor">
          {editor ? <EditorToolbar editor={editor} /> : <div className="editor-loading" role="status">Loading editor…</div>}
          <div className="editor-paper"><EditorContent editor={editor} /></div>
        </section>
        <div className="editor-footnote">
          <span>Last saved: <time dateTime={updatedAt}>{dateFormat.format(new Date(updatedAt))} UTC</time></span>
          <span>Owner: {owner?.name ?? "Demo user"}</span>
          {canRename && <DeleteDocumentButton id={document.id} title={title} disabled={pending} returnToDocuments />}
        </div>
        <p className="editor-demo-note" id="demo-explanation">Alice and Bob are demo identities, not secure production authentication.</p>
      </main>
    </div>
  );
}
