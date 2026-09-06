-- Migration: agency rename + delete.
-- Run this once in the Supabase SQL editor (SQL Editor > New query > paste > Run)
-- on top of the existing schema.sql. Adds two new RPCs, both owner-only.

-- Rename an agency. Owner only.
create or replace function rename_agency(target_agency_id uuid, new_name text)
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
    raise exception 'Only the owner can rename this agency.';
  end if;

  if trim(new_name) = '' then
    raise exception 'Name cannot be empty.';
  end if;

  update agencies set name = new_name where id = target_agency_id;
end;
$$;

-- Permanently delete an agency and everything under it (members, projects,
-- expenses, photos, payouts, settings all cascade). Owner only, and requires
-- re-entering the agency's shared password as a confirmation step.
create or replace function delete_agency(target_agency_id uuid, agency_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  is_owner boolean;
  is_match boolean;
begin
  select exists (
    select 1 from agency_members
    where agency_id = target_agency_id
      and user_id = auth.uid()
      and role = 'owner'
  ) into is_owner;

  if not is_owner then
    raise exception 'Only the owner can delete this agency.';
  end if;

  select (password_hash = crypt(agency_password, password_hash))
  into is_match
  from agencies
  where id = target_agency_id;

  if not coalesce(is_match, false) then
    raise exception 'Incorrect password.';
  end if;

  delete from agencies where id = target_agency_id;
end;
$$;
