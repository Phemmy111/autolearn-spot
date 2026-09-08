/*
  Migration: 20230926_upsert_author_bank_account_func.sql
  Adds a stored procedure that upserts an author's bank account while encrypting
  account_number and routing_number using pgp_sym_encrypt with the server‑side key.
*/

create or replace function public.upsert_author_bank_account(
  p_author_id uuid,
  p_bank_name text,
  p_account_number text,
  p_routing_number text
) returns void language plpgsql security definer as $$
begin
  insert into public.author_bank_accounts (
    author_id,
    bank_name,
    account_number,
    routing_number,
    created_at,
    updated_at
  ) values (
    p_author_id,
    p_bank_name,
    pgp_sym_encrypt(p_account_number, current_setting('pgcrypto.key')),
    pgp_sym_encrypt(p_routing_number, current_setting('pgcrypto.key')),
    now(),
    now()
  )
  on conflict (author_id) do update set
    bank_name = excluded.bank_name,
    account_number = pgp_sym_encrypt(p_account_number, current_setting('pgcrypto.key')),
    routing_number = pgp_sym_encrypt(p_routing_number, current_setting('pgcrypto.key')),
    updated_at = now();
end;
$$;
