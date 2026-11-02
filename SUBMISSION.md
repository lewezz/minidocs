# MiniDocs — Ajaia LLC submission

## Delivery status — 2026-11-03

Mandatory application features are implemented. Local static checks and unit tests pass; actual Supabase persistence, permission enforcement and production-build HTTP server actions have passed. Browser interaction and public production acceptance are not claimed.

- **Source repository URL:** https://github.com/lewezz/minidocs
- **Public application URL:** pending Vercel authentication/deployment. No public URL has been generated in this session.
- **3–5 minute video URL:** pending recording and upload by the candidate.
- **Verification evidence:** `docs/VERIFICATION.md`, `docs/verification/live-supabase.json`, `docs/verification/http-actions.json` and the final checks transcript.
- **Local source package:** `.local/delivery/MiniDocs-source.zip`, prepared during finalization without actual environment files, generated directories or the configured private key. It is ignored by Git/Vercel and must be attached separately if requested. The Git repository is the current source of truth; the ZIP predates this publication update.

Replace pending fields only with real accessible URLs. Check repository and video permissions from a separate browser session before sending them to Ajaia.

## Included requirements

- Create/list/open/rename documents; manual JSON saves and reload persistence.
- Free Tiptap bold, italic, underline, H1–H3, bulleted and numbered lists, configured for Next.js hydration.
- Alice/Bob demo selection, server-derived ownership, owned/shared lists, persisted owner-only sharing and collaborator content editing.
- Server authorization and validation; rejected private access, recipient rename/reshare and invalid actors; duplicate grants prevented.
- UTF-8 `.txt` import with limits, empty/error handling, preserved logical line breaks and literal HTML-looking text.
- Strict TypeScript, pnpm-only workflow, SQL migration/seed, Vitest coverage, private server credentials and Vercel configuration.
- English functional UI, no promotional slogans and authored corner radii within 7px.

The full audit still reports one moderate **development-only** minimatch advisory in ESLint tooling. Production audit reports no known vulnerabilities. This is documented, not suppressed.

## Before submitting

1. Follow `docs/DEPLOYMENT.md` to publish using your own free Vercel account and existing Supabase project. Confirm the production environment variables are present.
2. Complete `docs/MANUAL_ACCEPTANCE.md` on the published URL and record real results. The assistant's database/HTTP checks do not replace this step.
3. Check reviewer access to https://github.com/lewezz/minidocs and confirm its `main` branch includes the application, pnpm lockfile, SQL, tests and documentation. `.env.local`, `.local`, `.next`, `node_modules` and `.vercel` are excluded. A source ZIP, if supplied separately, is only a convenience copy.
4. Record the walkthrough below and upload it with reviewer access. Fill the three URL fields above and send them with the verification status and limitations.

## Video script — target 4 minutes 30 seconds

| Time | Demonstration and narration |
| --- | --- |
| 0:00–0:25 | Show the public URL and MiniDocs document list. Explain Next.js/TypeScript/Tiptap/Supabase and explicitly identify Alice/Bob as a simulation rather than authentication. |
| 0:25–1:25 | Select Alice, create a document and give it a title. Enter a heading and text; demonstrate bold, italic, underline, H1–H3 and both list types. Show Unsaved changes, save, then reload to demonstrate persisted content/format. |
| 1:25–2:35 | Share with Bob. Switch to Bob and open the document from Shared with me. Show the read-only title and absent share control. Add text, save and reload. Switch to Alice and show Bob's saved edit. |
| 2:35–3:15 | Import `samples/demo.txt`. Show Unicode, blank lines and literal markup. Edit, save and reopen the imported document. Briefly show a clear rejected-file error. |
| 3:15–4:00 | Show the service/repository separation, server authorization, composite permission key and private environment-variable names without revealing their values. Show actual test output and separate unit, live database and HTTP verification. |
| 4:00–4:30 | Explain actual Codex involvement and the rich-JSON serialization bug found/fixed. State limits: demo identities, last-write-wins saves, no realtime/history; mention browser E2E/auth/concurrency as next improvements. Show source/documentation links. |

Do not show secret-key values, local environment files, private account information or claim an unrecorded successful operation. If a step fails, correct it and rerun before recording the final video.

## Documentation map

- `README.md`: setup, commands, functionality and current limitations.
- `ARCHITECTURE.md`: layers, data model, permissions, validation and tradeoffs.
- `AI_WORKFLOW.md`: actual AI use, generated changes, corrections/rejected approaches and improvements with 2–4 hours more.
- `docs/DEVELOPMENT_LOG.md`: chronological prompts, decisions, failures and outcomes.
- `docs/VERIFICATION.md`: real results and scope of each verification method.
- `docs/DEPLOYMENT.md` / `docs/MANUAL_ACCEPTANCE.md`: publication and human acceptance instructions.
