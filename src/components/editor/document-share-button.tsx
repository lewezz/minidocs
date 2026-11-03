"use client";

import { useState, useTransition } from "react";

import { shareDocumentAction, unshareDocumentAction } from "@/app/actions/documents";
import { DEMO_USERS, type DemoUser } from "@/lib/demo-users";

type Props = { id: string; user: DemoUser; sharedWith: string[]; disabled: boolean };

export function DocumentShareButton({ id, user, sharedWith, disabled }: Props) {
  const recipient = DEMO_USERS.find((candidate) => candidate.id !== user.id);
  const [shared, setShared] = useState(() => Boolean(recipient && sharedWith.includes(recipient.id)));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!recipient) return null;

  return (
    <div className="share-control">
      {shared && <span className="share-status" role="status">Shared with {recipient.name}</span>}
      <button type="button" className="button button--secondary" disabled={disabled || pending}
        title={disabled ? "Save your changes before changing access." : undefined}
        onClick={() => {
          if (shared && !window.confirm(`Stop sharing with ${recipient.name}? They will no longer be able to open or save this document.`)) return;
          setError(null);
          startTransition(async () => {
            try {
              const result = await (shared ? unshareDocumentAction(id) : shareDocumentAction(id));
              if (!result.ok) { setError(result.error); return; }
              setShared(!shared);
            } catch { setError("Unable to update sharing. Please try again."); }
          });
        }}>
        {pending ? shared ? "Stopping…" : "Sharing…" : shared ? "Stop sharing" : `Share with ${recipient.name}`}
      </button>
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  );
}
