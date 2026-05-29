import { requireSupabase } from '../../lib/supabase';

export interface LoginNotification {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  read: boolean;
}

export function sendLoginEmailToUser(userEmail: string, userName: string) {
  const emailContent = {
    to: userEmail,
    subject: 'Security Alert: New Login Detected',
    body: `
      Dear ${userName},

      We detected a new login to your Compliance Management System account.

      Time: ${new Date().toLocaleString()}
      Device: ${navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown Device'}

      If this wasn't you, please contact your administrator immediately.

      Best regards,
      Compliance Management System
    `
  };

  console.log('Email sent to user:', emailContent);
  return emailContent;
}

export function sendLoginEmailToAdmin(
  adminEmail: string,
  userName: string,
  userEmail: string,
  userRole: string
) {
  const emailContent = {
    to: adminEmail,
    subject: `Login Alert: ${userName} logged in`,
    body: `
      Admin Notification,

      A user has logged into the Compliance Management System.

      User Details:
      - Name: ${userName}
      - Email: ${userEmail}
      - Role: ${userRole}
      - Time: ${new Date().toLocaleString()}
      - Device: ${navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown Device'}

      Compliance Management System
    `
  };

  console.log('Email sent to admin:', emailContent);
  return emailContent;
}

export async function createLoginNotification(
  userId: string,
  userName: string,
  userEmail: string
): Promise<LoginNotification> {
  const supabase = requireSupabase();
  const row = {
    user_id: userId,
    user_name: userName,
    user_email: userEmail,
    ip_address: 'Client session',
    device: navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown Device',
    read: false
  };

  const { data, error } = await supabase.from('login_notifications').insert(row).select().single();
  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    userName: data.user_name,
    userEmail: data.user_email ?? '',
    timestamp: data.created_at,
    ipAddress: data.ip_address ?? '',
    device: data.device ?? '',
    read: data.read
  };
}

export async function getLoginNotifications(): Promise<LoginNotification[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('login_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email ?? '',
    timestamp: row.created_at,
    ipAddress: row.ip_address ?? '',
    device: row.device ?? '',
    read: row.read
  }));
}

export async function getUnreadNotifications(): Promise<LoginNotification[]> {
  const notifications = await getLoginNotifications();
  return notifications.filter(n => !n.read);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const supabase = requireSupabase();
  await supabase.from('login_notifications').update({ read: true }).eq('id', notificationId);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = requireSupabase();
  await supabase.from('login_notifications').update({ read: true }).eq('read', false);
}

export async function clearOldNotifications(daysToKeep: number = 7): Promise<void> {
  const supabase = requireSupabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  await supabase.from('login_notifications').delete().lt('created_at', cutoff.toISOString());
}
