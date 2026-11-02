-- Apply once to a new Supabase project, then run ../seed.sql.
-- No Supabase Auth: Alice/Bob are demo identities resolved by the application.
begin;

create table public.demo_users (
  id uuid primary key,
  handle text not null unique check (handle in ('alice', 'bob')),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.demo_users(id) on delete restrict,
  title text not null default 'Documento sin título',
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_title_valid check (
    char_length(title) between 1 and 160
    and title = btrim(title)
    and title !~ '[[:cntrl:]]'
  ),
  -- Structural baseline only. The service will validate the full Tiptap schema.
  -- IS TRUE rejects missing keys as well as false predicates (SQL NULL semantics).
  constraint documents_content_root_valid check ((
    jsonb_typeof(content) = 'object'
    and content ->> 'type' = 'doc'
    and jsonb_typeof(content -> 'content') = 'array'
    and jsonb_array_length(content -> 'content') > 0
    and octet_length(content::text) <= 1048576
  ) is true)
);

create table public.document_shares (
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.demo_users(id) on delete cascade,
  permission text not null default 'editor' check (permission = 'editor'),
  created_at timestamptz not null default now(),
  primary key (document_id, user_id)
);

create index documents_owner_updated_idx on public.documents(owner_id, updated_at desc);
create index document_shares_user_idx on public.document_shares(user_id, document_id);

create function public.touch_document()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Document ownership cannot be transferred' using errcode = '23514';
  end if;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger documents_before_update
before update on public.documents
for each row execute function public.touch_document();

create function public.reject_owner_share()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.documents
    where id = new.document_id and owner_id = new.user_id
  ) then
    raise exception 'A document owner already has access' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger document_shares_before_write
before insert or update on public.document_shares
for each row execute function public.reject_owner_share();

-- No browser access. RLS has no anon/authenticated policies (default deny).
-- Secret keys map to the elevated service_role and bypass RLS.
-- Server services MUST separately authorize all document reads and writes.
alter table public.demo_users enable row level security;
alter table public.documents enable row level security;
alter table public.document_shares enable row level security;

revoke all on table public.demo_users, public.documents, public.document_shares from public, anon, authenticated, service_role;
revoke all on function public.touch_document(), public.reject_owner_share() from public, anon, authenticated, service_role;

grant usage on schema public to service_role;
grant select on table public.demo_users to service_role;
grant select, insert, update on table public.documents, public.document_shares to service_role;
grant execute on function public.touch_document(), public.reject_owner_share() to service_role;

commit;
