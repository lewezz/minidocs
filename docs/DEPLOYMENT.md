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

The existing Supabase project was actually used for creation, JSON persistence, sharing, duplicate prevention, Bob editing and TXT import. No additional migration is needed for these features: the original schema already includes `document_shares` and its primary key.

For a **new** project only, apply `supabase/migrations/20261102000100_initial_schema.sql` once, then `supabase/seed.sql`. Do not reapply the existing migration on a configured database. The seed is repeatable. `supabase/tests/schema.sql` is an optional administrative constraint/grant check that rolls back its writes.

The demo selector deliberately allows either identity. Do not use this assessment deployment to store private production data. The server secret must remain private even in this demo.

References: [Vercel package managers](https://vercel.com/docs/package-managers), [Corepack build configuration](https://vercel.com/docs/builds/configure-a-build), [Node.js runtime versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [CLI deployment](https://vercel.com/docs/cli/deploy).
