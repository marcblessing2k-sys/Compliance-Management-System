import { User, ActivityLog, AuthSession, PasswordResetRequest } from '../types/auth';
import { requireSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { toLoginEmail, isEmailIdentifier } from '../../lib/authHelpers';
import { sendLoginEmailToUser, sendLoginEmailToAdmin, createLoginNotification } from './notificationService';

type ProfileRow = {
  id: string;
  name: string;
  login_email: string;
  email: string | null;
  phone_number: string | null;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  failed_login_attempts: number;
  is_locked: boolean;
  last_login: string | null;
  created_at: string;
};

function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email ?? undefined,
    phoneNumber: row.phone_number ?? undefined,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    lastLogin: row.last_login ?? undefined,
    status: row.status,
    failedLoginAttempts: row.failed_login_attempts,
    isLocked: row.is_locked
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return mapProfile(data as ProfileRow);
}

async function resolveLoginEmail(identifier: string): Promise<string> {
  const supabase = requireSupabase();
  if (isEmailIdentifier(identifier)) {
    return toLoginEmail(identifier);
  }
  const { data } = await supabase.rpc('get_login_email_by_phone', { p_phone: identifier.trim() });
  return data ?? toLoginEmail(identifier);
}

export async function initializeAuth(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await requireSupabase().auth.getSession();
}

export async function getUsers(): Promise<User[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('profiles').select('*').order('created_at');
  if (error) throw error;
  return (data as ProfileRow[]).map(mapProfile);
}

export async function saveUser(user: User): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from('profiles').update({
    name: user.name,
    email: user.email ?? null,
    phone_number: user.phoneNumber ?? null,
    role: user.role,
    status: user.status,
    failed_login_attempts: user.failedLoginAttempts ?? 0,
    is_locked: user.isLocked ?? false,
    last_login: user.lastLogin ?? null
  }).eq('id', user.id);
  if (error) throw error;
}

export async function deleteUser(userId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'delete-user', userId }
  });
  if (error) {
    throw new Error(error.message || 'Failed to delete user. Deploy the admin-users Edge Function (see DATABASE_SETUP.md).');
  }
}

export async function findUserByEmailOrPhone(identifier: string): Promise<User | null> {
  const supabase = requireSupabase();
  const trimmed = identifier.trim();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`email.eq.${trimmed},phone_number.eq.${trimmed},login_email.eq.${toLoginEmail(trimmed)}`)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfile(data as ProfileRow);
}

export async function checkEmailOrPhoneExists(
  email?: string,
  phoneNumber?: string,
  excludeUserId?: string
): Promise<boolean> {
  const supabase = requireSupabase();
  let query = supabase.from('profiles').select('id');
  const filters: string[] = [];
  if (email) filters.push(`email.eq.${email.toLowerCase()}`, `login_email.eq.${email.toLowerCase()}`);
  if (phoneNumber) filters.push(`phone_number.eq.${phoneNumber}`);
  if (!filters.length) return false;
  query = query.or(filters.join(','));
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).some(u => u.id !== excludeUserId);
}

export async function authenticateUser(
  identifier: string,
  password: string
): Promise<{ user: User | null; error?: string }> {
  const supabase = requireSupabase();
  const profile = await findUserByEmailOrPhone(identifier);

  if (!profile) return { user: null, error: 'Invalid credentials' };
  if (profile.status === 'inactive') return { user: null, error: 'Account is inactive' };
  if (profile.isLocked) {
    return { user: null, error: 'Account is locked. Please contact the administrator to reset your password.' };
  }

  const loginEmail = await resolveLoginEmail(identifier);
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password
  });

  if (signInError) {
    const failedAttempts = (profile.failedLoginAttempts || 0) + 1;
    const updatedUser: User = {
      ...profile,
      failedLoginAttempts: failedAttempts,
      isLocked: failedAttempts >= 2
    };
    await saveUser(updatedUser);
    await logActivity(profile.id, profile.name, 'Failed Login', `Failed login attempt (${failedAttempts}/2)`);

    if (failedAttempts >= 2) {
      return { user: null, error: 'Account locked after 2 failed attempts. Please contact the administrator to reset your password.' };
    }
    return { user: null, error: `Invalid credentials. Attempts remaining: ${2 - failedAttempts}` };
  }

  const resetUser: User = {
    ...profile,
    failedLoginAttempts: 0,
    isLocked: false,
    lastLogin: new Date().toISOString()
  };
  await saveUser(resetUser);
  return { user: resetUser };
}

export async function registerUser(
  name: string,
  identifier: string,
  password: string,
  loginMethod: 'email' | 'phone'
): Promise<{ user: User | null; error?: string }> {
  const supabase = requireSupabase();
  const loginEmail = toLoginEmail(identifier);

  const duplicate = await checkEmailOrPhoneExists(
    loginMethod === 'email' ? identifier : undefined,
    loginMethod === 'phone' ? identifier : undefined
  );
  if (duplicate) {
    return { user: null, error: `This ${loginMethod} is already registered in the system.` };
  }

  const { data, error } = await supabase.auth.signUp({
    email: loginEmail,
    password,
    options: {
      data: {
        name: name.trim(),
        phone_number: loginMethod === 'phone' ? identifier.trim() : null,
        role: 'user'
      }
    }
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'Registration failed.' };

  if (loginMethod === 'email') {
    await supabase.from('profiles').update({ email: identifier.toLowerCase() }).eq('id', data.user.id);
  }

  const profile = await fetchProfile(data.user.id);
  if (!profile) return { user: null, error: 'Profile creation failed.' };

  await createSession(profile);
  return { user: profile };
}

export async function adminCreateUser(
  name: string,
  contact: string,
  password: string,
  role: 'admin' | 'user',
  contactMethod: 'email' | 'phone'
): Promise<{ success: boolean; error?: string }> {
  const supabase = requireSupabase();
  const { error } = await supabase.functions.invoke('admin-users', {
    body: {
      action: 'create-user',
      name: name.trim(),
      contact,
      password,
      role,
      contactMethod
    }
  });

  if (error) {
    return {
      success: false,
      error: error.message || 'Deploy the admin-users Edge Function to enable admin user creation (see DATABASE_SETUP.md).'
    };
  }
  return { success: true };
}

export async function createSession(user: User): Promise<AuthSession> {
  const supabase = requireSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  const updatedUser: User = { ...user, lastLogin: new Date().toISOString() };
  await saveUser(updatedUser);

  await logActivity(user.id, user.name, 'Login', 'User logged in successfully');
  sendLoginEmailToUser(user.email ?? user.phoneNumber ?? '', user.name);

  const admins = await getUsers();
  const adminUser = admins.find(u => u.role === 'admin');
  if (adminUser) {
    sendLoginEmailToAdmin(adminUser.email ?? '', user.name, user.email ?? '', user.role);
  }

  await createLoginNotification(user.id, user.name, user.email ?? '');

  return {
    user: updatedUser,
    token: session?.access_token ?? '',
    expiresAt: session?.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

export async function getSession(): Promise<AuthSession | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = requireSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const profile = await fetchProfile(session.user.id);
  if (!profile || profile.status === 'inactive') return null;

  return {
    user: profile,
    token: session.access_token,
    expiresAt: new Date(session.expires_at! * 1000).toISOString()
  };
}

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session) {
    await logActivity(session.user.id, session.user.name, 'Logout', 'User logged out');
  }
  await requireSupabase().auth.signOut();
}

export async function logActivity(
  userId: string,
  userName: string,
  action: string,
  details?: string
): Promise<void> {
  const supabase = requireSupabase();
  await supabase.from('activity_logs').insert({
    user_id: userId,
    user_name: userName,
    action,
    details
  });
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    timestamp: row.created_at,
    details: row.details ?? undefined
  }));
}

export async function clearActivityLogs(): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

const REMEMBER_ME_KEY = 'compliance_remember_me';

export function saveRememberMe(identifier: string): void {
  localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({ identifier }));
}

export function getRememberMe(): { identifier: string } | null {
  const stored = localStorage.getItem(REMEMBER_ME_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function clearRememberMe(): void {
  localStorage.removeItem(REMEMBER_ME_KEY);
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
  const supabase = requireSupabase();
  const { error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'reset-password', userId, newPassword }
  });
  if (error) return false;

  const user = (await getUsers()).find(u => u.id === userId);
  if (user) {
    await saveUser({ ...user, failedLoginAttempts: 0, isLocked: false });
  }
  return true;
}

export async function createPasswordResetRequest(
  identifier: string
): Promise<{ success: boolean; message: string }> {
  const user = await findUserByEmailOrPhone(identifier);
  if (!user) {
    return { success: false, message: 'No account found with this email or phone number.' };
  }

  const supabase = requireSupabase();
  const { data: existing } = await supabase
    .from('password_reset_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return { success: false, message: 'You already have a pending password reset request. Please wait for admin approval.' };
  }

  const { error } = await supabase.from('password_reset_requests').insert({
    user_id: user.id,
    user_name: user.name,
    user_email: user.email ?? null,
    user_phone: user.phoneNumber ?? null,
    status: 'pending'
  });

  if (error) return { success: false, message: error.message };

  await logActivity(user.id, user.name, 'Password Reset Request', 'Submitted password reset request');
  return { success: true, message: 'Password reset request submitted successfully. Please wait for admin approval.' };
}

export async function getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('password_reset_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email ?? undefined,
    userPhone: row.user_phone ?? undefined,
    requestDate: row.created_at,
    status: row.status,
    processedBy: row.processed_by ?? undefined,
    processedDate: row.processed_at ?? undefined,
    notes: row.notes ?? undefined
  }));
}

export async function approvePasswordResetRequest(
  requestId: string,
  newPassword: string,
  adminId: string,
  adminName: string
): Promise<{ success: boolean; message: string }> {
  const requests = await getPasswordResetRequests();
  const request = requests.find(r => r.id === requestId);
  if (!request) return { success: false, message: 'Request not found.' };
  if (request.status !== 'pending') return { success: false, message: 'Request has already been processed.' };

  const resetSuccess = await resetUserPassword(request.userId, newPassword);
  if (!resetSuccess) {
    return { success: false, message: 'Failed to reset password. Ensure the admin-users Edge Function is deployed.' };
  }

  const supabase = requireSupabase();
  await supabase.from('password_reset_requests').update({
    status: 'approved',
    processed_by: adminName,
    processed_at: new Date().toISOString()
  }).eq('id', requestId);

  await logActivity(adminId, adminName, 'Approve Password Reset', `Approved password reset for ${request.userName}`);
  await logActivity(request.userId, request.userName, 'Password Reset', 'Password reset approved by admin');

  return { success: true, message: `Password reset approved for ${request.userName}. New password: ${newPassword}` };
}

export async function denyPasswordResetRequest(
  requestId: string,
  adminId: string,
  adminName: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const supabase = requireSupabase();
  const { error } = await supabase.from('password_reset_requests').update({
    status: 'denied',
    processed_by: adminName,
    processed_at: new Date().toISOString(),
    notes: notes ?? null
  }).eq('id', requestId);

  if (error) return { success: false, message: error.message };

  const requests = await getPasswordResetRequests();
  const request = requests.find(r => r.id === requestId);
  if (request) {
    await logActivity(adminId, adminName, 'Deny Password Reset', `Denied password reset for ${request.userName}`);
  }

  return { success: true, message: `Password reset request denied for ${request?.userName ?? 'user'}.` };
}

export function onAuthStateChange(callback: (session: AuthSession | null) => void) {
  if (!isSupabaseConfigured) return { unsubscribe: () => {} };
  const supabase = requireSupabase();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session) {
      callback(null);
      return;
    }
    const profile = await fetchProfile(session.user.id);
    if (!profile) {
      callback(null);
      return;
    }
    callback({
      user: profile,
      token: session.access_token,
      expiresAt: new Date(session.expires_at! * 1000).toISOString()
    });
  });
  return { unsubscribe: () => subscription.unsubscribe() };
}
