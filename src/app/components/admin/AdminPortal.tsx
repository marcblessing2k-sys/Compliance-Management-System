import { useState, useEffect } from 'react';
import { Users, Activity, LogOut, Key, Bell } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { ActivityLogs } from './ActivityLogs';
import { PasswordResetRequests } from './PasswordResetRequests';
import { LoginNotifications } from './LoginNotifications';
import { FloatingChat } from '../FloatingChat';
import { logout, getPasswordResetRequests } from '../../utils/authService';
import { getUnreadNotifications } from '../../utils/notificationService';
import { Toaster } from 'sonner';
import { LoginNotificationPopup } from './LoginNotificationPopup';
import type { AuthSession } from '../../types/auth';

interface AdminPortalProps {
  onLogout: () => void;
  session: AuthSession;
}

type AdminTab = 'users' | 'activity' | 'reset-requests' | 'login-notifications';

export function AdminPortal({ onLogout, session }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [pendingResetCount, setPendingResetCount] = useState(0);
  const [unreadLoginNotifications, setUnreadLoginNotifications] = useState(0);

  useEffect(() => {
    const updateCounts = async () => {
      try {
        const requests = await getPasswordResetRequests();
        setPendingResetCount(requests.filter(r => r.status === 'pending').length);
        const unreadLogins = await getUnreadNotifications();
        setUnreadLoginNotifications(unreadLogins.length);
      } catch {
        // ignore polling errors
      }
    };

    updateCounts();
    const interval = setInterval(updateCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  if (session.user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Unauthorized Access</p>
          <p className="text-gray-600 mt-2">You don't have admin privileges</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <LoginNotificationPopup />
      <div className="bg-gradient-to-r from-[#5B9BD5] to-[#4682B4] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Portal</h1>
              <p className="text-blue-100 mt-1">Compliance Management System Administration</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{session.user.name}</p>
                <p className="text-sm text-blue-200">Administrator</p>
              </div>
              <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors" title="Logout">
                <LogOut size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {([
              ['users', 'User Management', Users, 0],
              ['reset-requests', 'Password Resets', Key, pendingResetCount],
              ['login-notifications', 'Login Notifications', Bell, unreadLoginNotifications],
              ['activity', 'Activity Logs', Activity, 0],
            ] as const).map(([tab, label, Icon, badge]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors relative ${
                  activeTab === tab ? 'text-[#5B9BD5] border-b-2 border-[#5B9BD5] bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {label}
                {badge > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'users' && <UserManagement session={session} />}
        {activeTab === 'reset-requests' && <PasswordResetRequests session={session} />}
        {activeTab === 'login-notifications' && <LoginNotifications />}
        {activeTab === 'activity' && <ActivityLogs />}
      </div>

      <FloatingChat currentUserId={session.user.id} currentUserName={session.user.name} />
    </div>
  );
}
