-- Backfill profiles rows for any auth.users that were created before
-- the profiles_insert_on_auth_user trigger was applied.
insert into profiles (id)
select id from auth.users
where id not in (select id from profiles)
on conflict (id) do nothing;
