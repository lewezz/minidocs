# Server boundary

`environment.ts` reads private configuration and `db/supabase.ts` creates the elevated Supabase client. Both import `server-only`.

- `demo-session.ts` resolves the validated Alice/Bob handle from an HttpOnly cookie. Only an absent cookie defaults to Alice; invalid handles are rejected.
- `documents/repository.ts` uses typed Supabase/PostgREST queries without an ORM. Lists filter by actor and exclude document content. Access checks retrieve ownership metadata and any existing editor permission.
- `documents/service.ts` validates IDs, titles, JSON and TXT imports, checks access before returning content or saving, and allows only owners to rename/share documents. Its repository interface supports isolated unit tests.
- `src/app/actions/` derives the actor from the server cookie, calls the service, returns safe public errors, and revalidates routes.
- `db/database.types.ts` describes the checked-in SQL tables and relationships. It is not an ORM or migration runner.

The secret key bypasses RLS. Application authorization therefore runs for every operation. New-document ownership is assigned from the validated server actor, and arbitrary client ownership fields are rejected.

Sharing targets the other fixed demo identity, uses an idempotent repository upsert and is backed by a composite database primary key. Recipients can edit content but cannot rename or reshare. Import creates a new document owned by the server-resolved actor and builds text nodes without parsing HTML.

Deletion and revocation require the owner. Removal is additionally filtered by document and owner IDs in SQL, and cascading foreign keys remove only that document's grants. Revocation removes only the other demo user's editor permission; the document stays intact. Every subsequent read/save rechecks access. Apply the incremental deletion migration for the server role's DELETE grants; it adds no browser privileges.

The demo selector does not authenticate a person: any visitor can choose Alice or Bob. HttpOnly and SameSite do not make it production authentication.
