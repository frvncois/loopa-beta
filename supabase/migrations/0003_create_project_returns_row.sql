-- Migration 0003: make create_project return the full projects row.
-- This eliminates the second SELECT round-trip that was needed after
-- the function previously returned only the new row's uuid.
-- All plan-limit logic and slug generation are unchanged.

drop function if exists create_project(text, jsonb);

create or replace function create_project(name text, data jsonb)
returns projects
language plpgsql security definer as $$
declare
  v_user_id   uuid := auth.uid();
  v_plan      text;
  v_count     int;
  v_slug      text;
  v_row       projects;
begin
  select plan into v_plan from profiles where id = v_user_id;

  if v_plan = 'free' then
    select count(*) into v_count
    from projects
    where owner_id = v_user_id and trashed_at is null;

    if v_count >= 3 then
      raise exception 'plan_limit: free plan allows a maximum of 3 projects';
    end if;
  end if;

  -- Generate 8-char nanoid-style slug (unchanged)
  v_slug := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into projects (slug, owner_id, name, data)
  values (v_slug, v_user_id, name, data)
  returning * into v_row;

  return v_row;
end;
$$;
