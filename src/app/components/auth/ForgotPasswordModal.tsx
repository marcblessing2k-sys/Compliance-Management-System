import { useState } from 'react';
import { X, Mail, Phone, Send } from 'lucide-react';
import { createPasswordResetRequest } from '../../utils/authService';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!identifier) {
      setError(`Please enter your ${contactMethod}`);
      return;
    }
    if (contactMethod === 'email' && !identifier.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (contactMethod === 'phone' && identifier.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await createPasswordResetRequest(identifier);
      if (!result.success) {
        setError(result.message);
      } else {
        setSuccess(result.message);
      }
    } catch (err) {
      setError((err as Error).message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Forgot Password</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <p className="text-gray-600 mb-6">
          Submit a password reset request. An administrator will review and approve it.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setContactMethod('email')} className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${contactMethod === 'email' ? 'bg-[#5B9BD5] text-white' : 'bg-gray-100'}`}>
              <Mail size={18} /> Email
            </button>
            <button type="button" onClick={() => setContactMethod('phone')} className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${contactMethod === 'phone' ? 'bg-[#5B9BD5] text-white' : 'bg-gray-100'}`}>
              <Phone size={18} /> Phone
            </button>
          </div>

          <input
            type={contactMethod === 'email' ? 'email' : 'tel'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={contactMethod === 'email' ? 'your@email.com' : '+1234567890'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5] mb-4"
          />

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

          <button type="submit" disabled={loading || !!success} className="w-full bg-[#5B9BD5] hover:bg-[#4682B4] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Request'}
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
