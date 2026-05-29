-- Consultant Dashboard System — initial Supabase schema
-- Run in Supabase SQL Editor or via: supabase db push

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  login_email text not null,
  email text,
  phone_number text,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  failed_login_attempts int not null default 0,
  is_locked boolean not null default false,
  last_login timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_phone_number_key on public.profiles (phone_number)
  where phone_number is not null;
create unique index if not exists profiles_login_email_key on public.profiles (login_email);

-- Auto-create profile when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, login_email, email, phone_number, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    case when new.email like '%@phone.cms.local' then null else new.email end,
    new.raw_user_meta_data->>'phone_number',
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Employees & compliance
-- ---------------------------------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  business_unit text not null default 'BU1',
  name text not null,
  role text not null,
  department text not null,
  review_period text not null,
  reviewer text not null,
  review_date date not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  business_process text not null,
  category text not null,
  requirement text not null,
  priority text not null check (priority in ('HIGH', 'MEDIUM', 'LOW')),
  status text not null default 'Not Started'
    check (status in ('Compliant', 'In Progress', 'Not Started', 'Non-Compliant', 'N/A')),
  evidence text not null default '',
  responsible text not null default '',
  target_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compliance_items_employee_id_idx on public.compliance_items (employee_id);

-- ---------------------------------------------------------------------------
-- Archives
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_archives (
  id text primary key,
  business_unit text not null default 'BU1',
  month text not null,
  year int not null,
  archived_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.archive_snapshots (
  id uuid primary key default gen_random_uuid(),
  archive_id text not null references public.monthly_archives (id) on delete cascade,
  employee_data jsonb not null,
  checklist_data jsonb not null,
  last_updated timestamptz
);

create index if not exists archive_snapshots_archive_id_idx on public.archive_snapshots (archive_id);

-- ---------------------------------------------------------------------------
-- Admin & messaging
-- ---------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  user_name text not null,
  action text not null,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  user_name text not null,
  user_email text,
  user_phone text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  processed_by text,
  processed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.login_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  user_name text not null,
  user_email text,
  ip_address text,
  device text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_name text not null,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  receiver_name text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_participants_idx
  on public.chat_messages (sender_id, receiver_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_authenticated_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active' and is_locked = false
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.compliance_items enable row level security;
alter table public.monthly_archives enable row level security;
alter table public.archive_snapshots enable row level security;
alter table public.activity_logs enable row level security;
alter table public.password_reset_requests enable row level security;
alter table public.login_notifications enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Employees & compliance (authenticated active users)
create policy "employees_all" on public.employees for all to authenticated
  using (public.is_authenticated_active() or public.is_admin())
  with check (public.is_authenticated_active() or public.is_admin());

create policy "compliance_items_all" on public.compliance_items for all to authenticated
  using (public.is_authenticated_active() or public.is_admin())
  with check (public.is_authenticated_active() or public.is_admin());

-- Archives
create policy "archives_all" on public.monthly_archives for all to authenticated
  using (public.is_authenticated_active() or public.is_admin())
  with check (public.is_authenticated_active() or public.is_admin());

create policy "archive_snapshots_all" on public.archive_snapshots for all to authenticated
  using (public.is_authenticated_active() or public.is_admin())
  with check (public.is_authenticated_active() or public.is_admin());

-- Activity logs — admin read/write; users insert own
create policy "activity_logs_select" on public.activity_logs for select to authenticated
  using (public.is_admin());
create policy "activity_logs_insert" on public.activity_logs for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());
create policy "activity_logs_delete" on public.activity_logs for delete to authenticated
  using (public.is_admin());

-- Password reset requests
create policy "reset_requests_select" on public.password_reset_requests for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "reset_requests_insert" on public.password_reset_requests for insert to authenticated
  with check (user_id = auth.uid());
create policy "reset_requests_admin_update" on public.password_reset_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Login notifications — admin only
create policy "login_notifications_admin" on public.login_notifications for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "login_notifications_insert" on public.login_notifications for insert to authenticated
  with check (true);

-- Chat
create policy "chat_select" on public.chat_messages for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin());
create policy "chat_insert" on public.chat_messages for insert to authenticated
  with check (sender_id = auth.uid());
create policy "chat_update" on public.chat_messages for update to authenticated
  using (receiver_id = auth.uid() or public.is_admin());
create policy "chat_delete" on public.chat_messages for delete to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Lookup profile by phone (for phone-based login)
-- ---------------------------------------------------------------------------
create or replace function public.get_login_email_by_phone(p_phone text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select login_email from public.profiles
  where phone_number = p_phone and status = 'active'
  limit 1;
$$;

grant execute on function public.get_login_email_by_phone(text) to anon, authenticated;
