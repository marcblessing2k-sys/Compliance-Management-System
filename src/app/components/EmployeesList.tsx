import { useState } from 'react';
import { ComplianceRecord, EmployeeDetails } from '../types/compliance';
import { Pencil, Trash2, Eye, UserPlus, Upload } from 'lucide-react';
import { calculateComplianceRate } from '../utils/complianceCalculations';
import { ImportEmployeeModal } from './ImportEmployeeModal';
import { parseEmployeesFromExcel } from '../utils/employeeTemplate';
import { toast } from 'sonner';

interface EmployeesListProps {
  records: ComplianceRecord[];
  onEdit: (employee: EmployeeDetails) => void;
  onDelete: (employeeId: string) => void;
  onView: (employeeId: string) => void;
  onAddNew: () => void;
  onBulkImport: (employees: EmployeeDetails[]) => void;
}

export function EmployeesList({ records, onEdit, onDelete, onView, onAddNew, onBulkImport }: EmployeesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [showImportModal, setShowImportModal] = useState(false);

  const departments = ['All', ...Array.from(new Set(records.map(r => r.employee.department)))];

  const filteredRecords = records.filter(record => {
    const matchesSearch =
      record.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filterDepartment === 'All' || record.employee.department === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  const handleDelete = (employeeId: string, employeeName: string) => {
    if (confirm(`Are you sure you want to delete ${employeeName}? This will permanently remove all their compliance data.`)) {
      onDelete(employeeId);
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const employees = await parseEmployeesFromExcel(file);
      onBulkImport(employees);
      toast.success(`Successfully imported ${employees.length} employee(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import employees');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Employees Management</h2>
            <p className="text-gray-600">Manage all employee records and compliance data</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-[#5B9BD5] hover:bg-[#4682B4] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <Upload size={20} />
              Import Employees
            </button>
            <button
              onClick={onAddNew}
              className="bg-[#FFE54D] hover:bg-[#FFD700] text-gray-900 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <UserPlus size={20} />
              Add New Employee
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <input
              type="text"
              placeholder="Search by name, role, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
            />
          </div>
          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Employees</p>
          <p className="text-3xl font-bold text-[#5B9BD5]">{records.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Departments</p>
          <p className="text-3xl font-bold text-[#4682B4]">{departments.length - 1}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Avg Compliance</p>
          <p className="text-3xl font-bold text-[#87CEEB]">
            {records.length > 0 ? Math.round(records.reduce((sum, r) => sum + calculateComplianceRate(r.checklist), 0) / records.length) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Showing Results</p>
          <p className="text-3xl font-bold text-[#FFD700]">{filteredRecords.length}</p>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Role</th>
                <th className="text-left p-4 font-semibold">Department</th>
                <th className="text-left p-4 font-semibold">Review Period</th>
                <th className="text-left p-4 font-semibold">Reviewer</th>
                <th className="text-left p-4 font-semibold">Compliance Rate</th>
                <th className="text-left p-4 font-semibold">Last Updated</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No employees found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  const complianceRate = calculateComplianceRate(record.checklist);
                  const rateColor = complianceRate >= 90 ? 'text-green-600' : complianceRate >= 75 ? 'text-[#5B9BD5]' : complianceRate >= 60 ? 'text-yellow-600' : 'text-red-600';

                  return (
                    <tr key={record.employee.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">{record.employee.name}</td>
                      <td className="p-4">{record.employee.role}</td>
                      <td className="p-4">{record.employee.department}</td>
                      <td className="p-4">{record.employee.reviewPeriod}</td>
                      <td className="p-4">{record.employee.reviewer}</td>
                      <td className="p-4">
                        <span className={`text-lg font-bold ${rateColor}`}>
                          {complianceRate}%
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(record.lastUpdated).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onView(record.employee.id)}
                            className="bg-blue-100 hover:bg-blue-200 text-[#5B9BD5] p-2 rounded"
                            title="View Dashboard"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => onEdit(record.employee)}
                            className="bg-yellow-100 hover:bg-yellow-200 text-[#FFD700] p-2 rounded"
                            title="Edit Details"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(record.employee.id, record.employee.name)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards View for Mobile */}
      <div className="md:hidden space-y-4">
        {filteredRecords.map(record => {
          const complianceRate = calculateComplianceRate(record.checklist);
          const rateColor = complianceRate >= 90 ? 'bg-green-100 text-green-800' : complianceRate >= 75 ? 'bg-blue-100 text-blue-800' : complianceRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

          return (
            <div key={record.employee.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{record.employee.name}</h3>
                  <p className="text-sm text-gray-600">{record.employee.role}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${rateColor}`}>
                  {complianceRate}%
                </span>
              </div>
              <div className="space-y-1 mb-4 text-sm">
                <p><span className="font-semibold">Department:</span> {record.employee.department}</p>
                <p><span className="font-semibold">Review Period:</span> {record.employee.reviewPeriod}</p>
                <p><span className="font-semibold">Reviewer:</span> {record.employee.reviewer}</p>
                <p><span className="font-semibold">Last Updated:</span> {new Date(record.lastUpdated).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onView(record.employee.id)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-[#5B9BD5] px-3 py-2 rounded flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  onClick={() => onEdit(record.employee)}
                  className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-[#FFD700] px-3 py-2 rounded flex items-center justify-center gap-2"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(record.employee.id, record.employee.name)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Import Modal */}
      <ImportEmployeeModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onFileSelect={handleImportFile}
      />
    </div>
  );
}
