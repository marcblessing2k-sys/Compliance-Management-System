import { useState, useEffect } from 'react';
import { MonthlyArchive, ComplianceRecord } from '../types/compliance';
import { loadArchives, saveArchive, deleteArchive, loadArchive } from '../utils/storage';
import { Archive, Download, Trash2, Eye, X, FileSpreadsheet, Mail } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { EmailReportModal } from './EmailReportModal';
import { calculateComplianceRate } from '../utils/complianceCalculations';
import * as XLSX from 'xlsx';

interface ArchivesProps {
  businessUnit: string;
  onSaveArchive: (month: string, year: number) => void;
}

export function Archives({ businessUnit, onSaveArchive }: ArchivesProps) {
  const [archives, setArchives] = useState<MonthlyArchive[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<MonthlyArchive | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<ComplianceRecord | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recordToEmail, setRecordToEmail] = useState<ComplianceRecord | null>(null);

  useEffect(() => {
    loadArchivesList();
  }, []);

  const loadArchivesList = async () => {
    try {
      const loaded = await loadArchives(businessUnit);
      setArchives(loaded.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveArchive = async () => {
    await saveArchive(selectedMonth, selectedYear, businessUnit);
    onSaveArchive(selectedMonth, selectedYear);
    await loadArchivesList();
    setShowSaveDialog(false);
  };

  const handleDeleteArchive = async (archiveId: string) => {
    if (confirm('Are you sure you want to delete this archive? This action cannot be undone.')) {
      await deleteArchive(archiveId);
      await loadArchivesList();
      if (selectedArchive?.id === archiveId) {
        setSelectedArchive(null);
      }
    }
  };

  const handleViewArchive = async (archiveId: string) => {
    const archive = await loadArchive(archiveId);
    setSelectedArchive(archive);
    setSelectedEmployee(null);
  };

  const handleViewEmployee = (record: ComplianceRecord) => {
    setSelectedEmployee(record);
  };

  const handleBackToList = () => {
    setSelectedEmployee(null);
  };

  const handleBackToArchives = () => {
    setSelectedArchive(null);
    setSelectedEmployee(null);
  };

  const handleDownloadEmployee = (record: ComplianceRecord) => {
    const workbook = XLSX.utils.book_new();

    const employeeData = [
      [`${record.employee.name} - Compliance Checklist`],
      ['Role', record.employee.role],
      ['Department', record.employee.department],
      ['Review Period', record.employee.reviewPeriod],
      ['Reviewer', record.employee.reviewer],
      ['Last Updated', new Date(record.lastUpdated).toLocaleDateString()],
      [],
      ['Business Process', 'Category', 'Requirement', 'Priority', 'Status', 'Evidence/Notes', 'Responsible', 'Target Date']
    ];

    record.checklist.forEach(item => {
      employeeData.push([
        item.businessProcess,
        item.category,
        item.requirement,
        item.priority,
        item.status,
        item.evidence,
        item.responsible,
        item.targetDate
      ]);
    });

    const employeeSheet = XLSX.utils.aoa_to_sheet(employeeData);
    XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Compliance Checklist');

    XLSX.writeFile(workbook, `${record.employee.name}_compliance_checklist.xlsx`);
  };

  const handleEmailEmployee = (record: ComplianceRecord) => {
    setRecordToEmail(record);
    setShowEmailModal(true);
  };

  const handleDownloadArchive = (archive: MonthlyArchive) => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Archive Summary'],
      ['Month', archive.month],
      ['Year', archive.year],
      ['Archived Date', new Date(archive.archivedDate).toLocaleDateString()],
      ['Total Employees', archive.records.length],
      [],
      ['Employee Name', 'Role', 'Department', 'Review Period', 'Reviewer', 'Compliance Rate', 'Non-Compliance Rate', 'Last Updated']
    ];

    archive.records.forEach(record => {
      const complianceRate = Math.round(
        (record.checklist.filter(item => item.status === 'Compliant' && item.status !== 'N/A').length /
          record.checklist.filter(item => item.status !== 'N/A').length) * 100
      );
      const nonComplianceRate = complianceRate === 100 ? 0 : 100 - complianceRate;

      summaryData.push([
        record.employee.name,
        record.employee.role,
        record.employee.department,
        record.employee.reviewPeriod,
        record.employee.reviewer,
        `${complianceRate}%`,
        `${nonComplianceRate}%`,
        new Date(record.lastUpdated).toLocaleDateString()
      ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Create a sheet for each employee's checklist
    archive.records.forEach((record, index) => {
      const employeeData = [
        [`${record.employee.name} - Compliance Checklist`],
        ['Role', record.employee.role],
        ['Department', record.employee.department],
        ['Review Period', record.employee.reviewPeriod],
        ['Reviewer', record.employee.reviewer],
        [],
        ['Business Process', 'Category', 'Requirement', 'Priority', 'Status', 'Evidence/Notes', 'Responsible', 'Target Date']
      ];

      record.checklist.forEach(item => {
        employeeData.push([
          item.businessProcess,
          item.category,
          item.requirement,
          item.priority,
          item.status,
          item.evidence,
          item.responsible,
          item.targetDate
        ]);
      });

      const employeeSheet = XLSX.utils.aoa_to_sheet(employeeData);

      // Limit sheet name to 31 characters (Excel limitation)
      let sheetName = record.employee.name.substring(0, 25);
      if (archive.records.filter(r => r.employee.name === record.employee.name).length > 1) {
        sheetName = `${sheetName}_${index + 1}`;
      }

      XLSX.utils.book_append_sheet(workbook, employeeSheet, sheetName);
    });

    // Generate Excel file and download
    XLSX.writeFile(workbook, `compliance_archive_${archive.month}_${archive.year}.xlsx`);
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  // Show individual employee dashboard
  if (selectedEmployee && selectedArchive) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{selectedEmployee.employee.name}</h2>
            <p className="text-sm text-gray-600">
              Archive: {selectedArchive.month} {selectedArchive.year} (Archived on {new Date(selectedArchive.archivedDate).toLocaleDateString()})
            </p>
          </div>
          <button
            onClick={handleBackToList}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <X size={20} />
            Back to List
          </button>
        </div>

        <Dashboard record={selectedEmployee} />
      </div>
    );
  }

  // Show employees list for selected archive
  if (selectedArchive) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Archive: {selectedArchive.month} {selectedArchive.year}</h2>
              <p className="text-sm text-gray-600">
                Archived on {new Date(selectedArchive.archivedDate).toLocaleDateString()} • {selectedArchive.records.length} employee{selectedArchive.records.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownloadArchive(selectedArchive)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Download size={20} />
                Download Archive
              </button>
              <button
                onClick={handleBackToArchives}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <X size={20} />
                Close
              </button>
            </div>
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
                {selectedArchive.records.map((record, index) => {
                  const complianceRate = calculateComplianceRate(record.checklist);
                  const rateColor = complianceRate >= 90 ? 'text-green-600' : complianceRate >= 75 ? 'text-[#5B9BD5]' : complianceRate >= 60 ? 'text-yellow-600' : 'text-red-600';

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
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
                            onClick={() => handleViewEmployee(record)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded"
                            title="View Dashboard"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEmailEmployee(record)}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-2 rounded"
                            title="Send by Email"
                          >
                            <Mail size={16} />
                          </button>
                          <button
                            onClick={() => handleDownloadEmployee(record)}
                            className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded"
                            title="Download Excel"
                          >
                            <FileSpreadsheet size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-4">
          {selectedArchive.records.map((record, index) => {
            const complianceRate = calculateComplianceRate(record.checklist);
            const rateColor = complianceRate >= 90 ? 'bg-green-100 text-green-800' : complianceRate >= 75 ? 'bg-blue-100 text-blue-800' : complianceRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

            return (
              <div key={index} className="bg-white rounded-lg shadow p-4">
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
                    onClick={() => handleViewEmployee(record)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleEmailEmployee(record)}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded flex items-center justify-center"
                  >
                    <Mail size={16} />
                  </button>
                  <button
                    onClick={() => handleDownloadEmployee(record)}
                    className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded flex items-center justify-center"
                  >
                    <FileSpreadsheet size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Monthly Archives</h2>
            <p className="text-gray-600">Save and view historical compliance records</p>
          </div>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="bg-[#5B9BD5] hover:bg-[#4682B4] text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold"
          >
            <Archive size={20} />
            Save Current Month
          </button>
        </div>
      </div>

      {/* Save Archive Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Save Archive</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveArchive}
                  className="flex-1 bg-[#5B9BD5] hover:bg-[#4682B4] text-white px-4 py-2 rounded"
                >
                  Save Archive
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archives List */}
      {archives.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Archive size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Archives Yet</h3>
          <p className="text-gray-500">Save your first monthly archive to begin tracking historical compliance data</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archives.map(archive => (
            <div key={archive.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{archive.month} {archive.year}</h3>
                  <p className="text-sm text-gray-600">
                    {archive.records.length} employee{archive.records.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Archive size={24} className="text-[#5B9BD5]" />
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Saved: {new Date(archive.archivedDate).toLocaleDateString()}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewArchive(archive.id)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded flex items-center justify-center gap-2"
                  title="View"
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  onClick={() => handleDownloadArchive(archive)}
                  className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded flex items-center justify-center gap-2"
                  title="Download"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={() => handleDeleteArchive(archive.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded flex items-center justify-center"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Email Report Modal */}
      {recordToEmail && (
        <EmailReportModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setRecordToEmail(null);
          }}
          record={recordToEmail}
        />
      )}
    </div>
  );
}
