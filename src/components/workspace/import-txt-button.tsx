"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { importTxtAction } from "@/app/actions/documents";
import { Icon } from "@/components/ui/icon";
import { MAX_TXT_BYTES } from "@/lib/documents";

export function ImportTxtButton({ disabled }: { disabled: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="import-controls">
      <input ref={input} type="file" hidden accept=".txt,text/plain" aria-label="Select a UTF-8 text file"
        disabled={disabled || pending} onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError(null);
          // Give immediate feedback before Next.js's request-body limit is hit.
          // The server repeats these checks and validates the actual bytes.
          if (!/\.txt$/i.test(file.name)) { setError("Only .txt files are supported."); return; }
          if (file.size === 0) { setError("The text file is empty."); return; }
          if (file.size > MAX_TXT_BYTES) { setError("The file exceeds the 256 KiB limit."); return; }
          const form = new FormData();
          form.set("file", file);
          startTransition(async () => {
            try {
              const result = await importTxtAction(form);
              if (!result.ok) { setError(result.error); return; }
              router.push(`/documents/${result.data.id}`);
            } catch {
              setError("Unable to import the file. Check your connection and try again.");
            }
          });
        }} />
      <button type="button" className="button button--secondary" disabled={disabled || pending}
        aria-describedby="txt-import-help" onClick={() => input.current?.click()}>
        <Icon name="upload" width={17} height={17} />{pending ? "Importing…" : "Import TXT"}
      </button>
      <span id="txt-import-help" className="sr-only">UTF-8 .txt files, up to 256 KiB and 2,000 lines.</span>
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  );
}
