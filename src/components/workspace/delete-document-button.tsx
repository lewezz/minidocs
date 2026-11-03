"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteDocumentAction } from "@/app/actions/documents";

type Props = { id: string; title: string; disabled?: boolean; returnToDocuments?: boolean };

export function DeleteDocumentButton({ id, title, disabled = false, returnToDocuments = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="delete-control">
      <button type="button" className="button button--danger" disabled={disabled || pending}
        aria-label={`Delete ${title}`} onClick={() => {
          if (!window.confirm(`Permanently delete "${title}"? This removes it for everyone, including shared access. Any unsaved changes will be lost. This cannot be undone.`)) return;
          setError(null);
          startTransition(async () => {
            try {
              const result = await deleteDocumentAction(id);
              if (!result.ok) { setError(result.error); return; }
              if (returnToDocuments) router.replace("/");
              router.refresh();
            } catch {
              setError("Unable to delete the document. Please try again.");
            }
          });
        }}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  );
}
