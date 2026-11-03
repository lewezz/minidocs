-- Run as the project database administrator AFTER migration + seed.
-- All test writes are rolled back. Stops at the first failed assertion.
begin;

do $$
declare
  test_document_id uuid;
  alice_id constant uuid := '11111111-1111-4111-8111-111111111111';
  bob_id constant uuid := '22222222-2222-4222-8222-222222222222';
  table_name text;
  role_name text;
  privilege_name text;
begin
  if (select count(*) from public.demo_users where
    (id = alice_id and handle = 'alice' and display_name = 'Alice') or
    (id = bob_id and handle = 'bob' and display_name = 'Bob')) <> 2 then
    raise exception 'FAIL: demo seed';
  end if;

  insert into public.documents(owner_id, title)
  values (alice_id, 'Verificación temporal') returning id into test_document_id;

  insert into public.document_shares(document_id, user_id)
  values (test_document_id, bob_id);

  begin
    insert into public.document_shares(document_id, user_id) values (test_document_id, bob_id);
    raise exception 'FAIL: duplicate share accepted';
  exception when unique_violation then null;
  end;

  begin
    insert into public.document_shares(document_id, user_id) values (test_document_id, alice_id);
    raise exception 'FAIL: owner share accepted';
  exception when check_violation then null;
  end;

  begin
    update public.documents set owner_id = bob_id where id = test_document_id;
    raise exception 'FAIL: ownership transfer accepted';
  exception when check_violation then null;
  end;

  begin
    update public.documents set title = '  ' where id = test_document_id;
    raise exception 'FAIL: blank title accepted';
  exception when check_violation then null;
  end;

  begin
    update public.documents set content = '{}'::jsonb where id = test_document_id;
    raise exception 'FAIL: missing document root accepted';
  exception when check_violation then null;
  end;

  update public.documents set title = 'UTF-8: café · 日本語', updated_at = '2000-01-01'::timestamptz
  where id = test_document_id;
  if (select updated_at from public.documents where id = test_document_id) <> now() then
    raise exception 'FAIL: updated_at trigger';
  end if;

  foreach table_name in array array['demo_users', 'documents', 'document_shares'] loop
    if not (select relrowsecurity from pg_class where oid = format('public.%I', table_name)::regclass) then
      raise exception 'FAIL: RLS disabled on %', table_name;
    end if;
    foreach role_name in array array['anon', 'authenticated'] loop
      foreach privilege_name in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
        if has_table_privilege(role_name, format('public.%I', table_name), privilege_name) then
          raise exception 'FAIL: browser role % has % on %', role_name, privilege_name, table_name;
        end if;
      end loop;
    end loop;
  end loop;

  foreach table_name in array array['documents', 'document_shares'] loop
    if not has_table_privilege('service_role', format('public.%I', table_name), 'DELETE') then
      raise exception 'FAIL: apply the document deletion migration for %', table_name;
    end if;
  end loop;

  raise notice 'PASS: seed, constraints, sharing integrity, timestamp and browser grants';
end;
$$;

rollback;
