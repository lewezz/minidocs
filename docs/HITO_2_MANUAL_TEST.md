# Milestone 2 — Manual verification

This is the historical Milestone 2 checklist. The final implementation also includes sharing and TXT import; use [MANUAL_ACCEPTANCE.md](MANUAL_ACCEPTANCE.md) for the complete delivery workflow.

These are expected results, not a completed browser test. Supabase configuration and a browser are required. Memory-repository and mocked-HTTP tests do not replace this workflow.

## Setup

1. Apply `supabase/migrations/20261102000100_initial_schema.sql` once, then `supabase/seed.sql`, in your free Supabase project. Do not repeat an applied migration. The seed is repeatable.
2. Run `supabase/tests/schema.sql` as administrator to check constraints and grants. Its writes are rolled back.
3. Configure `SUPABASE_URL` and the server secret `SUPABASE_SECRET_KEY=sb_secret_...` in `.env.local`. Never use a public environment-variable prefix for the secret or commit it.
4. Install with `pnpm install --frozen-lockfile` if needed, then run `pnpm dev`. Restart after changing environment variables and open the printed URL.

## Workflow

| Step | Action | Expected result |
| --- | --- | --- |
| 1 | Select Alice and reload. | Alice remains selected and the lists belong to that demo identity. |
| 2 | Select **New document**. | PostgreSQL receives a document owned by Alice and the app opens `/documents/<uuid>`. The initial title is **Untitled document** and the empty document is saved. |
| 3 | Change the title to **Meeting notes**. | The status becomes **Unsaved changes**. |
| 4 | Enter paragraphs, including UTF-8 text, and apply bold, italic, underline, H1/H2/H3, bulleted lists, and numbered lists. | The toolbar reflects the selection and the content displays the formatting. |
| 5 | Select **Save**. | **Saving…** changes to **Saved**. PostgreSQL stores structured JSONB and updates `updated_at`. |
| 6 | Reload, return to **My documents**, and reopen the document. | The title, content, formatting, and owner are preserved. |
| 7 | Change only the title, save, and reload. | The new title persists. |
| 8 | Enter a whitespace-only title and save. | The server rejects it and shows an English error without losing local changes. Correct the title and retry. The field and server both enforce length limits. |
| 9 | Edit without saving, then navigate back or switch identity. | Discard confirmation appears in English. Canceling keeps the editor. Reloading/closing uses the browser's native unsaved-changes warning. |
| 10 | Return to the list and select Bob. | Alice's private document is absent from Bob's lists. |
| 11 | As Bob, open Alice's private document URL directly. | The server returns **Page not found** without the private content or editor. |
| 12 | Create and save a document as Bob, then return to Alice. | Each owner's list stays separate. |

To check network errors, edit an open document, disconnect the browser, and select **Save**. The error should be in English and local edits should remain available. Restore the connection and save before leaving.

## Scope and language

- Alice/Bob are selectable demo identities, not secure production authentication.
- This historical workflow covers the document/editor subset. Sharing and TXT import were added during finalization; realtime collaboration, comments and history remain outside the required scope.
- Sharing is now verified by separate unit, actual Supabase and HTTP checks; see `VERIFICATION.md` for the distinction from browser acceptance.
- Existing document titles and content retain their original language. Translating the application does not rewrite user data.
- Record actual browser and database results in `docs/VERIFICATION.md`.
