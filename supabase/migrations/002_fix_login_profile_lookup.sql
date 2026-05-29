-- Fix: allow secure profile lookup before authentication (login / forgot-password)
-- Root cause: profiles_select only permits authenticated users, so anon login
-- could never read profiles and always returned "Invalid credentials".

create or replace function public.get_profile_for_login(p_identifier text)
returns table (
  id uuid,
  name text,
  login_email text,
  email text,
  phone_number text,
  role text,
  status text,
  failed_login_attempts int,
  is_locked boolean,
  last_login timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.login_email,
    p.email,
    p.phone_number,
    p.role,
    p.status,
    p.failed_login_attempts,
    p.is_locked,
    p.last_login,
    p.created_at
  from public.profiles p
  where lower(trim(p.email)) = lower(trim(p_identifier))
     or p.phone_number = trim(p_identifier)
     or lower(p.login_email) = lower(trim(p_identifier))
  limit 1;
$$;

grant execute on function public.get_profile_for_login(text) to anon, authenticated;

-- Record failed login when Supabase rejects password (anon cannot UPDATE profiles)
create or replace function public.record_failed_login_attempt(p_login_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_attempts int;
begin
  select * into v_profile
  from public.profiles
  where lower(login_email) = lower(trim(p_login_email))
  limit 1;

  if not found then
    return;
  end if;

  v_attempts := coalesce(v_profile.failed_login_attempts, 0) + 1;

  update public.profiles
  set
    failed_login_attempts = v_attempts,
    is_locked = v_attempts >= 2
  where id = v_profile.id;
end;
$$;

grant execute on function public.record_failed_login_attempt(text) to anon, authenticated;
