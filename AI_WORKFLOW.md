# AI-assisted development workflow

## Actual use of ChatGPT/Codex

The recorded work took place in this Codex assistant conversation against the local MiniDocs workspace. The user supplied the assessment, milestone boundaries, design corrections, English-language requirement and final acceptance scope. No separate ChatGPT planning conversation, additional AI model or unrecorded tool session is claimed. There were no sub-agents.

Codex generated and edited the application, SQL, tests and documentation; inspected local files; consulted primary Next.js/Tiptap/Supabase/Vercel documentation; and executed pnpm commands and explicit verification requests. No AI service is part of the shipped product or required at runtime.

`docs/DEVELOPMENT_LOG.md` records prompts, decisions, failures, corrections and observed results from the first inspection. Historical failed checks are retained rather than rewritten as successful outcomes.

## Main iterations

1. **Foundation:** created explicit Next.js/TypeScript/Tailwind/Vitest configuration and Supabase schema. Initial installation/network restrictions were recorded honestly. The first UI deliberately did not claim document functionality.
2. **Design review:** the user rejected generic promotional styling and requested radii no larger than 7px. The UI was revised; later, slogans, decorative elements and unimplemented placeholder controls were removed.
3. **Documents/editor:** implemented the service/repository boundary, strict JSON validation, Tiptap, persistence actions and demo cookie. Tests exposed mark-order expectations and lint issues, which were corrected.
4. **Configuration diagnosis:** traced a disabled create button to an invalid local secret format. Preserved validation and authorization, exposed safe actionable diagnostics, and did not replace credentials or claim a database write.
5. **English review:** translated visible text, errors, accessibility and dates. The user reported list text; source and served assets were checked, explicit list labels were added, and the page was marked not to be automatically translated. Browser access limitations were not presented as a visual pass.
6. **Final requirements:** implemented owner-only idempotent sharing and validated UTF-8 TXT import; added unit/integration tests, production configuration, real Supabase and HTTP-action checks, and delivery documentation.

## Generated code that needed correction

- Generic initial presentation and slogans were removed following the user's feedback.
- A PostCSS anonymous export triggered lint and was changed to a named configuration variable.
- A CSS cleanup briefly left empty rules and removed the Tailwind import. Build warnings and source inspection caught it; the import and clean rules were restored before the final build.
- ProseMirror normalizes mark order. A failing test was corrected to assert the canonical structure and preserved formatting, rather than assuming input ordering.
- Final real-database checks exposed a rich-document HTTP 500: ProseMirror attributes could have null prototypes, which React Server Components cannot serialize to client props. The validated tree is now normalized through JSON serialization, a regression test covers it, and the actual rich-document requests pass.

## Rejected approaches and checks

- No alternative package manager, ORM, paid Tiptap extension, paid backend, static fake persistence or arbitrary client-supplied owner was used.
- No HTML parser handles imported TXT. Structured text nodes were used instead.
- No weakening of authorization or environment checks was used to make controls appear functional.
- An unrelated hosting workflow was not used: the required stack remains Next.js, Supabase and Vercel.
- A major-version minimatch override was not applied blindly across ESLint consumers. The actual development-only audit finding is reported; production audit results are separate.
- Browser and deployment results were not invented when permissions/session were unavailable.

## Evidence and limits

- Default tests use memory/HTTP simulations and do not establish remote persistence.
- The opt-in integration test performed actual writes, sharing, duplicate checks and rereads in Supabase.
- The HTTP acceptance script exercised real compiled server actions and multipart import against the local production build. It uses the pinned Next.js React Flight codec solely as a test harness.
- Those tests are not browser interaction, visual QA, video recording or public-production verification. See the latest verification/submission status before asserting completion.

## Human review and 2–4 additional hours

The candidate should run and record the browser walkthrough, publish the application under an owned Vercel account, check production logs and submit the real URLs.

With another 2–4 hours, prioritize: a browser E2E suite and accessibility pass; authenticated identities instead of the demo selector; optimistic concurrency protection for simultaneous edits; compatible tooling/security updates; then pagination and sharing revocation. These are explicitly proposed improvements, not implemented features.
