import { useState } from 'react';
import { ComplianceItem, ComplianceStatus, Priority, ComplianceRecord } from '../types/compliance';
import { Pencil, Save, X, ChevronDown, ChevronRight, Mail, Upload } from 'lucide-react';
import { EmailReportModal } from './EmailReportModal';
import { ImportPreviewModal } from './ImportPreviewModal';
import { ImportGuidedModal } from './ImportGuidedModal';
import { parseChecklistFromExcel } from '../utils/checklistTemplate';
import { toast } from 'sonner';

interface ChecklistProps {
  items: ComplianceItem[];
  onUpdate: (items: ComplianceItem[]) => void;
  employeeName: string;
  record: ComplianceRecord;
}

export function Checklist({ items, onUpdate, employeeName, record }: ChecklistProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ComplianceItem>>({});
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showImportGuide, setShowImportGuide] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importedItems, setImportedItems] = useState<ComplianceItem[]>([]);

  const statuses: Array<'All' | ComplianceStatus> = ['All', 'Compliant', 'In Progress', 'Non-Compliant', 'N/A'];

  // Group items by business process
  const groupedItems: Record<string, ComplianceItem[]> = {};
  items.forEach(item => {
    if (!groupedItems[item.businessProcess]) {
      groupedItems[item.businessProcess] = [];
    }
    groupedItems[item.businessProcess].push(item);
  });

  const toggleProcess = (process: string) => {
    const newExpanded = new Set(expandedProcesses);
    if (newExpanded.has(process)) {
      newExpanded.delete(process);
    } else {
      newExpanded.add(process);
    }
    setExpandedProcesses(newExpanded);
  };

  const handleEdit = (item: ComplianceItem) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const handleSave = () => {
    if (!editingId) return;

    const updatedItems = items.map(item =>
      item.id === editingId ? { ...item, ...editData } : item
    );

    onUpdate(updatedItems);
    setEditingId(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case 'Compliant': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Non-Compliant': return 'bg-red-100 text-red-800';
      case 'N/A': return 'bg-gray-100 text-gray-600';
    }
  };

  const calculateProgress = (processItems: ComplianceItem[]) => {
    const applicable = processItems.filter(item => item.status !== 'N/A');
    if (applicable.length === 0) return 100;
    const compliant = applicable.filter(item => item.status === 'Compliant').length;
    return Math.round((compliant / applicable.length) * 100);
  };

  const expandAll = () => {
    setExpandedProcesses(new Set(Object.keys(groupedItems)));
  };

  const collapseAll = () => {
    setExpandedProcesses(new Set());
  };

  const handleImportClick = () => {
    setShowImportGuide(true);
  };

  const handleFileSelected = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setImporting(true);

    try {
      const parsedItems = await parseChecklistFromExcel(file, employeeName);

      if (parsedItems.length === 0) {
        toast.error('No valid items found in the file');
        setImporting(false);
        return;
      }

      // Show preview modal
      setImportedItems(parsedItems);
      setShowImportPreview(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import checklist');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = () => {
    onUpdate(importedItems);
    setShowImportPreview(false);
    toast.success(`Successfully imported ${importedItems.length} checklist items`);
  };

  const handleCancelImport = () => {
    setShowImportPreview(false);
    setImportedItems([]);
  };

  return (
    <div className="space-y-4">
      {/* Import/Export Instructions */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
        <h3 className="font-semibold text-orange-900 mb-2">📋 Custom Checklist Import</h3>
        <div className="text-sm text-orange-800 space-y-1">
          <p>Don't like the default checklist? Create your own! Click <strong>"Import Template"</strong> to:</p>
          <ul className="ml-4 mt-2 space-y-1">
            <li>1️⃣ Download an Excel template with instructions</li>
            <li>2️⃣ Fill it with your custom compliance requirements</li>
            <li>3️⃣ Upload it back to replace the current checklist</li>
          </ul>
          <p className="text-xs text-orange-700 mt-2 bg-orange-200/50 px-2 py-1 rounded">
            💡 Template includes 8 columns: Business Process, Category, Requirement, Priority, Status, Evidence/Notes, Responsible, Target Date
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 flex-wrap items-end justify-between">
          <div className="flex gap-4 flex-wrap items-end">
            <div>
              <label className="block text-sm font-semibold mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded px-3 py-2 min-w-[200px]"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded font-semibold"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded font-semibold"
              >
                Collapse All
              </button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Upload size={20} />
              {importing ? 'Importing...' : 'Import Template'}
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-[#5B9BD5] hover:bg-[#4682B4] text-white px-6 py-2 rounded font-semibold flex items-center gap-2 transition-colors"
            >
              <Mail size={20} />
              Send by Email
            </button>
          </div>
        </div>
      </div>

      {/* Business Process List */}
      <div className="space-y-3">
        {Object.entries(groupedItems).map(([process, processItems]) => {
          const filteredProcessItems = filterStatus === 'All'
            ? processItems
            : processItems.filter(item => item.status === filterStatus);

          if (filterStatus !== 'All' && filteredProcessItems.length === 0) {
            return null;
          }

          const progress = calculateProgress(processItems);
          const isProcessExpanded = expandedProcesses.has(process);

          return (
            <div key={process} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Business Process Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => toggleProcess(process)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {isProcessExpanded ? (
                    <ChevronDown size={20} className="text-gray-600" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-600" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{process}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex-1 max-w-md">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              progress >= 90 ? 'bg-green-500' : progress >= 75 ? 'bg-[#5B9BD5]' : progress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">
                        {progress}% Complete
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {processItems.length} items
                </div>
              </div>

              {/* Process Items Table */}
              {isProcessExpanded && (
                <div className="border-t overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="text-left p-3 font-semibold text-sm">Category</th>
                        <th className="text-left p-3 font-semibold text-sm">Requirement</th>
                        <th className="text-left p-3 font-semibold text-sm">Priority</th>
                        <th className="text-left p-3 font-semibold text-sm">Status</th>
                        <th className="text-left p-3 font-semibold text-sm">Evidence/Notes</th>
                        <th className="text-left p-3 font-semibold text-sm">Responsible</th>
                        <th className="text-left p-3 font-semibold text-sm">Target Date</th>
                        <th className="text-left p-3 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProcessItems.map(item => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          {editingId === item.id ? (
                            // Edit Mode
                            <>
                              <td className="p-3 font-medium text-sm">{item.category}</td>
                              <td className="p-3 text-sm">{item.requirement}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(item.priority)}`}>
                                  {item.priority}
                                </span>
                              </td>
                              <td className="p-3">
                                <select
                                  value={editData.status || item.status}
                                  onChange={(e) => setEditData({ ...editData, status: e.target.value as ComplianceStatus })}
                                  className="border rounded px-2 py-1 text-sm w-full"
                                >
                                  <option value="Compliant">Compliant</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Not Started">Not Started</option>
                                  <option value="Non-Compliant">Non-Compliant</option>
                                  <option value="N/A">N/A</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={editData.evidence ?? item.evidence}
                                  onChange={(e) => setEditData({ ...editData, evidence: e.target.value })}
                                  className="border rounded px-2 py-1 text-sm w-full"
                                  placeholder="Enter evidence or notes"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={editData.responsible ?? item.responsible}
                                  onChange={(e) => setEditData({ ...editData, responsible: e.target.value })}
                                  className="border rounded px-2 py-1 text-sm w-full"
                                  placeholder={employeeName}
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="date"
                                  value={editData.targetDate ?? item.targetDate}
                                  onChange={(e) => setEditData({ ...editData, targetDate: e.target.value })}
                                  className="border rounded px-2 py-1 text-sm w-full"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleSave}
                                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded"
                                    title="Save"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                                    title="Cancel"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // View Mode
                            <>
                              <td className="p-3 font-medium text-sm">{item.category}</td>
                              <td className="p-3 text-sm">{item.requirement}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(item.priority)}`}>
                                  {item.priority}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-gray-600">{item.evidence || '-'}</td>
                              <td className="p-3 text-sm">{item.responsible || '-'}</td>
                              <td className="p-3 text-sm">{item.targetDate || '-'}</td>
                              <td className="p-3">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="bg-[#5B9BD5] hover:bg-[#5B9BD5] text-white p-2 rounded"
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Import Guided Modal */}
      <ImportGuidedModal
        isOpen={showImportGuide}
        onClose={() => setShowImportGuide(false)}
        onFileSelect={handleFileSelected}
        employeeName={employeeName}
      />

      {/* Import Preview Modal */}
      <ImportPreviewModal
        isOpen={showImportPreview}
        onClose={handleCancelImport}
        onConfirm={handleConfirmImport}
        importedItems={importedItems}
        currentItemsCount={items.length}
      />

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        record={record}
      />
    </div>
  );
}
