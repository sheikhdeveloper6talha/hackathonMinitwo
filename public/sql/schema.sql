-- ============================================================
-- MaintainIQ — Supabase Schema
-- Supabase Dashboard -> SQL Editor mein ye pura file paste karke Run karein
-- ============================================================

-- Extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- 1. PROFILES  (extends Supabase auth.users with role info)
-- ----------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'technician')) default 'technician',
  created_at timestamptz default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'role', 'technician')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- 2. ASSETS
-- ----------------------------------------------------------------
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text unique not null,
  name text not null,
  category text,
  location text,
  condition text,
  status text not null default 'Operational'
    check (status in ('Operational','Issue Reported','Under Inspection','Under Maintenance','Out of Service','Retired')),
  description text,
  last_service_date date,
  next_service_date date,
  assigned_technician uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- 3. ISSUES
-- ----------------------------------------------------------------
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  issue_number text unique not null,
  asset_id uuid not null references assets(id) on delete cascade,
  title text not null,
  description text not null,
  category text,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High','Critical')),
  status text not null default 'Reported'
    check (status in ('Reported','Assigned','Inspection Started','Maintenance In Progress','Waiting for Parts','Resolved','Closed','Reopened')),
  reporter_name text,
  reporter_contact text,
  evidence_urls text[] default '{}',
  assigned_technician uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- 4. MAINTENANCE RECORDS
-- ----------------------------------------------------------------
create table if not exists maintenance_records (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  technician_id uuid references profiles(id),
  notes text not null,
  parts_used text,
  cost numeric(10,2) default 0 check (cost >= 0),
  time_spent text,
  final_condition text,
  evidence_urls text[] default '{}',
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- 5. ASSET HISTORY  (permanent, append-only timeline)
-- ----------------------------------------------------------------
create table if not exists asset_history (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  issue_id uuid references issues(id),
  actor_name text,
  actor_id uuid,
  action text not null,
  details text,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------
alter table profiles enable row level security;
alter table assets enable row level security;
alter table issues enable row level security;
alter table maintenance_records enable row level security;
alter table asset_history enable row level security;

-- PROFILES: a user can read their own profile; admins can read all
create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "admins read all profiles" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ASSETS: anyone (including anonymous public QR scanners) can read assets
create policy "public read assets" on assets for select using (true);
-- Only authenticated admins can create/update/delete assets
create policy "admins insert assets" on assets for insert to authenticated with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "admins update assets" on assets for update to authenticated using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "admins delete assets" on assets for delete to authenticated using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ISSUES: anyone can read (for public status check) and anyone can insert (public issue reporting)
create policy "public read issues" on issues for select using (true);
create policy "public report issue" on issues for insert with check (true);
-- Only authenticated admin/assigned technician can update
create policy "staff update issues" on issues for update to authenticated using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or assigned_technician = auth.uid()
);

-- MAINTENANCE RECORDS: readable by all (asset history), writable by authenticated staff
create policy "public read maintenance" on maintenance_records for select using (true);
create policy "staff insert maintenance" on maintenance_records for insert to authenticated with check (true);

-- ASSET HISTORY: readable by all, writable by anyone (app writes system events incl. public reports)
create policy "public read history" on asset_history for select using (true);
create policy "anyone insert history" on asset_history for insert with check (true);

-- ----------------------------------------------------------------
-- STORAGE BUCKET  (run separately if it errors — buckets are also
-- creatable from Dashboard -> Storage -> New bucket, name: evidence, Public)
-- ----------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

create policy "public read evidence" on storage.objects for select using (bucket_id = 'evidence');
create policy "anyone upload evidence" on storage.objects for insert with check (bucket_id = 'evidence');
