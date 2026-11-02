"use client";

import { useState, useTransition } from "react";

import { shareDocumentAction } from "@/app/actions/documents";
import { DEMO_USERS, type DemoUser } from "@/lib/demo-users";

type Props = { id: string; user: DemoUser; sharedWith: string[]; disabled: boolean };

export function DocumentShareButton({ id, user, sharedWith, disabled }: Props) {
  const recipient = DEMO_USERS.find((candidate) => candidate.id !== user.id);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!recipient) return null;
  const shared = done || sharedWith.includes(recipient.id);

  return (
    <div className="share-control">
      <button type="button" className="button button--secondary" disabled={disabled || pending || shared}
        title={disabled && !shared ? "Save your changes before sharing." : undefined}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await shareDocumentAction(id);
              if (!result.ok) { setError(result.error); return; }
              setDone(true);
            } catch { setError("Unable to share the document. Please try again."); }
          });
        }}>
        {pending ? "Sharing…" : shared ? `Shared with ${recipient.name}` : `Share with ${recipient.name}`}
      </button>
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  );
}
