/*
  Migration: 20230925_create_author_bank_accounts.sql
  Creates the author_bank_accounts table with pgcrypto column‑level encryption for
  account_number and routing_number. Adds RLS policies so that:
    • An author can SELECT, INSERT, UPDATE, DELETE only their own row.
    • Admins (isAdmin()) have full access.
*/

-- Enable pgcrypto extension if not already present
create extension if not exists pgcrypto;

create table public.author_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references authors(id) on delete cascade,
  bank_name text not null,
  account_number bytea not null, -- encrypted via pgp_sym_encrypt
  routing_number bytea not null, -- encrypted via pgp_sym_encrypt
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique one‑to‑one relationship (single bank account per author)
create unique index author_bank_accounts_author_id_idx on public.author_bank_accounts(author_id);

-- RLS policies
alter table public.author_bank_accounts enable row level security;

-- Policy: authors can manage their own bank account
create policy author_bank_account_self on public.author_bank_accounts
  for all
  using (author_id IN (select id from public.authors where clerk_user_id = auth.jwt()->>'sub'))
  with check (author_id IN (select id from public.authors where clerk_user_id = auth.jwt()->>'sub'));

-- Policy: admins have full access via service_role
create policy admin_full_access on public.author_bank_accounts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Trigger to update updated_at timestamp
create function public.update_author_bank_account_timestamp()
returns trigger language plpgsql security definer as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger trg_author_bank_account_timestamp
  before update on public.author_bank_accounts
  for each row execute function public.update_author_bank_account_timestamp();
