-- Migration: short share links + invite-by-email.
-- Run this once in the Supabase SQL editor, after 002 and 003.
--
-- Adds:
--   1. A short 8-character invite link (?i=<code>) that resolves to the
--      full agency id client-side, instead of sharing the raw uuid.
--   2. Owner-managed email invites: once an owner adds an email, whoever
--      signs in with that email automatically gets the agency added to
--      their agency list (still password-gated to actually open it).

-- ---------------------------------------------------------------------
-- Short invite links
-- ---------------------------------------------------------------------

create table if not exists agency_invite_links (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references agencies(id) on delete cascade not null,
  code text unique not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table agency_invite_links enable row level security;
-- No direct client policies: all access goes through the SECURITY DEFINER
-- functions below, same pattern as the `agencies` table itself.

-- Look up an agency by its short code. No auth required to resolve it —
-- the code alone grants no access, it just points the app at the right
-- agency so the normal sign-in + password gate can run.
create or replace function resolve_invite_code(invite_code text)
returns table (agency_id uuid, agency_name text)
language sql
security definer
set search_path = public
as $$
  select a.id, a.name
  from agency_invite_links l
  join agencies a on a.id = l.agency_id
  where l.code = invite_code and l.active = true;
$$;

-- Get the agency's current active short code, creating one if it doesn't
-- have one yet. Owner only.
create or replace function get_or_create_invite_link(target_agency_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_code text;
  new_code text;
begin
  if not exists (
    select 1 from agency_members
    where agency_id = target_agency_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only the owner can manage the share link.';
  end if;

  select code into existing_code
  from agency_invite_links
  where agency_id = target_agency_id and active = true
  limit 1;

  if existing_code is not null then
    return existing_code;
  end if;

  loop
    new_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    begin
      insert into agency_invite_links (agency_id, code) values (target_agency_id, new_code);
      exit;
    exception when unique_violation then
      -- code collision (astronomically rare) — loop and try another
    end;
  end loop;

  return new_code;
end;
$$;

-- Invalidate the old link and issue a fresh code. Owner only.
create or replace function regenerate_invite_link(target_agency_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if not exists (
    select 1 from agency_members
    where agency_id = target_agency_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only the owner can manage the share link.';
  end if;

  update agency_invite_links set active = false
  where agency_id = target_agency_id and active = true;

  loop
    new_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    begin
      insert into agency_invite_links (agency_id, code) values (target_agency_id, new_code);
      exit;
    exception when unique_violation then
    end;
  end loop;

  return new_code;
end;
$$;

-- ---------------------------------------------------------------------
-- Invite by email
-- ---------------------------------------------------------------------

create table if not exists agency_email_invites (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references agencies(id) on delete cascade not null,
  email text not null,
  invited_by uuid references auth.users,
  created_at timestamptz not null default now(),
  unique (agency_id, email)
);

alter table agency_email_invites enable row level security;

-- Add an email to an agency's invite list. Owner only. If that email
-- already belongs to a signed-up user, they're added as an editor right
-- away; otherwise they're added automatically the next time they sign in
-- with that email (see list_my_agencies below).
create or replace function invite_agency_email(target_agency_id uuid, invite_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized text := lower(trim(invite_email));
begin
  if not exists (
    select 1 from agency_members
    where agency_id = target_agency_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only the owner can invite by email.';
  end if;

  if normalized = '' or normalized !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address.';
  end if;

  insert into agency_email_invites (agency_id, email, invited_by)
  values (target_agency_id, normalized, auth.uid())
  on conflict (agency_id, email) do nothing;

  insert into agency_members (agency_id, user_id, role)
  select target_agency_id, u.id, 'editor'
  from auth.users u
  where lower(u.email) = normalized
  on conflict (agency_id, user_id) do nothing;
end;
$$;

-- Remove an email invite, and revoke access if that person already joined.
-- Owner only.
create or replace function remove_agency_email_invite(target_agency_id uuid, invite_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized text := lower(trim(invite_email));
begin
  if not exists (
    select 1 from agency_members
    where agency_id = target_agency_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only the owner can remove an invite.';
  end if;

  delete from agency_email_invites
  where agency_id = target_agency_id and email = normalized;

  delete from agency_members
  using auth.users u
  where agency_members.agency_id = target_agency_id
    and agency_members.user_id = u.id
    and lower(u.email) = normalized
    and agency_members.role != 'owner';
end;
$$;

-- List invited emails for an agency, with whether each has joined yet.
-- Owner only.
create or replace function list_agency_email_invites(target_agency_id uuid)
returns table (email text, created_at timestamptz, joined boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from agency_members
    where agency_id = target_agency_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only the owner can view invites.';
  end if;

  return query
  select
    ei.email,
    ei.created_at,
    exists (
      select 1 from agency_members m
      join auth.users u on u.id = m.user_id
      where m.agency_id = target_agency_id and lower(u.email) = ei.email
    ) as joined
  from agency_email_invites ei
  where ei.agency_id = target_agency_id
  order by ei.created_at desc;
end;
$$;

-- Replaces the original list_my_agencies (from schema.sql): now also
-- auto-provisions membership for the signed-in user if their email was
-- invited to any agency, so it shows up in their list right away.
create or replace function list_my_agencies()
returns table (id uuid, name text, role text)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into agency_members (agency_id, user_id, role)
  select ei.agency_id, auth.uid(), 'editor'
  from agency_email_invites ei
  join auth.users u on lower(u.email) = ei.email
  where u.id = auth.uid()
  on conflict (agency_id, user_id) do nothing;

  return query
  select a.id, a.name, m.role
  from agencies a
  join agency_members m on m.agency_id = a.id
  where m.user_id = auth.uid()
  order by a.name;
end;
$$;
