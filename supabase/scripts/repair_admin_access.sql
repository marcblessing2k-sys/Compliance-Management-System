-- Run in Supabase SQL Editor to restore admin access for contact@majfintech.com
-- Safe: only updates the matching profile row; does not delete data.

-- 1) Unlock profile and ensure admin role
update public.profiles
set
  role = 'admin',
  status = 'active',
  failed_login_attempts = 0,
  is_locked = false,
  email = coalesce(email, 'contact@majfintech.com')
where lower(login_email) = 'contact@majfintech.com'
   or lower(email) = 'contact@majfintech.com';

-- 2) Verify profile exists (should return 1 row)
select id, name, login_email, email, role, status, is_locked, failed_login_attempts
from public.profiles
where lower(login_email) = 'contact@majfintech.com'
   or lower(email) = 'contact@majfintech.com';

-- 3) Verify auth.users row exists (should return 1 row)
select id, email, email_confirmed_at, created_at
from auth.users
where lower(email) = 'contact@majfintech.com';

-- If step 3 returns no rows, create the user in Dashboard:
-- Authentication → Users → Add user → contact@majfintech.com → Auto Confirm
-- Then re-run step 1 using the new user's id if login_email differs.

-- If password is unknown, reset in Dashboard:
-- Authentication → Users → select user → Send password recovery / Set password
