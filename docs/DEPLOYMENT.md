# Vercel deployment

## Recorded status

The local production build and actual Supabase/HTTP acceptance checks pass. `pnpm dlx vercel@65.9.0 whoami` reports **Logged out** in the recorded environment. No Vercel project, successful upload or public URL is claimed.

## Publish using a free Hobby account

1. Keep Node **24.x** and pnpm **12.16.1**. Run `pnpm install --frozen-lockfile` and `pnpm build`.
2. Authenticate under your own Vercel account:

   ```sh
   pnpm dlx vercel@65.9.0 login
   pnpm dlx vercel@65.9.0 link
   ```

   Select/create the MiniDocs project in your free personal account. Keep Next.js as the framework and Node.js 24.x in project settings. A Git repository is optional for CLI deployment. The source repository is https://github.com/lewezz/minidocs; it can also be imported directly in the Vercel dashboard.

3. Add these values to the project for **Production** (and **Preview** if previews will be used). Use the dashboard or the interactive CLI prompts; do not put actual secrets in commands, screenshots, source files or the submission:

   ```sh
   pnpm dlx vercel@65.9.0 env add SUPABASE_URL production
   pnpm dlx vercel@65.9.0 env add SUPABASE_SECRET_KEY production
   pnpm dlx vercel@65.9.0 env add ENABLE_EXPERIMENTAL_COREPACK production
   ```

   `SUPABASE_URL` is the existing project URL, `SUPABASE_SECRET_KEY` is the existing **server secret** (`sb_secret_...`), and `ENABLE_EXPERIMENTAL_COREPACK` must be `1`. Corepack selects the package manager declared in `package.json`. Do not prefix the Supabase variables with `NEXT_PUBLIC_`.

4. Deploy:

   ```sh
   pnpm dlx vercel@65.9.0 deploy --prod
   ```

   `vercel.json` runs `corepack pnpm install --frozen-lockfile` and `corepack pnpm build`; no alternative package manager or output-directory override is needed. `.vercelignore` excludes local environment files, backups, dependencies and build output.

5. Save the **actual** successful deployment URL in `SUBMISSION.md`. If an imported Git project is preferred, push the reviewed source to your own repository and connect it with the same runtime/env settings. Never push `.env.local` or `.local/`.
6. Open that URL, verify Supabase is connected, and execute `MANUAL_ACCEPTANCE.md`. Check deployment logs if an operation fails. A successful local build does not prove public production behavior.

## Database

The existing Supabase project was actually used for creation, JSON persistence, sharing, duplicate prevention, Bob editing and TXT import. Deletion and revocation, added later, require the incremental migration below because the initial server role grants did not include DELETE:

```sql
grant delete on table public.documents, public.document_shares to service_role;
```

This is checked in as `supabase/migrations/20261103000100_document_deletion.sql`. Run it in the existing project's SQL Editor before using Delete/Stop sharing. It is safe to repeat and changes no existing documents, browser access or RLS. A real empty-delete preflight initially returned 403 / `42501` for both tables; newer live verification, if present, is recorded separately.

For a **new** project only, apply both migrations in filename order, then `supabase/seed.sql`. Do not reapply the initial migration on a configured database. The seed is repeatable. `supabase/tests/schema.sql` and `supabase/tests/document-lifecycle.sql` are optional administrative checks that roll back their writes.

The demo selector deliberately allows either identity. Do not use this assessment deployment to store private production data. The server secret must remain private even in this demo.

References: [Vercel package managers](https://vercel.com/docs/package-managers), [Corepack build configuration](https://vercel.com/docs/builds/configure-a-build), [Node.js runtime versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [CLI deployment](https://vercel.com/docs/cli/deploy).
