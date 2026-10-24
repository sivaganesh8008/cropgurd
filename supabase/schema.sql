-- FarmPulse schema for Supabase (PostgreSQL)
-- Run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text not null default 'English',
  created_at timestamptz not null default now()
);

create table if not exists public.farms (
  farm_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_name text not null,
  location text not null default '',
  latitude double precision,
  longitude double precision,
  land_area numeric(12,2),
  soil_type text,
  water_availability text,
  season text,
  current_crop text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weather_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(farm_id) on delete cascade,
  provider text not null default 'Open-Meteo',
  conditions jsonb not null default '{}'::jsonb,
  forecast_summary text not null default '',
  fetched_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  recommendation_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid not null references public.farms(farm_id) on delete cascade,
  candidate_crops jsonb not null default '[]'::jsonb,
  ranking_factors jsonb not null default '{}'::jsonb,
  explanation text not null default '',
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.observations (
  observation_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid not null references public.farms(farm_id) on delete cascade,
  description text not null,
  image_path text,
  observed_at timestamptz not null default now()
);

create table if not exists public.advisories (
  advisory_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid not null references public.farms(farm_id) on delete cascade,
  observation_id uuid references public.observations(observation_id) on delete set null,
  possible_causes jsonb not null default '[]'::jsonb,
  confidence text not null default 'low',
  next_steps jsonb not null default '[]'::jsonb,
  model_version text,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_history (
  message_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(farm_id) on delete set null,
  language text not null default 'English',
  message_type text not null default 'text',
  message_text text not null,
  response_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  alert_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid not null references public.farms(farm_id) on delete cascade,
  alert_type text not null,
  message text not null,
  scheduled_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists farms_user_id_idx on public.farms(user_id);
create index if not exists recommendations_user_created_idx on public.recommendations(user_id, created_at desc);
create index if not exists chat_history_user_created_idx on public.chat_history(user_id, created_at desc);

-- RLS is enabled as a defense-in-depth measure. The MVP backend verifies the
-- Supabase access token and scopes all service-role queries by user_id.
alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.weather_snapshots enable row level security;
alter table public.recommendations enable row level security;
alter table public.observations enable row level security;
alter table public.advisories enable row level security;
alter table public.chat_history enable row level security;
alter table public.alerts enable row level security;

-- Policies for direct authenticated-client access (optional, useful for future work).
drop policy if exists "profile owner can read/write" on public.profiles;
create policy "profile owner can read/write" on public.profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "farm owner can read/write" on public.farms;
create policy "farm owner can read/write" on public.farms for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "weather owner can read/write" on public.weather_snapshots;
create policy "weather owner can read/write" on public.weather_snapshots for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "recommendation owner can read/write" on public.recommendations;
create policy "recommendation owner can read/write" on public.recommendations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "observation owner can read/write" on public.observations;
create policy "observation owner can read/write" on public.observations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "advisory owner can read/write" on public.advisories;
create policy "advisory owner can read/write" on public.advisories for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "chat owner can read/write" on public.chat_history;
create policy "chat owner can read/write" on public.chat_history for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "alert owner can read/write" on public.alerts;
create policy "alert owner can read/write" on public.alerts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
