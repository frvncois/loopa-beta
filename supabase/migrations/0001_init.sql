-- Loopa initial schema
-- Apply via: supabase db push  OR  paste into Supabase SQL editor

-- ─────────────────────────────────────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────────────────────────────────────

create table profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  display_name             text,
  avatar_url               text,
  plan                     text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id       text,
  stripe_subscription_id   text,
  subscription_status      text,                        -- 'active', 'canceled', 'past_due', null
  subscription_period_end  timestamptz,                 -- when canceled subs lose pro
  notification_prefs       jsonb not null default '{}'::jsonb,
  storage_used_bytes       bigint not null default 0,   -- denormalized; recalculated by trigger
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: owner select"
  on profiles for select using (auth.uid() = id);

create policy "profiles: owner update"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile row when a new auth user is created
create or replace function profiles_insert_on_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger profiles_insert_on_auth_user
  after insert on auth.users
  for each row execute procedure profiles_insert_on_auth_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Projects
-- ─────────────────────────────────────────────────────────────────────────────

create table projects (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,               -- 8-char nanoid
  owner_id            uuid not null references profiles(id) on delete cascade,
  name                text not null default 'Untitled',
  data                jsonb not null,                     -- ProjectData
  thumbnail_url       text,
  version             integer not null default 1,         -- optimistic concurrency
  storage_used_bytes  bigint not null default 0,
  trashed_at          timestamptz,                        -- non-null = soft-deleted
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index projects_owner_id_idx      on projects(owner_id) where trashed_at is null;
create index projects_owner_trashed_idx on projects(owner_id) where trashed_at is not null;

alter table projects enable row level security;

create policy "projects: owner select"
  on projects for select using (auth.uid() = owner_id);

create policy "projects: owner update"
  on projects for update using (auth.uid() = owner_id);

create policy "projects: owner delete"
  on projects for delete using (auth.uid() = owner_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on projects
  for each row execute procedure set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Project version snapshots (lite history)
-- ─────────────────────────────────────────────────────────────────────────────

create table project_versions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  data        jsonb not null,
  version     integer not null,
  created_at  timestamptz not null default now()
);

create index project_versions_project_id_created_idx
  on project_versions(project_id, created_at desc);

alter table project_versions enable row level security;

create policy "project_versions: owner select"
  on project_versions for select
  using (exists (
    select 1 from projects
    where projects.id = project_versions.project_id
      and projects.owner_id = auth.uid()
  ));

-- Prune to 10 most recent snapshots per project on insert
create or replace function prune_old_versions()
returns trigger language plpgsql as $$
begin
  delete from project_versions
  where project_id = new.project_id
    and id not in (
      select id from project_versions
      where project_id = new.project_id
      order by created_at desc
      limit 10
    );
  return null;
end;
$$;

create trigger prune_old_versions
  after insert on project_versions
  for each row execute procedure prune_old_versions();

-- ─────────────────────────────────────────────────────────────────────────────
-- Project media
-- ─────────────────────────────────────────────────────────────────────────────

create table project_media (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  storage_id  text not null unique,                      -- key in Supabase Storage
  size_bytes  bigint not null,
  mime_type   text not null,
  created_at  timestamptz not null default now()
);

create index project_media_project_id_idx on project_media(project_id);

alter table project_media enable row level security;

create policy "project_media: owner select"
  on project_media for select
  using (exists (
    select 1 from projects
    where projects.id = project_media.project_id
      and projects.owner_id = auth.uid()
  ));

create policy "project_media: owner insert"
  on project_media for insert
  with check (exists (
    select 1 from projects
    where projects.id = project_media.project_id
      and projects.owner_id = auth.uid()
  ));

create policy "project_media: owner delete"
  on project_media for delete
  using (exists (
    select 1 from projects
    where projects.id = project_media.project_id
      and projects.owner_id = auth.uid()
  ));

-- Aggregate storage_used_bytes on project and profile when media inserted/deleted
create or replace function project_media_size_aggregate()
returns trigger language plpgsql security definer as $$
declare
  v_owner_id uuid;
  v_delta    bigint;
begin
  if (tg_op = 'INSERT') then
    v_delta    := new.size_bytes;
    v_owner_id := (select owner_id from projects where id = new.project_id);
    update projects set storage_used_bytes = storage_used_bytes + v_delta where id = new.project_id;
    update profiles set storage_used_bytes = storage_used_bytes + v_delta where id = v_owner_id;
  elsif (tg_op = 'DELETE') then
    v_delta    := old.size_bytes;
    v_owner_id := (select owner_id from projects where id = old.project_id);
    update projects set storage_used_bytes = greatest(0, storage_used_bytes - v_delta) where id = old.project_id;
    update profiles set storage_used_bytes = greatest(0, storage_used_bytes - v_delta) where id = v_owner_id;
  end if;
  return null;
end;
$$;

create trigger project_media_size_aggregate
  after insert or delete on project_media
  for each row execute procedure project_media_size_aggregate();

-- ─────────────────────────────────────────────────────────────────────────────
-- Ownership transfers
-- ─────────────────────────────────────────────────────────────────────────────

create table ownership_transfers (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  from_user_id uuid not null references profiles(id),
  to_user_id   uuid not null references profiles(id),
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  expires_at   timestamptz not null default (now() + interval '7 days'),
  created_at   timestamptz not null default now(),
  responded_at timestamptz
);

alter table ownership_transfers enable row level security;

create policy "ownership_transfers: parties select"
  on ownership_transfers for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "ownership_transfers: recipient update"
  on ownership_transfers for update
  using (auth.uid() = to_user_id);

create policy "ownership_transfers: sender update (cancel)"
  on ownership_transfers for update
  using (auth.uid() = from_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Plan-limited Postgres functions
-- ─────────────────────────────────────────────────────────────────────────────

-- Create a new project, enforcing free plan's 3-project limit
create or replace function create_project(name text, data jsonb)
returns uuid
language plpgsql security definer as $$
declare
  v_user_id   uuid := auth.uid();
  v_plan      text;
  v_count     int;
  v_slug      text;
  v_id        uuid;
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

  -- Generate 8-char nanoid-style slug
  v_slug := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into projects (slug, owner_id, name, data)
  values (v_slug, v_user_id, name, data)
  returning id into v_id;

  return v_id;
end;
$$;

-- Update a project, enforcing optimistic concurrency and size limit
create or replace function update_project(project_id uuid, data jsonb, expected_version int)
returns int
language plpgsql security definer as $$
declare
  v_current_version int;
  v_plan            text;
  v_data_size       int;
  v_new_version     int;
begin
  select version into v_current_version
  from projects where id = project_id and owner_id = auth.uid();

  if not found then
    raise exception 'not_found: project not found or access denied';
  end if;

  if v_current_version != expected_version then
    raise exception 'conflict: version mismatch (expected %, current %)', expected_version, v_current_version;
  end if;

  select plan into v_plan from profiles where id = auth.uid();

  v_data_size := length(data::text);
  if v_plan = 'free' and v_data_size > 5242880 then  -- 5 MB
    raise exception 'plan_limit: project data exceeds 5MB free plan limit';
  elsif v_plan = 'pro' and v_data_size > 52428800 then  -- 50 MB
    raise exception 'plan_limit: project data exceeds 50MB limit';
  end if;

  v_new_version := v_current_version + 1;

  update projects
  set data    = update_project.data,
      version = v_new_version
  where id = project_id;

  -- Snapshot the version
  insert into project_versions (project_id, data, version)
  values (project_id, data, v_new_version);

  return v_new_version;
end;
$$;

-- Check whether adding media would exceed the user's storage quota
create or replace function check_media_quota(project_id uuid, size_bytes bigint)
returns boolean
language plpgsql security definer as $$
declare
  v_plan              text;
  v_storage_used      bigint;
  v_limit             bigint;
begin
  select plan, storage_used_bytes
  into v_plan, v_storage_used
  from profiles where id = auth.uid();

  v_limit := case v_plan
    when 'pro'  then 10737418240  -- 10 GB
    else             1073741824   -- 1 GB (free)
  end;

  return (v_storage_used + size_bytes) <= v_limit;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage buckets (run separately in Supabase dashboard or via CLI)
-- ─────────────────────────────────────────────────────────────────────────────

-- insert into storage.buckets (id, name, public) values ('media',      'media',      false);
-- insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true);
