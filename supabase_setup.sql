-- =====================================================================
-- PearlFox Expenses Tracker — Supabase setup
-- =====================================================================
-- Run this ENTIRE script in your Supabase project's SQL Editor.
-- (Dashboard → SQL Editor → New query → paste → Run)
--
-- Model: single shared account. Anyone logged in as that account can
-- read/write every row. Anonymous (not logged in) can do nothing.
-- =====================================================================

-- --------------------------------------------------------------
-- 1. Extensions (usually already enabled on Supabase, safe re-run)
-- --------------------------------------------------------------
create extension if not exists "pgcrypto";           -- for gen_random_uuid()
create extension if not exists "moddatetime" schema extensions;  -- auto updated_at

-- --------------------------------------------------------------
-- 2. Table: expenses
-- --------------------------------------------------------------
create table if not exists public.expenses (
    id              uuid primary key default gen_random_uuid(),
    row_date        date,
    description     text not null default '',
    expense         numeric(12,2),
    share           text not null default ''
                    check (share in ('', 'All', 'Manoj', 'Praveen')),
    manoj_paid      boolean not null default false,
    praveen_paid    boolean not null default false,
    remark          text not null default '',
    -- Receipt attachment (path in the 'expense-receipts' storage bucket)
    receipt_path    text,
    receipt_name    text,
    -- User-controlled ordering. New rows get max(sort_order)+1.
    sort_order      integer not null default 0,
    -- Audit
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    created_by      uuid references auth.users(id) on delete set null
);

-- Fast reads in sort order
create index if not exists expenses_sort_order_idx
    on public.expenses (sort_order);

-- Auto-touch updated_at on any update
drop trigger if exists set_updated_at on public.expenses;
create trigger set_updated_at
    before update on public.expenses
    for each row execute procedure extensions.moddatetime (updated_at);

-- --------------------------------------------------------------
-- 3. Row-Level Security
--    Only authenticated users can do anything. Anon = 0 access.
-- --------------------------------------------------------------
alter table public.expenses enable row level security;

drop policy if exists "authed_select" on public.expenses;
drop policy if exists "authed_insert" on public.expenses;
drop policy if exists "authed_update" on public.expenses;
drop policy if exists "authed_delete" on public.expenses;

create policy "authed_select" on public.expenses
    for select to authenticated using (true);

create policy "authed_insert" on public.expenses
    for insert to authenticated with check (true);

create policy "authed_update" on public.expenses
    for update to authenticated using (true) with check (true);

create policy "authed_delete" on public.expenses
    for delete to authenticated using (true);

-- --------------------------------------------------------------
-- 4. Storage bucket for receipts
--    Do this via SQL so it's reproducible.
-- --------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', false)
on conflict (id) do nothing;

-- Storage policies: authenticated users can CRUD files in this bucket.
drop policy if exists "receipts_authed_select" on storage.objects;
drop policy if exists "receipts_authed_insert" on storage.objects;
drop policy if exists "receipts_authed_update" on storage.objects;
drop policy if exists "receipts_authed_delete" on storage.objects;

create policy "receipts_authed_select" on storage.objects
    for select to authenticated
    using (bucket_id = 'expense-receipts');

create policy "receipts_authed_insert" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'expense-receipts');

create policy "receipts_authed_update" on storage.objects
    for update to authenticated
    using (bucket_id = 'expense-receipts')
    with check (bucket_id = 'expense-receipts');

create policy "receipts_authed_delete" on storage.objects
    for delete to authenticated
    using (bucket_id = 'expense-receipts');

-- =====================================================================
-- 5. AFTER RUNNING THIS SCRIPT
-- =====================================================================
-- a) Dashboard → Authentication → Users → "Add user" → create ONE user
--    with a strong email + password. Both Manoj and Praveen will use
--    this single shared login.
--
-- b) Dashboard → Authentication → Providers → Email → make sure
--    "Confirm email" is OFF (or confirm the email you used) so login
--    works immediately.
--
-- c) Dashboard → Settings → API → copy:
--       • Project URL  →  paste into SUPABASE_URL in the HTML
--       • anon public  →  paste into SUPABASE_ANON_KEY in the HTML
--    (NEVER paste the service_role key into the HTML!)
--
-- d) Dashboard → Authentication → URL Configuration →
--    add https://pearlfox.io  (and http://localhost for local testing)
--    to the "Site URL" and "Redirect URLs".
-- =====================================================================
