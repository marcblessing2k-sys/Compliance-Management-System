import { useState } from 'react';
import { X, Download, Upload, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { downloadEmployeeTemplate } from '../utils/employeeTemplate';
import { toast } from 'sonner';

interface ImportEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

export function ImportEmployeeModal({ isOpen, onClose, onFileSelect }: ImportEmployeeModalProps) {
  const [templateDownloaded, setTemplateDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setTemplateDownloaded(false);
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadEmployeeTemplate();
    setTemplateDownloaded(true);
    toast.success('Template downloaded! Please fill it out and upload below.');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#5B9BD5] to-[#4682B4] border-b p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Import Employees</h2>
            <p className="text-xs text-blue-100 mt-1">Download template, fill it out, and upload</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Step 1: Download Template */}
          <div className={`border-2 rounded-lg p-4 transition-all ${
            templateDownloaded ? 'border-green-400 bg-green-50' : 'border-[#5B9BD5] bg-blue-50'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                templateDownloaded ? 'bg-green-500 text-white' : 'bg-[#5B9BD5] text-white'
              }`}>
                {templateDownloaded ? <CheckCircle size={18} /> : '1'}
              </div>
              <h3 className="text-lg font-bold">Download Template</h3>
            </div>

            <p className="text-sm text-gray-600 mb-3 ml-11">
              Includes: Name, Role, Department, Review Month, Review Year, Reviewer
            </p>

            <button
              onClick={handleDownloadTemplate}
              className="ml-11 bg-[#FFE54D] hover:bg-[#FFD700] text-gray-900 px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Download size={18} />
              {templateDownloaded ? 'Download Again' : 'Download Template'}
            </button>

            {templateDownloaded && (
              <div className="mt-3 ml-11 flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle size={16} />
                <span className="font-semibold">Downloaded! Now fill it out and upload below.</span>
              </div>
            )}
          </div>

          {/* Step 2: Upload */}
          <div className={`border-2 rounded-lg p-4 transition-all ${
            templateDownloaded ? 'border-[#5B9BD5] bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5B9BD5] text-white flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-lg font-bold">Upload Completed File</h3>
            </div>

            <p className="text-sm text-gray-600 mb-3 ml-11">
              Fill out the template and upload it here
            </p>

            <div className="ml-11">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={!templateDownloaded}
                className="hidden"
                id="upload-employee-file"
              />
              <label
                htmlFor="upload-employee-file"
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  templateDownloaded
                    ? 'bg-[#5B9BD5] hover:bg-[#4682B4] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Upload size={18} />
                Upload File
              </label>

              {!templateDownloaded && (
                <p className="text-xs text-gray-500 mt-2">
                  Download the template first
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="bg-gray-200 hover:bg-gray-300 px-5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
