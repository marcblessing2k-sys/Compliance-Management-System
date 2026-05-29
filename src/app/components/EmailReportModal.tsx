import { useState, useEffect } from 'react';
import { X, Mail, Send } from 'lucide-react';
import { ComplianceRecord } from '../types/compliance';
import { toast } from 'sonner';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ComplianceRecord;
}

export function EmailReportModal({ isOpen, onClose, record }: EmailReportModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form fields when modal opens
  useEffect(() => {
    if (isOpen && record) {
      setSubject(`Compliance Report - ${record.employee.name} - ${new Date().toLocaleDateString()}`);
      setMessage(`Dear Reviewer,\n\nPlease find attached the compliance report for ${record.employee.name}.\n\nBest regards,\nCompliance Management System`);
      setRecipientEmail('');
      setCcEmails('');
      setError('');
    }
  }, [isOpen, record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recipientEmail) {
      setError('Please enter recipient email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate CC emails if provided
    if (ccEmails) {
      const ccList = ccEmails.split(',').map(e => e.trim());
      for (const email of ccList) {
        if (!emailRegex.test(email)) {
          setError(`Invalid CC email: ${email}`);
          return;
        }
      }
    }

    setLoading(true);

    // Simulate email sending
    setTimeout(() => {
      setLoading(false);
      toast.success(`Compliance report sent successfully to ${recipientEmail}`);

      // Log the action (in a real app, this would be server-side)
      console.log('Email Report Sent:', {
        to: recipientEmail,
        cc: ccEmails,
        subject,
        message,
        employee: record.employee.name,
        timestamp: new Date().toISOString()
      });

      onClose();
    }, 1500);
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Mail className="text-[#5B9BD5]" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Email Compliance Report</h2>
              <p className="text-sm text-gray-600">Send report to reviewer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Report Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Report Details</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Employee:</strong> {record.employee.name}</p>
              <p><strong>Role:</strong> {record.employee.role}</p>
              <p><strong>Department:</strong> {record.employee.department}</p>
              <p><strong>Review Period:</strong> {record.employee.reviewPeriod}</p>
              <p><strong>Reviewer:</strong> {record.employee.reviewer}</p>
              <p><strong>Last Updated:</strong> {new Date(record.lastUpdated).toLocaleString()}</p>
            </div>
          </div>

          {/* Recipient Email */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Recipient Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
              placeholder="reviewer@example.com"
              required
            />
          </div>

          {/* CC Emails */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              CC (Optional)
            </label>
            <input
              type="text"
              value={ccEmails}
              onChange={(e) => setCcEmails(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
              placeholder="email1@example.com, email2@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Subject <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Message <span className="text-red-600">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
              rows={6}
              required
            />
          </div>

          {/* Attachment Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">📎 Attachment:</p>
            <p className="text-sm text-gray-600">
              Compliance_Report_{record.employee.name.replace(/\s+/g, '_')}_{new Date().toISOString().split('T')[0]}.pdf
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#5B9BD5] hover:bg-[#4682B4] text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Report'}
              <Send size={20} />
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {/* Note */}
          <div className="text-xs text-gray-500 text-center pt-2">
            Note: This is a demo. In production, the report would be generated as a PDF and sent via email server.
          </div>
        </form>
      </div>
    </div>
  );
}
