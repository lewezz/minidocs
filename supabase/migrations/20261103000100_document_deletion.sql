-- Apply after the initial schema. Safe to repeat; no existing rows are changed.
-- The elevated server role still relies on application ownership checks.
-- Browser roles remain denied and RLS stays enabled.
begin;

grant delete on table public.documents, public.document_shares to service_role;

commit;
