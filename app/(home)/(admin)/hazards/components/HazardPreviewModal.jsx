'use client';

import dynamic from 'next/dynamic';

const HazardMapPreview = dynamic(
  () => import('./hazardMapPreview'),
  { ssr: false } // important: disable server-side rendering
);

export default function HazardPreviewModal({ isOpen, onClose, hazard }) {
  if (!isOpen || !hazard) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-4xl p-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-bold">Preview Hazard Layer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Map Preview */}
        <div className="h-[500px] w-full">
          <HazardMapPreview geojson={hazard.geojson} />
        </div>
      </div>
    </div>
  );
}
