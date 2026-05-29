import { useState, useEffect } from 'react';
import { ActivityLog } from '../../types/auth';
import { getActivityLogs, clearActivityLogs } from '../../utils/authService';
import { Clock, User, Activity, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filterAction, setFilterAction] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLogs(await getActivityLogs());
    } catch (err) {
      toast.error((err as Error).message || 'Failed to load activity logs');
    }
  };

  const handleClearLogs = async () => {
    if (confirm('Are you sure you want to clear all activity logs? This action cannot be undone.')) {
      try {
        await clearActivityLogs();
        await loadLogs();
        toast.success('Activity logs cleared');
      } catch (err) {
        toast.error((err as Error).message || 'Failed to clear logs');
      }
    }
  };

  const actions = ['All', ...Array.from(new Set(logs.map(log => log.action)))];

  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction === 'All' || log.action === filterAction;
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Login': return 'bg-green-100 text-green-800';
      case 'Logout': return 'bg-gray-100 text-gray-800';
      case 'Add User': return 'bg-blue-100 text-blue-800';
      case 'Delete User': return 'bg-red-100 text-red-800';
      case 'Update User Status': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Login': return '🔓';
      case 'Logout': return '🔒';
      case 'Add User': return '➕';
      case 'Delete User': return '🗑️';
      case 'Update User Status': return '✏️';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Activity Logs</h2>
            <p className="text-gray-600">Monitor user connections and system activities</p>
          </div>
          <button
            onClick={handleClearLogs}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <Trash2 size={20} />
            Clear Logs
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <input
              type="text"
              placeholder="Search by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {actions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Activities</p>
          <p className="text-3xl font-bold text-purple-600">{logs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Today's Activities</p>
          <p className="text-3xl font-bold text-[#5B9BD5]">
            {logs.filter(log => {
              const logDate = new Date(log.timestamp).toDateString();
              const today = new Date().toDateString();
              return logDate === today;
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">User Logins</p>
          <p className="text-3xl font-bold text-green-600">
            {logs.filter(log => log.action === 'Login').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Admin Actions</p>
          <p className="text-3xl font-bold text-orange-600">
            {logs.filter(log => log.action.includes('User')).length}
          </p>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-gray-600" />
            <h3 className="font-semibold">Activity Timeline</h3>
            <span className="text-sm text-gray-600">({filteredLogs.length} entries)</span>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Activity size={48} className="mx-auto mb-4 opacity-20" />
              <p>No activity logs found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl mt-1">{getActionIcon(log.action)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{log.userName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          User ID: {log.userId.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
