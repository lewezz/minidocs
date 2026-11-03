-- Run as administrator after BOTH migrations and seed. All writes roll back.
begin;
set local role service_role;

do $$
declare
  test_id uuid;
  alice_id constant uuid := '11111111-1111-4111-8111-111111111111';
  bob_id constant uuid := '22222222-2222-4222-8222-222222222222';
begin
  insert into public.documents(owner_id, title)
  values (alice_id, 'Lifecycle SQL verification') returning id into test_id;
  insert into public.document_shares(document_id, user_id) values (test_id, bob_id);

  delete from public.document_shares where document_id = test_id and user_id = bob_id;
  if exists (select 1 from public.document_shares where document_id = test_id) then
    raise exception 'FAIL: server-role share revocation';
  end if;
  if not exists (select 1 from public.documents where id = test_id) then
    raise exception 'FAIL: revocation deleted the document';
  end if;

  insert into public.document_shares(document_id, user_id) values (test_id, bob_id);
  delete from public.documents where id = test_id and owner_id = bob_id;
  if not exists (select 1 from public.documents where id = test_id) then
    raise exception 'FAIL: owner predicate ignored';
  end if;
  delete from public.documents where id = test_id and owner_id = alice_id;
  if exists (select 1 from public.documents where id = test_id) then
    raise exception 'FAIL: server-role deletion';
  end if;
  if exists (select 1 from public.document_shares where document_id = test_id) then
    raise exception 'FAIL: permission cascade';
  end if;
  raise notice 'PASS: server DELETE grants, revocation, owner predicate and cascading shares';
end;
$$;

rollback;
