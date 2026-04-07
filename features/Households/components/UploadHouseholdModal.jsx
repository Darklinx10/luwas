'use client';

import { useEffect, useState } from 'react';
import { FiFileText, FiUploadCloud, FiX } from 'react-icons/fi';
import UploadProgressBar from './UploadProgressBar';
import { useHouseholdUpload } from '../hooks/useHouseholdUpload';

export default function UploadHouseholdsModal({
  isOpen,
  onClose,
  onUploadSuccess = null,
}) {
  const [file, setFile] = useState(null);
  const upload = useHouseholdUpload();

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
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
      if (onUploadSuccess) {
        onUploadSuccess(count);
      }

      setTimeout(() => {
        onClose();
        setFile(null);
      }, 1500);
    });
  };

  const handleClose = () => {
    if (!upload.isUploading) {
      onClose();
      setFile(null);
      upload.resetProgress();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Upload Household Data</h2>
            <p className="mt-1 text-sm text-slate-500">
              Import households and members from a supported file.
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={upload.isUploading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Close"
            type="button"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {!upload.isUploading && !upload.isComplete && !upload.error && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  Select a <strong>CSV, Excel, or JSON file</strong> containing
                  household and member data.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="mb-2 text-sm font-semibold text-blue-900">
                  File Requirements
                </p>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Two sheets/tabs: “Households” and “Members”</li>
                  <li>• Required columns: Household ID, Member ID, Head names</li>
                  <li>• Optional: Geographic coordinates (latitude/longitude)</li>
                </ul>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Select File
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:border-emerald-500 hover:bg-emerald-50">
                  <FiUploadCloud className="mb-3 h-8 w-8 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {file ? file.name : 'Click to choose a file'}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Accepted: .xlsx, .xls, .csv, .json
                  </span>

                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.json"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={upload.isUploading}
                  />
                </label>

                {file && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <FiFileText className="text-slate-500" />
                    <p className="text-sm text-slate-700">
                      Selected: <span className="font-medium">{file.name}</span>
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {(upload.isUploading || upload.isComplete || upload.error) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <UploadProgressBar
                percentage={upload.percentage}
                stageName={upload.stageName}
                message={upload.message}
                currentBatch={upload.currentBatch}
                totalBatches={upload.totalBatches}
                isError={!!upload.error}
              />
            </div>
          )}

          {upload.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {upload.error}
              </p>
            </div>
          )}

          {upload.isComplete && !upload.error && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-800">
                <strong>Success:</strong> {upload.message}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={upload.isUploading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {upload.isComplete ? 'Close' : 'Cancel'}
          </button>

          {!upload.isComplete && !upload.error && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || upload.isUploading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {upload.isUploading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}