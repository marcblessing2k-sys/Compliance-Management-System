import { ComplianceItem } from '../types/compliance';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  importedItems: ComplianceItem[];
  currentItemsCount: number;
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  importedItems,
  currentItemsCount
}: ImportPreviewModalProps) {
  if (!isOpen) return null;

  // Group by business process
  const groupedByProcess: Record<string, ComplianceItem[]> = {};
  importedItems.forEach(item => {
    if (!groupedByProcess[item.businessProcess]) {
      groupedByProcess[item.businessProcess] = [];
    }
    groupedByProcess[item.businessProcess].push(item);
  });

  // Calculate statistics
  const totalItems = importedItems.length;
  const processCount = Object.keys(groupedByProcess).length;
  const statusCounts = {
    'Compliant': importedItems.filter(i => i.status === 'Compliant').length,
    'In Progress': importedItems.filter(i => i.status === 'In Progress').length,
    'Not Started': importedItems.filter(i => i.status === 'Not Started').length,
    'Non-Compliant': importedItems.filter(i => i.status === 'Non-Compliant').length,
    'N/A': importedItems.filter(i => i.status === 'N/A').length,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b p-6 flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-3 rounded-full">
              <AlertCircle className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import Preview</h2>
              <p className="text-sm text-gray-600">Review imported checklist before replacing current data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900 mb-1">⚠️ This will replace your current checklist</p>
                <p className="text-yellow-800">
                  Current: <strong>{currentItemsCount} items</strong> → New: <strong>{totalItems} items</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-[#5B9BD5] mb-1">Total Items</p>
              <p className="text-3xl font-bold text-blue-900">{totalItems}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Business Processes</p>
              <p className="text-3xl font-bold text-green-900">{processCount}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-600 mb-1">Categories</p>
              <p className="text-3xl font-bold text-purple-900">
                {new Set(importedItems.map(i => i.category)).size}
              </p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Status Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">{status}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Business Process Preview */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Business Process Preview</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(groupedByProcess).map(([process, items]) => (
                <div key={process} className="border-l-4 border-[#5B9BD5] pl-3 py-2 bg-gray-50">
                  <p className="font-semibold text-gray-900">{process}</p>
                  <p className="text-sm text-gray-600">
                    {items.length} requirement{items.length !== 1 ? 's' : ''} •
                    Categories: {new Set(items.map(i => i.category)).size}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Items */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Sample Requirements (first 5)</h3>
            <div className="space-y-2">
              {importedItems.slice(0, 5).map((item, index) => (
                <div key={index} className="text-sm bg-gray-50 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.requirement}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-600">
                        <span>🏢 {item.businessProcess}</span>
                        <span>📁 {item.category}</span>
                        <span className={`font-semibold ${
                          item.priority === 'High' ? 'text-red-600' :
                          item.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          🔔 {item.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {importedItems.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  ...and {importedItems.length - 5} more items
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              ✓ Confirm & Import
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
