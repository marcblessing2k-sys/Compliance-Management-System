import { useState, useEffect } from 'react';
import { X, User, Clock, Monitor, CheckCircle } from 'lucide-react';
import { getUnreadNotifications, markNotificationAsRead } from '../../utils/notificationService';

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

export function LoginNotificationPopup() {
  const [notifications, setNotifications] = useState<LoginNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const unread = await getUnreadNotifications();
        const newNotifications = unread.filter(n => !dismissedIds.has(n.id));
        setNotifications(newNotifications);
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [dismissedIds]);

  const handleDismiss = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    setDismissedIds(prev => new Set(prev).add(notificationId));
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleDismissAll = async () => {
    for (const n of notifications) {
      await markNotificationAsRead(n.id);
      setDismissedIds(prev => new Set(prev).add(n.id));
    }
    setNotifications([]);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 space-y-3 max-w-md">
      {notifications.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={handleDismissAll}
            className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <CheckCircle size={16} />
            Dismiss All ({notifications.length})
          </button>
        </div>
      )}

      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white rounded-lg shadow-2xl border-l-4 border-[#5B9BD5] animate-slide-in-right overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#5B9BD5] p-2 rounded-full">
                  <User className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">New Login Detected</h3>
                  <p className="text-xs text-gray-500">Security Alert</p>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(notification.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <User size={16} className="text-[#5B9BD5] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{notification.userName}</p>
                  <p className="text-gray-600 text-xs">{notification.userEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} className="text-gray-400 flex-shrink-0" />
                <p className="text-xs">{new Date(notification.timestamp).toLocaleString()}</p>
              </div>

              <div className="flex items-start gap-2 text-gray-600">
                <Monitor size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs">{notification.device}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 italic">
                User has successfully logged into the system
              </p>
            </div>
          </div>

          {/* Progress bar animation */}
          <div className="h-1 bg-gray-100">
            <div className="h-full bg-[#5B9BD5] animate-progress-bar"></div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes progress-bar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-progress-bar {
          animation: progress-bar 10s linear forwards;
        }
      `}</style>
    </div>
  );
}
