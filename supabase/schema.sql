-- Run this once in Supabase Dashboard → SQL Editor.
create table if not exists public.crm_resources (
  resource_key text primary key check (resource_key in ('users','customers','products','invoices','companySettings','costTaxSettings','auditLogs')),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.crm_resources enable row level security;

-- Migrate the current app data once, without losing existing users, products,
-- invoices, settings, expenses, or audit logs.
insert into public.crm_resources (resource_key, data, updated_at)
select key, state.data -> key, now()
from public.crm_app_state state
cross join unnest(array['users','customers','products','invoices','companySettings','costTaxSettings','auditLogs']) as key
where state.id = 'main' and state.data ? key
on conflict (resource_key) do update set data = excluded.data, updated_at = excluded.updated_at;

-- The app accesses this table only from secure Next.js API routes using
-- SUPABASE_SERVICE_ROLE_KEY. No browser policy is required.
