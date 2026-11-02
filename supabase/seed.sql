-- Re-runnable. IDs match src/lib/demo-users.ts. Run after the migration.
begin;

insert into public.demo_users (id, handle, display_name)
values
  ('11111111-1111-4111-8111-111111111111', 'alice', 'Alice'),
  ('22222222-2222-4222-8222-222222222222', 'bob', 'Bob')
on conflict (id) do update
set handle = excluded.handle, display_name = excluded.display_name;

commit;
