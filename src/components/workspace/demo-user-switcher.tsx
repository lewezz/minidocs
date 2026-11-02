"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setDemoUserAction } from "@/app/actions/demo-user";
import { UserSelector } from "@/components/workspace/user-selector";
import type { DemoUser } from "@/lib/demo-users";

type Props = { user: DemoUser; beforeChange?: () => boolean; returnToDocuments?: boolean };

export function DemoUserSwitcher({ user, beforeChange, returnToDocuments = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="demo-switcher" aria-busy={pending}>
      <UserSelector user={user} disabled={pending} onChange={(selected) => {
        if (beforeChange && !beforeChange()) return;
        setError(null);
        startTransition(async () => {
          try {
            const result = await setDemoUserAction(selected.handle);
            if (!result.ok) { setError(result.error); return; }
            if (returnToDocuments) router.push("/");
            router.refresh();
          } catch {
            setError("Unable to switch users. Please try again.");
          }
        });
      }} />
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  );
}
