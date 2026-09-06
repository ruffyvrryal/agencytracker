-- Migration: agency sharing / collaborator management.
-- Run this once in the Supabase SQL editor, after 002_agency_management.sql.
--
-- How sharing already worked before this file: opening a link of the form
-- yoursite.com/?agency=<uuid> shows the password gate (AgencyPasswordGate),
-- and entering the correct password calls verify_agency_password, which
-- adds the current signed-in user as an 'editor' member of that agency.
-- That part needed no schema changes. This file adds two RPCs so the owner
-- can see who has joined, and revoke access if needed.

-- List everyone with access to an agency (owner only).
create or replace function list_agency_collaborators(target_agency_id uuid)
returns table (user_id uuid, email text, role text, joined_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from agency_members
    where agency_id = target_agency_id
      and user_id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'Only the owner can view collaborators.';
  end if;

  return query
  select m.user_id, u.email, m.role, m.joined_at
  from agency_members m
  join auth.users u on u.id = m.user_id
  where m.agency_id = target_agency_id
  order by (m.role = 'owner') desc, m.joined_at;
end;
$$;

-- Revoke an editor's access (owner only). Can't remove the owner.
create or replace function remove_agency_collaborator(target_agency_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from agency_members
    where agency_id = target_agency_id
      and user_id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'Only the owner can remove collaborators.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You can''t remove yourself as owner.';
  end if;

  delete from agency_members
  where agency_id = target_agency_id
    and user_id = target_user_id
    and role != 'owner';
end;
$$;
