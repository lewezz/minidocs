# MiniDocs

Full-stack document editor for the **Ajaia LLC technical assessment**, built with Next.js App Router, React, strict TypeScript, Tailwind CSS, Tiptap, and Supabase PostgreSQL. No ORM.

## Implemented

- Create, list, and open documents at `/documents/[id]`.
- Bold, italic, underline, H1–H3, bulleted lists, and numbered lists.
- Manual saves with structured JSON persistence and unsaved/saving/saved/error states.
- Owner-only document renaming.
- Alice/Bob demo selection persisted in a server-validated cookie.
- Server-side validation and authorization for document operations.
- Owner-only sharing with the other demo user, persisted editor permissions, and separate owned/shared lists.
- UTF-8 TXT import with extension/size/encoding validation, preserved line breaks and literal text handling.

The interface, accessibility labels, validation errors, dates, and new-document titles are in English. Existing document titles and content are user data and are preserved.

TypeScript, lint, **105 unit tests**, and the production build pass. An additional opt-in test has passed against **real Supabase**, including sharing and Bob's edits. Real HTTP server actions and multipart import have also passed against the local production build. These checks do not constitute browser interaction or public deployment verification. See [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Local development

Requirements: Node.js **24.x** and pnpm **12.16.1**, declared in `packageManager`. Use pnpm exclusively and keep `pnpm-lock.yaml` as the only lockfile.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Configure Supabase before testing document creation. If `.env.local` already exists, edit it instead of replacing it. Restart the development server after changing environment variables. Open the address printed by Next.js, usually `http://localhost:3000`.

## Supabase setup

1. Create a free Supabase project.
2. Apply `supabase/migrations/20261102000100_initial_schema.sql` once in the SQL Editor, then run `supabase/seed.sql`. Do not repeat an already applied migration. The seed is repeatable.
3. Set `SUPABASE_URL` and the server secret `SUPABASE_SECRET_KEY=sb_secret_...` in `.env.local`. This application uses the new secret-key format.
4. Run `supabase/tests/schema.sql` as the database administrator to verify constraints and grants. Its writes are rolled back.
5. Restart `pnpm dev`.

Credentials stay in `server-only` modules and must never use a `NEXT_PUBLIC_` prefix. Environment files are ignored except for the empty example.

When configuration is missing or invalid, the application shows the specific issue and disables document creation. It does not substitute localStorage or an in-memory database for PostgreSQL.

## Demo identity and authorization

Any visitor can select Alice or Bob. **This is a demo identity selector, not secure production authentication.** The selected handle is validated and stored in an HttpOnly, SameSite cookie.

Server actions derive the actor from that cookie. The document service validates IDs, titles, and JSON; checks access before returning content or saving; and restricts renaming to the owner. Document owners are assigned on the server.

The secret key bypasses RLS, so application authorization is required for every operation. Browser roles have no direct table access. Document lists are filtered by actor and exclude document content.

Only owners can grant access, targeting the other demo identity. Collaborators can read and save content but cannot rename or share. A composite primary key and idempotent upsert prevent duplicate permissions.

TXT imports accept nonempty `.txt` files up to 256 KiB and 2,000 lines, decoded as UTF-8. Each line becomes a Tiptap paragraph, including blank/trailing lines. HTML-looking text is never interpreted as markup.

## Verification

```sh
pnpm exec tsc --noEmit
pnpm lint
pnpm test:run
pnpm build
pnpm audit
pnpm audit --prod
```

The 105 unit tests cover validation, authorization, sharing, TXT import, operations with a memory repository, server-action identity, mocked SDK queries and configuration rendering. The live test is skipped by default so ordinary tests never write to a remote database.

Explicit live verification creates labeled documents and leaves them in Supabase for inspection. It requires the configured database and a running production server:

```sh
pnpm build
pnpm start --hostname 127.0.0.1 --port 3010
# In another terminal:
MINIDOCS_LIVE_TEST=1 MINIDOCS_TEST_URL=http://127.0.0.1:3010 pnpm --env-file .env.local test:integration
MINIDOCS_LIVE_TEST=1 MINIDOCS_TEST_URL=http://127.0.0.1:3010 pnpm test:http
```

The HTTP harness must run against the matching local build; it uses Next.js's pinned React Flight codec and server-action manifest. It is a backend acceptance check, not a browser test. Reports are written to `docs/verification/`.

The SQL migration, repeatable seed, and schema checks have also passed against isolated local PostgreSQL 17. Audit results and their dates are recorded in [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md) and [docs/VERIFICATION.md](docs/VERIFICATION.md).

Follow [docs/MANUAL_ACCEPTANCE.md](docs/MANUAL_ACCEPTANCE.md) for the full browser workflow. Development decisions and corrections are recorded in [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md).

## Structure

```text
src/app/                    Routes and server actions
src/app/documents/[id]/      Authorized document page
src/components/ui/          Reusable UI elements
src/components/workspace/   Document lists and demo selector
src/components/editor/      Tiptap editor and formatting toolbar
src/lib/                    Domain types, schema, and validation
src/server/                 Session, service, repository, private database client
supabase/migrations/        Reproducible SQL schema
supabase/seed.sql           Alice and Bob
supabase/tests/             SQL checks with rollback
tests/                      Vitest tests and fixtures
scripts/                    Package-manager guard and opt-in HTTP acceptance
samples/demo.txt            UTF-8/line-break/literal-markup import example
docs/                       Development log, verification, and manual workflow
```

See [src/server/README.md](src/server/README.md) for the server boundary.

## Deployment and delivery

The project is prepared for Vercel with Node 24, Corepack/pnpm, a frozen lockfile and private environment variables. The CLI has no authenticated session in the recorded environment, so no public URL is claimed. Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) to publish.

[SUBMISSION.md](SUBMISSION.md) contains the delivery checklist and a 3–5 minute video script. [ARCHITECTURE.md](ARCHITECTURE.md) describes boundaries and tradeoffs; [AI_WORKFLOW.md](AI_WORKFLOW.md) records actual AI involvement.

Known limits: demo identities are not authentication; concurrent saves use last-write-wins; there is no realtime collaboration, comments, history, deletion or sharing revocation. One moderate development-only minimatch advisory remains in the full audit; the production audit reports no known vulnerabilities. Browser walkthrough, public deployment and the actual video remain to be completed by the candidate unless subsequent evidence records them.
# minidocs
