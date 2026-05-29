import { useState, useEffect } from 'react';
import { Bell, User, Clock, Monitor, CheckCircle, Trash2, Filter } from 'lucide-react';
import { getLoginNotifications, markAllNotificationsAsRead, clearOldNotifications } from '../../utils/notificationService';
import { toast } from 'sonner';

interface LoginNotification {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  read: boolean;
}

export function LoginNotifications() {
  const [notifications, setNotifications] = useState<LoginNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();

    // Refresh every 5 seconds
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setNotifications(await getLoginNotifications());
    } catch {
      // ignore refresh errors
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    await loadNotifications();
    toast.success('All notifications marked as read');
  };

  const handleClearOld = async () => {
    if (confirm('Clear notifications older than 7 days?')) {
      await clearOldNotifications(7);
      await loadNotifications();
      toast.success('Old notifications cleared');
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#5B9BD5] p-3 rounded-full">
              <Bell className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Login Notifications</h2>
              <p className="text-gray-600">
                Monitor user login activity
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleMarkAllRead}
              className="bg-[#5B9BD5] hover:bg-[#4682B4] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              disabled={unreadCount === 0}
            >
              <CheckCircle size={20} />
              Mark All Read
            </button>
            <button
              onClick={handleClearOld}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Trash2 size={20} />
              Clear Old
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-[#5B9BD5] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'unread'
                ? 'bg-[#5B9BD5] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-semibold">No notifications to display</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter === 'unread' ? 'All caught up! No unread notifications.' : 'Login notifications will appear here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow p-6 border-l-4 transition-all ${
                notification.read
                  ? 'border-gray-300 opacity-75'
                  : 'border-[#5B9BD5] shadow-lg'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${notification.read ? 'bg-gray-200' : 'bg-[#5B9BD5]'}`}>
                    <User className={notification.read ? 'text-gray-600' : 'text-white'} size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{notification.userName}</h3>
                    <p className="text-sm text-gray-600">{notification.userEmail}</p>
                  </div>
                </div>
                {!notification.read && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    NEW
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Login Time</p>
                    <p className="text-sm font-semibold">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Monitor size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Device</p>
                    <p className="text-sm font-semibold">{notification.device}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Filter size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">IP Address</p>
                    <p className="text-sm font-semibold">{notification.ipAddress}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 italic">
                  Security notification: User successfully authenticated and accessed the system
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
