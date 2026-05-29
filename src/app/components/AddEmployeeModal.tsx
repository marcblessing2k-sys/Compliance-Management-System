import { useState } from 'react';
import { X } from 'lucide-react';
import { ConsultantDetails } from '../types/compliance';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (employee: ConsultantDetails) => void;
}

export function AddEmployeeModal({ isOpen, onClose, onAdd }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: '',
    reviewer: '',
    reviewMonth: 'May',
    reviewYear: 2026
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.role || !formData.department || !formData.reviewer) {
      alert('Please fill in all required fields');
      return;
    }

    const newEmployee: ConsultantDetails = {
      id: `employee-${Date.now()}`,
      name: formData.name,
      role: formData.role,
      department: formData.department,
      reviewPeriod: `${formData.reviewMonth} ${formData.reviewYear}`,
      reviewer: formData.reviewer,
      date: new Date().toISOString().split('T')[0]
    };

    onAdd(newEmployee);
    setFormData({ name: '', role: '', department: '', reviewer: '', reviewMonth: 'May', reviewYear: 2026 });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'reviewYear' ? Number(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 10000 - 1900 + 1 }, (_, i) => 1900 + i);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Add New Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Employee Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Role <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
              placeholder="e.g., Senior Consultant"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Department <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
              placeholder="e.g., IT Services"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Review Month <span className="text-red-600">*</span>
              </label>
              <select
                name="reviewMonth"
                value={formData.reviewMonth}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Review Year <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="reviewYear"
                value={formData.reviewYear}
                onChange={handleChange}
                min={1900}
                max={10000}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Reviewer <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="reviewer"
              value={formData.reviewer}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
              placeholder="Enter reviewer name"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-[#5B9BD5] hover:bg-[#4682B4] text-white px-6 py-3 rounded-lg font-semibold"
            >
              Add Employee
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
