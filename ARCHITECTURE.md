# Architecture

MiniDocs is a Next.js App Router application with React, strict TypeScript, Tailwind CSS, Tiptap, and Supabase PostgreSQL. It uses the official Supabase SDK over PostgREST; there is no ORM or separate backend service.

## Request flow

```text
React UI → Next.js server action → validated demo cookie
        → document service → typed Supabase repository → PostgreSQL
```

- `src/app/page.tsx` loads authorized document summaries on the server.
- `src/app/documents/[id]/page.tsx` checks access before returning editor data. Unknown/inaccessible documents return not found.
- `src/app/actions/` exposes creation, save/rename, sharing, TXT import, and demo selection. Expected failures return safe structured results.
- `src/server/documents/service.ts` owns authorization and business rules. It depends on the repository interface, allowing isolated unit tests without pretending they are database tests.
- `src/server/documents/repository.ts` contains typed SQL-facing SDK queries. Lists exclude document content and are filtered by user.
- `src/lib/validation/` validates IDs, titles, file uploads and structured editor JSON.
- `src/components/` contains the functional document list, import control, editor, formatting toolbar, sharing control and identity selector.

## Data model

`demo_users` holds Alice/Bob with stable IDs. `documents` stores UUID, owner FK, title, JSONB content, creation and modification timestamps. `document_shares` grants editor access through a document/user composite primary key.

Sharing uses an idempotent upsert with `ignoreDuplicates`, backed by the composite key. It can only be requested by the owner and targets the other demo identity. Existing permissions are loaded when reopening the editor. Owner-only revocation deletes the exact document/recipient/editor grant and is idempotent. Subsequent reads and saves check access again; already-delivered content and requests already in flight cannot be withdrawn from a browser.

SQL constraints validate basic titles/content, foreign keys, a single editor permission, no self-sharing, immutable ownership, and modification timestamps. `supabase/seed.sql` is repeatable. Apply the initial migration once, followed by `20261103000100_document_deletion.sql`; the latter adds DELETE only for the server role and is safe to repeat. Browser grants and RLS stay unchanged.

Deletion checks the actor, UUID and ownership in the service, then also filters the repository DELETE by document ID and owner ID. PostgreSQL's existing `ON DELETE CASCADE` removes permissions atomically. No title/content validation is needed for deleting an otherwise inaccessible or malformed document: the operation accepts only its validated UUID. The UI asks for explicit confirmation; there is no trash/restore. Removing an imported document uses the same path, as the original TXT is not stored separately.

## Authorization and secrets

The active handle is read from an HttpOnly/SameSite cookie and resolved against Alice/Bob. Missing cookies default to Alice; arbitrary handles are rejected. Creation/import ownership is assigned from that actor, never from an owner supplied by the client.

Owners can read, edit, rename, share, revoke sharing and delete. A permitted collaborator can read/edit content but cannot rename, share, revoke access or delete. Every service operation checks authorization; the UI is not the security boundary. Ownership metadata is checked before full content is loaded.

The server secret bypasses RLS, so application authorization is mandatory. Browser roles have no direct table grants. The SDK and environment loader import `server-only`; private variables have no `NEXT_PUBLIC_` prefix. Error messages omit secret values and raw database failures.

**The selector is a demonstration, not production authentication.** Any visitor can intentionally choose either identity. A real deployment must replace this with authenticated user sessions before storing private production documents.

## Editor and persistence

Tiptap uses the free StarterKit, restricted to the requested formats. The shared schema validates the same nodes and marks on the server. `immediatelyRender: false` defers editor initialization until hydration. ProseMirror's null-prototype attributes are normalized to plain JSON before crossing the React Server Component boundary; this fixed a real rich-document rendering failure found during final verification.

Manual save sends a JSON snapshot. The client records only that snapshot as saved, so edits made during the request stay dirty. Titles/content are saved together for owners; collaborators send content only. Failed saves retain local edits and show an error. Navigation/reload with unsaved edits prompts before discarding.

There is no realtime merge or history. Simultaneous saves use last-write-wins semantics. Current reads are uncached and successful actions revalidate affected routes.

## TXT import

Uploads must be `.txt` (case-insensitive), nonempty, at most 256 KiB, valid UTF-8, and no more than 2,000 lines. BOM is handled; CRLF/CR normalize to LF. Each logical line becomes a paragraph, including empty/trailing lines. Text nodes are built directly: HTML-looking input is literal text, never parsed HTML. File names become validated, length-limited titles. No uploaded file is kept on disk.

Structured documents are limited to 512 KiB, 5,000 nodes and depth 32; titles to 160 Unicode code points on the server. Unknown nodes, attributes, prototype keys and unsafe formats are rejected. Browser MIME labels are not trusted as proof of file contents.

## Deployment and tradeoffs

Node 24 and pnpm 12.16.1 are pinned. Vercel uses the Next.js preset and Corepack commands with a frozen lockfile. Secrets are configured in the deployment environment, not uploaded from local files. The application intentionally fails clearly when configuration is missing.

The simple service/repository architecture, manual saves and two fixed identities keep the assessment focused. Pagination, real authentication, optimistic concurrency, recoverable deletion, rate limiting and broad browser E2E coverage are improvements rather than hidden claims of completion.

Verification levels and real results are documented in `docs/VERIFICATION.md`. Real database and HTTP-action reports are separate from mocked unit tests and from the still-unverified browser walkthrough.
