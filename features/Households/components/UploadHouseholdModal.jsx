'use client';

import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import UploadProgressBar from './UploadProgressBar';
import { useHouseholdUpload } from '../hooks/useHouseholdUpload';

export default function UploadHouseholdsModal({
  isOpen,
  onClose,
  onUploadSuccess = null,
}) {
  const [file, setFile] = useState(null);
  const upload = useHouseholdUpload();

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      // Only reset if not uploading
      if (!upload.isUploading) {
        upload.resetProgress();
      }
    }
  }, [isOpen, upload]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    await upload.handleUpload(file, (count) => {
      // Callback on success
      if (onUploadSuccess) {
        onUploadSuccess(count);
      }
      // Close modal after brief delay to show completion
      setTimeout(() => {
        onClose();
        setFile(null);
      }, 1500);
    });
  };

  const handleClose = () => {
    // Don't close if uploading
    if (!upload.isUploading) {
      onClose();
      setFile(null);
      upload.resetProgress();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Upload Household Data</h2>
          <button
            onClick={handleClose}
            disabled={upload.isUploading}
            className="p-1 hover:bg-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Close"
          >
            <FiX className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Instructions */}
          {!upload.isUploading && !upload.isComplete && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Select a <strong>CSV, Excel, or JSON file</strong> containing household and member data.
              </p>

              {/* File requirements info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">File Requirements:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Two sheets/tabs: "Households" and "Members"</li>
                  <li>• Required columns: Household ID, Member ID, Head names</li>
                  <li>• Optional: Geographic coordinates (latitude/longitude)</li>
                </ul>
              </div>

              {/* File input */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:bg-green-50 transition-colors cursor-pointer"
                  disabled={upload.isUploading}
                />
                {file && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: <span className="font-semibold text-gray-800">{file.name}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Progress display */}
          {(upload.isUploading || upload.isComplete || upload.error) && (
            <div className="space-y-4">
              <UploadProgressBar
                percentage={upload.percentage}
                stageName={upload.stageName}
                message={upload.message}
                currentBatch={upload.currentBatch}
                totalBatches={upload.totalBatches}
                isError={!!upload.error}
              />

              {/* Error details */}
              {upload.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {upload.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Success message */}
          {upload.isComplete && !upload.error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>✓ Success!</strong> {upload.message}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            type="button"
            onClick={handleClose}
            disabled={upload.isUploading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {upload.isComplete ? 'Close' : 'Cancel'}
          </button>

          {!upload.isComplete && !upload.error && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || upload.isUploading}
              className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {upload.isUploading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </button>
          )}

          {upload.error && (
            <button
              type="button"
              onClick={() => {
                upload.resetProgress();
                setFile(null);
              }}
              className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}