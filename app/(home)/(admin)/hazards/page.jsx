'use client';

import { useMemo, useState } from 'react';
import RoleGuard from '@/components/roleGuard';
import dynamic from 'next/dynamic';
import {
  FiAlertTriangle,
  FiEye,
  FiLayers,
  FiPlus,
  FiSearch,
  FiUploadCloud,
} from 'react-icons/fi';
import { useHazardViewModel } from '@/features/Hazard/hooks/useHazardViewModel';
import HazardTable from './components/HazardTable';
import HazardPreviewModal from './components/HazardPreviewModal';

const AddHazardModal = dynamic(() => import('./components/AddHazardModal'), {
  ssr: false,
});

function StatCard({ title, value, icon, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

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

  const filteredHazards = useMemo(() => {
    return hazards.filter((hazard) =>
      `${hazard.type || ''} ${hazard.description || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [hazards, searchTerm]);

  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin']}>
      <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
        {/* Page Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Home / Hazard Management</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-800">Hazard Layers</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Manage hazard layers used in map visualization, boundary analysis,
                and affected household identification across LUWAS.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                Admin Only
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Geospatial Layer Management
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Layers"
            value={hazards.length}
            icon={<FiLayers size={20} />}
            subtitle="Saved hazard overlays"
          />
          <StatCard
            title="Search Results"
            value={filteredHazards.length}
            icon={<FiSearch size={20} />}
            subtitle={searchTerm ? `Filtered by: ${searchTerm}` : 'All hazard layers'}
          />
          <StatCard
            title="Preview Status"
            value={isPreviewOpen ? 'Open' : 'Closed'}
            icon={<FiEye size={20} />}
            subtitle={
              selectedHazard?.type
                ? `Viewing: ${selectedHazard.type}`
                : 'No hazard preview selected'
            }
          />
          <StatCard
            title="Upload Status"
            value={loadingUpload ? 'Uploading...' : 'Ready'}
            icon={<FiUploadCloud size={20} />}
            subtitle={
              loadingUpload
                ? 'Saving new hazard layer'
                : 'Ready for new layer upload'
            }
          />
        </div>

        {/* Search and Actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by hazard type or description"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <ToolbarButton
              onClick={() => setIsModalOpen(true)}
              disabled={loading}
            >
              <FiPlus size={16} />
              Add Hazard Layer
            </ToolbarButton>
          </div>
        </div>

        {/* Hazard Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Hazard Layer Records
                </h2>
                <p className="text-sm text-slate-500">
                  Review available hazard layers, inspect their details, and manage
                  existing uploaded overlays.
                </p>
              </div>

              <div className="mt-2 md:mt-0">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {loading ? 'Loading layers...' : `${filteredHazards.length} visible layer(s)`}
                </span>
              </div>
            </div>
          </div>

          <HazardTable
            loading={loading}
            filteredHazards={filteredHazards}
            handlePreview={previewHazard}
            handleDeleteHazard={deleteHazard}
          />
        </div>

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

        <HazardPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          hazard={selectedHazard}
        />
      </div>
    </RoleGuard>
  );
}