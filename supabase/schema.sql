-- Agency Tracker schema v2: multi-agency, auth-gated, password-shared access.
-- Run once in the Supabase SQL editor. If you have an old version of this
-- schema already applied, drop the old tables first (see bottom of file).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Agencies + membership
-- ---------------------------------------------------------------------

create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table agency_members (
  agency_id uuid references agencies(id) on delete cascade,
  user_id uuid references auth.users not null,
  role text not null check (role in ('owner','editor')),
  joined_at timestamptz not null default now(),
  primary key (agency_id, user_id)
);

-- ---------------------------------------------------------------------
-- Existing tables, now scoped to an agency
-- ---------------------------------------------------------------------

create table members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references agencies(id) on delete cascade not null,
  name text not null,
  role text
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references agencies(id) on delete cascade not null,
  ticket_no serial,
  name text not null,
  client text,
  status text not null default 'upcoming',
  date date,
  price numeric not null default 0,
  notes text
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  label text,
  amount numeric not null default 0
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  kind text not null check (kind in ('reference','result')),
  url text not null,
  created_at timestamptz not null default now()
);

-- In the Supabase dashboard (Storage tab): create a bucket named
-- "project-photos" and set it to Public, so uploaded images can be
-- shown directly by URL.

create table payouts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references agencies(id) on delete cascade not null,
  date timestamptz not null default now(),
  total_amount numeric not null default 0
);

create table payout_lines (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid references payouts(id) on delete cascade,
  member_id uuid references members(id),
  percent numeric not null default 0,
  amount numeric not null default 0
);

create table settings (
  agency_id uuid primary key references agencies(id) on delete cascade,
  studio_name text default 'Studio',
  display_currency text default 'IDR',
  rates jsonb default '{}'::jsonb
);

-- ---------------------------------------------------------------------
-- RPCs — all writes to agencies / agency_members go through these,
-- never directly from the client. They run as SECURITY DEFINER so they
-- can check the password hash without ever exposing it to the browser.
-- ---------------------------------------------------------------------

-- List the agencies the current user belongs to (for the picker screen).
create or replace function list_my_agencies()
returns table (id uuid, name text, role text)
language sql
security definer
set search_path = public
as $$
  select a.id, a.name, m.role
  from agencies a
  join agency_members m on m.agency_id = a.id
  where m.user_id = auth.uid()
  order by a.name;
$$;

-- Create a new agency. Caller becomes its owner.
create or replace function create_agency(agency_name text, agency_password text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into agencies (name, owner_id, password_hash)
  values (agency_name, auth.uid(), crypt(agency_password, gen_salt('bf')))
  returning id into new_id;

  insert into agency_members (agency_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  insert into settings (agency_id) values (new_id);

  return new_id;
end;
$$;

-- Check an agency's password. Used both to join via a shared link (adds
-- the caller as an editor) and for the "enter password every visit" gate
-- for existing members (no-ops the membership insert if already a member).
create or replace function verify_agency_password(target_agency_id uuid, agency_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  is_match boolean;
begin
  select (password_hash = crypt(agency_password, password_hash))
  into is_match
  from agencies
  where id = target_agency_id;

  if is_match then
    insert into agency_members (agency_id, user_id, role)
    values (target_agency_id, auth.uid(), 'editor')
    on conflict (agency_id, user_id) do nothing;
  end if;

  return coalesce(is_match, false);
end;
$$;

-- Look up an agency's display name by id, for the password-gate screen
-- (no password/hash exposed).
create or replace function agency_display_name(target_agency_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select name from agencies where id = target_agency_id;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table agencies enable row level security;
alter table agency_members enable row level security;
alter table members enable row level security;
alter table projects enable row level security;
alter table expenses enable row level security;
alter table photos enable row level security;
alter table payouts enable row level security;
alter table payout_lines enable row level security;
alter table settings enable row level security;

-- agencies: no direct client access at all — everything goes through the
-- SECURITY DEFINER functions above, which is what keeps password_hash
-- from ever reaching the browser.

-- agency_members: a user can see their own membership rows. This is what
-- lets the "exists (...)" checks below work, and lets the picker query
-- memberships directly if you ever want to.
create policy "see own memberships" on agency_members
  for select using (user_id = auth.uid());

create policy "members: agency members only" on members
  for all using (
    exists (select 1 from agency_members m
            where m.agency_id = members.agency_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from agency_members m
            where m.agency_id = members.agency_id and m.user_id = auth.uid())
  );

create policy "projects: agency members only" on projects
  for all using (
    exists (select 1 from agency_members m
            where m.agency_id = projects.agency_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from agency_members m
            where m.agency_id = projects.agency_id and m.user_id = auth.uid())
  );

create policy "expenses: agency members only" on expenses
  for all using (
    exists (select 1 from projects p
            join agency_members m on m.agency_id = p.agency_id
            where p.id = expenses.project_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from projects p
            join agency_members m on m.agency_id = p.agency_id
            where p.id = expenses.project_id and m.user_id = auth.uid())
  );

create policy "photos: agency members only" on photos
  for all using (
    exists (select 1 from projects p
            join agency_members m on m.agency_id = p.agency_id
            where p.id = photos.project_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from projects p
            join agency_members m on m.agency_id = p.agency_id
            where p.id = photos.project_id and m.user_id = auth.uid())
  );

create policy "payouts: agency members only" on payouts
  for all using (
    exists (select 1 from agency_members m
            where m.agency_id = payouts.agency_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from agency_members m
            where m.agency_id = payouts.agency_id and m.user_id = auth.uid())
  );

create policy "payout_lines: agency members only" on payout_lines
  for all using (
    exists (select 1 from payouts p
            join agency_members m on m.agency_id = p.agency_id
            where p.id = payout_lines.payout_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from payouts p
            join agency_members m on m.agency_id = p.agency_id
            where p.id = payout_lines.payout_id and m.user_id = auth.uid())
  );

create policy "settings: agency members only" on settings
  for all using (
    exists (select 1 from agency_members m
            where m.agency_id = settings.agency_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from agency_members m
            where m.agency_id = settings.agency_id and m.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- If you already ran the OLD schema (no agencies/auth) and have data in
-- it, drop those old un-scoped tables first, since this version's
-- `members`/`projects`/etc. have a new required agency_id column:
--
--   drop table if exists payout_lines, payouts, photos, expenses,
--     projects, members, settings cascade;
--
-- then run this whole file.
