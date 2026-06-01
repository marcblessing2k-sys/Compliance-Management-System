-- Unlock any user profile when an admin approves or initiates password reset (no Edge Function required).

create or replace function public.admin_unlock_user_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.profiles
  set
    failed_login_attempts = 0,
    is_locked = false,
    status = 'active'
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_unlock_user_profile(uuid) to authenticated;
