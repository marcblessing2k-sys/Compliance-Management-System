-- Allow administrators to unlock their own account when initiating forgot-password (self-service).

create or replace function public.prepare_admin_password_reset(p_identifier text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  select * into v_profile
  from public.profiles p
  where lower(trim(p.email)) = lower(trim(p_identifier))
     or p.phone_number = trim(p_identifier)
     or lower(p.login_email) = lower(trim(p_identifier))
  limit 1;

  if not found or v_profile.role <> 'admin' then
    return false;
  end if;

  update public.profiles
  set
    failed_login_attempts = 0,
    is_locked = false,
    status = 'active'
  where id = v_profile.id;

  return true;
end;
$$;

grant execute on function public.prepare_admin_password_reset(text) to anon, authenticated;
