'use client';

import { useState } from 'react';
import RoleGuard from '@/components/roleGuard';
import dynamic from 'next/dynamic';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { useHazardViewModel } from '@/features/Hazard/hooks/useHazardViewModel';
import HazardTable from './components/HazardTable';
import HazardPreviewModal from './components/HazardPreviewModal';

const AddHazardModal = dynamic(() => import('./components/AddHazardModal'), { ssr: false });

export default function HazardsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hazardType, setHazardType] = useState('');
  const [description, setDescription] = useState('');
  const [geojsonFile, setGeojsonFile] = useState(null);
  const [legendProp, setLegendProp] = useState(null);
  const [colorSettings, setColorSettings] = useState({});

  const {
    hazards,
    loading,
    loadingUpload,
    selectedHazard,
    isPreviewOpen,
    setIsPreviewOpen,
    deleteHazard,
    previewHazard,
    uploadHazard,
  } = useHazardViewModel();

  const filteredHazards = hazards.filter((hazard) =>
    `${hazard.type || ''} ${hazard.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin']}>
      <div className="p-4">
        {/* Breadcrumb */}
        <div className="text-sm text-right text-gray-500 mb-2">Home / Hazard Management</div>

        {/* Header */}
        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg flex justify-between items-center">
          <span>Hazard Layers</span>
        </div>

        {/* Search & Add */}
        <div className="flex items-center justify-between bg-white shadow px-4 py-3">
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by type or description"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="ml-4">
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={loading}
              className="group relative flex items-center justify-center gap-2 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <FiPlus className="text-lg transform group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden md:inline">Add Hazard Layer</span>
              <span className="absolute top-full mt-2 px-2 py-1 rounded-md bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap md:hidden">
                Add Hazard Layer
              </span>
            </button>
          </div>
        </div>

        {/* Hazard Table */}
        <HazardTable
          loading={loading}
          filteredHazards={filteredHazards}
          handlePreview={previewHazard}
          handleDeleteHazard={deleteHazard}
        />

        {/* Add Hazard Modal */}
        <AddHazardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          hazardType={hazardType}
          setHazardType={setHazardType}
          description={description}
          setDescription={setDescription}
          geojsonFile={geojsonFile}
          setGeojsonFile={setGeojsonFile}
          legendProp={legendProp}
          setLegendProp={setLegendProp}
          colorSettings={colorSettings}
          setColorSettings={setColorSettings}
          handleUploadAndSave={(legend, colors) =>
            uploadHazard({
              hazardType,
              description,
              geojsonFile,
              legendProp: legend,
              colorSettings: colors,
              onClose: () => setIsModalOpen(false),
            })
          }
          loadingUpload={loadingUpload}
        />

        {/* Preview Hazard Modal */}
        <HazardPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          hazard={selectedHazard}
        />
      </div>
    </RoleGuard>
  );
}
