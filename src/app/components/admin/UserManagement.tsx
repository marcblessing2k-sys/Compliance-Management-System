import { useState, useEffect } from 'react';
import { User } from '../../types/auth';
import { getUsers, saveUser, deleteUser, logActivity, resetUserPassword, checkEmailOrPhoneExists, adminCreateUser } from '../../utils/authService';
import type { AuthSession } from '../../types/auth';
import { UserPlus, Trash2, Ban, CheckCircle, Mail, Phone, Calendar, Key } from 'lucide-react';
import { toast } from 'sonner';

export function UserManagement({ session }: { session: AuthSession | null }) {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setUsers(await getUsers());
    } catch (err) {
      toast.error((err as Error).message || 'Failed to load users');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin') {
      toast.error('Cannot delete admin user');
      return;
    }

    if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      try {
        await deleteUser(user.id);
        await logActivity(session?.user.id || '', session?.user.name || 'Admin', 'Delete User', `Deleted user: ${user.name}`);
        await loadUsers();
        toast.success(`User ${user.name} deleted successfully`);
      } catch (err) {
        toast.error((err as Error).message || 'Failed to delete user');
      }
    }
  };

  const toggleUserStatus = async (user: User) => {
    if (user.role === 'admin') {
      toast.error('Cannot deactivate admin user');
      return;
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const updatedUser = { ...user, status: newStatus };
    try {
      await saveUser(updatedUser);
      await logActivity(session?.user.id || '', session?.user.name || 'Admin', 'Update User Status', `Changed ${user.name} status to ${newStatus}`);
      await loadUsers();
      toast.success(`User ${user.name} ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update user');
    }
  };

  const handleResetPassword = (user: User) => {
    setUserToReset(user);
    setShowResetModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-gray-600">Manage system users and their access</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <UserPlus size={20} />
            Add New User
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search users by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-purple-600">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Active Users</p>
          <p className="text-3xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Inactive Users</p>
          <p className="text-3xl font-bold text-red-600">{users.filter(u => u.status === 'inactive').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Administrators</p>
          <p className="text-3xl font-bold text-[#5B9BD5]">{users.filter(u => u.role === 'admin').length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Contact</th>
                <th className="text-left p-4 font-semibold">Role</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Login Status</th>
                <th className="text-left p-4 font-semibold">Created</th>
                <th className="text-left p-4 font-semibold">Last Login</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold">{user.name}</div>
                    {user.role === 'admin' && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Admin</span>
                    )}
                  </td>
                  <td className="p-4">
                    {user.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-gray-400" />
                        {user.email}
                      </div>
                    )}
                    {user.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-gray-400" />
                        {user.phoneNumber}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.isLocked ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        🔒 Locked ({user.failedLoginAttempts}/2)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        ✓ Unlocked
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="p-2 rounded bg-blue-100 hover:bg-blue-200 text-blue-700"
                        title="Reset Password"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user)}
                        disabled={user.role === 'admin'}
                        className={`p-2 rounded ${
                          user.role === 'admin'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : user.status === 'active'
                            ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={user.role === 'admin'}
                        className={`p-2 rounded ${
                          user.role === 'admin'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-100 hover:bg-red-200 text-red-700'
                        }`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          session={session}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadUsers();
            setShowAddModal(false);
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showResetModal && userToReset && (
        <ResetPasswordModal
          user={userToReset}
          onClose={() => {
            setShowResetModal(false);
            setUserToReset(null);
          }}
          onSuccess={() => {
            loadUsers();
            setShowResetModal(false);
            setUserToReset(null);
          }}
        />
      )}
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onSuccess }: { user: User; onClose: () => void; onSuccess: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

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

    const result = await resetUserPassword(user.id, newPassword);
    if (result.success) {
      toast.success(result.message);
      onSuccess();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Key className="text-[#5B9BD5]" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Reset Password</h2>
            <p className="text-sm text-gray-600">For user: {user.name}</p>
          </div>
        </div>

        {user.isLocked && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <strong>Account is locked</strong> after {user.failedLoginAttempts} failed login attempts. Resetting password will unlock the account.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
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
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
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
              className="flex-1 bg-[#5B9BD5] hover:bg-[#4682B4] text-white py-2 rounded-lg font-semibold"
            >
              Reset Password
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

function AddUserModal({ session, onClose, onSuccess }: { session: AuthSession | null; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !contact || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const isDuplicate = await checkEmailOrPhoneExists(
      contactMethod === 'email' ? contact : undefined,
      contactMethod === 'phone' ? contact : undefined
    );

    if (isDuplicate) {
      setError(`This ${contactMethod} is already registered.`);
      return;
    }

    setLoading(true);
    try {
      const result = await adminCreateUser(name, contact, password, role, contactMethod);
      if (!result.success) {
        setError(result.error || 'Failed to create user');
        return;
      }
      await logActivity(session?.user.id || '', session?.user.name || 'Admin', 'Add User', `Added new user: ${name.trim()}`);
      toast.success(`User ${name.trim()} added successfully`);
      onSuccess();
    } catch (err) {
      setError((err as Error).message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Add New User</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Contact Method</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContactMethod('email')}
                className={`flex-1 py-2 rounded-lg ${
                  contactMethod === 'email' ? 'bg-purple-600 text-white' : 'bg-gray-100'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setContactMethod('phone')}
                className={`flex-1 py-2 rounded-lg ${
                  contactMethod === 'phone' ? 'bg-purple-600 text-white' : 'bg-gray-100'
                }`}
              >
                Phone
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              {contactMethod === 'email' ? 'Email' : 'Phone'}
            </label>
            <input
              type={contactMethod === 'email' ? 'email' : 'tel'}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={contactMethod === 'email' ? 'user@example.com' : '+1234567890'}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="user">User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50">
              {loading ? 'Adding...' : 'Add User'}
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
