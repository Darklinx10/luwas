'use client';

import React from 'react';
import { FiUploadCloud } from 'react-icons/fi';

const GeojsonUploadModal = ({
  isOpen,
  isMDRRMCAdmin,
  geojsonFile,
  setGeojsonFile,
  setIsUploadModalOpen,
  handleFileUpload,
  loading,
}) => {
  if (!isOpen || !isMDRRMCAdmin) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md relative">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Upload GeoJSON Boundary
        </h2>

        {/* Upload Area */}
        <label
          htmlFor="geojsonUpload"
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
        >
          <FiUploadCloud className="text-5xl text-green-500 mb-3" />
          <p className="text-gray-700 font-medium">
            {geojsonFile ? geojsonFile.name : 'Click to upload GeoJSON file'}
          </p>
          <input
            id="geojsonUpload"
            type="file"
            accept=".geojson,application/geo+json"
            onChange={(e) => setGeojsonFile(e.target.files[0])}
            className="hidden"
          />
        </label>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow"
            onClick={() => setIsUploadModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={handleFileUpload}
          >
            Save
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-2xl z-50">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeojsonUploadModal;
