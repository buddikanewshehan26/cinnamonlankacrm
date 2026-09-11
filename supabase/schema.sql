-- Run this once in Supabase Dashboard → SQL Editor.
create table if not exists public.crm_app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.crm_app_state enable row level security;

-- The app accesses this table only from secure Next.js API routes using
-- SUPABASE_SERVICE_ROLE_KEY. No browser policy is required.
