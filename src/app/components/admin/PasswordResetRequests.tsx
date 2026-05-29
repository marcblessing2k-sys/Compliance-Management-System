import { useState, useEffect } from 'react';
import { PasswordResetRequest } from '../../types/auth';
import { getPasswordResetRequests, approvePasswordResetRequest, denyPasswordResetRequest } from '../../utils/authService';
import type { AuthSession } from '../../types/auth';
import { Key, CheckCircle, XCircle, Clock, Mail, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

export function PasswordResetRequests({ session }: { session: AuthSession }) {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setRequests(await getPasswordResetRequests());
    } catch (err) {
      toast.error((err as Error).message || 'Failed to load requests');
    }
  };

  const handleApprove = (request: PasswordResetRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleDeny = (request: PasswordResetRequest) => {
    setSelectedRequest(request);
    setShowDenyModal(true);
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const deniedCount = requests.filter(r => r.status === 'denied').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <Key className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Password Reset Requests</h2>
            <p className="text-gray-600">Review and approve user password reset requests</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('denied')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === 'denied' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Denied ({deniedCount})
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Requests</p>
          <p className="text-3xl font-bold text-purple-600">{requests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Approved</p>
          <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Denied</p>
          <p className="text-3xl font-bold text-red-600">{deniedCount}</p>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left p-4 font-semibold">User</th>
                <th className="text-left p-4 font-semibold">Contact</th>
                <th className="text-left p-4 font-semibold">Request Date</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Processed By</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No password reset requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map(request => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-semibold">{request.userName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {request.userEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-gray-400" />
                          {request.userEmail}
                        </div>
                      )}
                      {request.userPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-400" />
                          {request.userPhone}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        {new Date(request.requestDate).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {request.processedBy ? (
                        <div>
                          <div>{request.processedBy}</div>
                          <div className="text-xs text-gray-500">
                            {request.processedDate && new Date(request.processedDate).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4">
                      {request.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request)}
                            className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded flex items-center gap-1 text-sm font-semibold"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeny(request)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded flex items-center gap-1 text-sm font-semibold"
                            title="Deny"
                          >
                            <XCircle size={16} />
                            Deny
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <ApproveModal
          request={selectedRequest}
          session={session}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            loadRequests();
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
        />
      )}

      {showDenyModal && selectedRequest && (
        <DenyModal
          request={selectedRequest}
          session={session}
          onClose={() => {
            setShowDenyModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            loadRequests();
            setShowDenyModal(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}

function ApproveModal({ request, session, onClose, onSuccess }: { request: PasswordResetRequest; session: AuthSession; onClose: () => void; onSuccess: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await approvePasswordResetRequest(
      request.id,
      newPassword,
      session.user.id,
      session.user.name
    );

    if (result.success) {
      setShowPassword(true);
      toast.success('Password reset approved successfully');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Approve Password Reset</h2>
            <p className="text-sm text-gray-600">For user: {request.userName}</p>
          </div>
        </div>

        {!showPassword ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Minimum 6 characters"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Re-enter password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
              >
                Approve & Set Password
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-900 mb-2">Password reset approved successfully!</p>
              <p className="text-sm text-green-800 mb-3">
                Please communicate this password to <strong>{request.userName}</strong>:
              </p>
              <div className="bg-white p-3 rounded border border-green-300">
                <p className="text-lg font-mono font-bold text-center text-green-900">{newPassword}</p>
              </div>
            </div>

            <button
              onClick={() => {
                onSuccess();
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DenyModal({ request, session, onClose, onSuccess }: { request: PasswordResetRequest; session: AuthSession; onClose: () => void; onSuccess: () => void }) {
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await denyPasswordResetRequest(
      request.id,
      session.user.id,
      session.user.name,
      notes
    );

    if (result.success) {
      toast.info('Password reset request denied');
      onSuccess();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <XCircle className="text-red-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Deny Password Reset</h2>
            <p className="text-sm text-gray-600">For user: {request.userName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Reason (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter reason for denial..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
            >
              Deny Request
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
