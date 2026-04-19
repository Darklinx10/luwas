'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  FiDownload,
  FiEdit,
  FiMapPin,
  FiPrinter,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';
import { downloadCsvFile, printTable } from '@/lib/utils/clientExport';
import {
  deleteAccidentReport,
  fetchAccidentById,
  fetchAccidentsReport,
  updateAccidentReport,
} from '@/features/Reports/services/reportService';
import ReportPagination from '@/features/Reports/components/Shared/ReportPagination';

const MapPopup = dynamic(() => import('@/components/mapPopUP'), { ssr: false });
const PAGE_SIZE = 10;
const ACCIDENT_EXPORT_HEADERS = [
  'No.',
  'Type',
  'Severity',
  'Description',
  'Barangay',
  'Date & Time',
];

function getAccidentPosition(accident = {}) {
  if (accident?.position?.lat !== undefined && accident?.position?.lng !== undefined) {
    return {
      lat: Number(accident.position.lat),
      lng: Number(accident.position.lng),
    };
  }

  return {
    lat: Number(accident.lat),
    lng: Number(accident.lng),
  };
}

function normalizeDateTimeLocal(value) {
  if (!value) return '';

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  return String(value).slice(0, 16);
}

function formatAccidentDateTime(value) {
  return value ? new Date(value).toLocaleString() : 'N/A';
}

function buildAccidentExportRows(accidents = []) {
  return accidents.map((accident, index) => [
    index + 1,
    accident.type || 'N/A',
    accident.severity || 'N/A',
    accident.description || 'N/A',
    accident.barangay || 'N/A',
    formatAccidentDateTime(accident.datetime),
  ]);
}

export default function AccidentTable({ title = 'Accident Reports' }) {
  const { role } = useAuth();
  const canManageAccidents = ['MDRRMC-Personnel', 'MDRRMC-Admin'].includes(role);

  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const fetchAccidents = async () => {
      setLoading(true);

      try {
        const data = await fetchAccidentsReport();
        setAccidents(data.accidents || []);
      } catch (error) {
        console.error('Error fetching accident data:', error);
        toast.error(error.message || 'Failed to load accident records.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccidents();
  }, []);

  const filteredAccidents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...accidents]
      .filter((item) => {
        if (!normalizedSearch) return true;

        const haystack = [
          item.type,
          item.severity,
          item.description,
          item.datetime,
          item.barangay,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => new Date(b.datetime || 0) - new Date(a.datetime || 0));
  }, [accidents, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredAccidents.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedAccidents = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredAccidents.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredAccidents]);

  const openMapWithLocation = (accident) => {
    const position = getAccidentPosition(accident);

    if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) {
      toast.warn('No location data available for this accident.');
      return;
    }

    setSelectedLocation(position);
    setMapOpen(true);
  };

  const handleDelete = async (id) => {
    if (!canManageAccidents) return;

    const confirmed = window.confirm('Are you sure you want to delete this accident record?');
    if (!confirmed) return;

    try {
      await deleteAccidentReport(id);
      setAccidents((prev) => prev.filter((accident) => accident.id !== id));
      toast.success('Accident record deleted.');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to delete record.');
    }
  };

  const handleEdit = async (id) => {
    if (!canManageAccidents) return;

    try {
      const data = await fetchAccidentById(id);
      setEditData({
        ...data.accident,
        datetime: normalizeDateTimeLocal(data.accident?.datetime),
        imageFile: null,
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching accident:', error);
      toast.error(error.message || 'Failed to load accident record.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editData || !canManageAccidents) return;

    setSaving(true);

    try {
      const { id, type, severity, description, datetime, imageFile } = editData;
      let imageUrl = editData.imageUrl || '';

      if (imageFile) {
        toast.info('New accident image upload is not available yet. The current saved image will be kept.');
      }

      const result = await updateAccidentReport(id, {
        type,
        severity,
        description,
        datetime,
        imageUrl,
      });

      setAccidents((prev) =>
        prev.map((accident) =>
          accident.id === id
            ? { ...accident, ...(result.accident || {}), type, severity, description, datetime, imageUrl }
            : accident
        )
      );

      setShowEditModal(false);
      setEditData(null);
      toast.success('Accident updated.');
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!filteredAccidents.length) {
      toast.info('No accident records available to print.');
      return;
    }

    printTable({
      title,
      subtitle: searchTerm
        ? `Filtered by search: ${searchTerm.trim()}`
        : 'All matching accident records',
      headers: ACCIDENT_EXPORT_HEADERS,
      rows: buildAccidentExportRows(filteredAccidents),
      summaryLines: [`Total accident records: ${filteredAccidents.length}`],
    });
  };

  const handleDownloadCSV = () => {
    if (!filteredAccidents.length) return;

    downloadCsvFile({
      filename: 'accident-report.csv',
      headers: ACCIDENT_EXPORT_HEADERS.slice(1),
      rows: filteredAccidents.map((accident) => [
        accident.type || '',
        accident.severity || '',
        accident.description || '',
        accident.datetime || '',
        accident.barangay || '',
      ]),
    });
  };

  return (
    <div className="space-y-4">
      <div id="print-section" className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{title}</h3>
              <p className="mt-2 text-sm text-slate-500">
                Review and manage all reported accident records.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100">
                Incident Records
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Total: {filteredAccidents.length}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-sm">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-input"
                name="search"
                type="text"
                placeholder="Search type, severity, description, barangay..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrint}
                disabled={loading || filteredAccidents.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiPrinter size={16} />
                Print All
              </button>

              <button
                onClick={handleDownloadCSV}
                disabled={loading || filteredAccidents.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiDownload size={16} />
                Download CSV
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center px-6 py-14">
                <div className="flex flex-col items-center">
                  <svg
                    className="mb-3 h-10 w-10 animate-spin text-emerald-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  <p className="text-sm text-slate-500">Loading accident records...</p>
                </div>
              </div>
            ) : accidents.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm text-slate-500">No accident records found.</p>
              </div>
            ) : filteredAccidents.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm text-slate-500">No matching accident records found.</p>
              </div>
            ) : (
              <>
                <table className="min-w-full text-left text-sm print:text-xs">
                  <thead className="bg-slate-50">
                    <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">No.</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Image</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Type</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Severity</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Description</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Barangay</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Date & Time</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold print:hidden">Map</th>
                      {canManageAccidents && (
                        <th className="border-b border-slate-200 px-4 py-3 font-semibold print:hidden">Action</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedAccidents.map((accident, index) => (
                      <tr key={accident.id} className="transition hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4">
                          {accident.imageUrl ? (
                            <Image
                              src={accident.imageUrl}
                              alt={accident.type || 'Accident'}
                              width={64}
                              height={64}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="text-slate-400">No Image</span>
                          )}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4 font-medium text-slate-800">
                          {accident.type || '-'}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                          {accident.severity || '-'}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                          {accident.description || '-'}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                          {accident.barangay || 'N/A'}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                          {accident.datetime ? new Date(accident.datetime).toLocaleString() : '-'}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4 print:hidden">
                          <button
                            onClick={() => openMapWithLocation(accident)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <FiMapPin size={14} />
                            Map
                          </button>
                        </td>

                        {canManageAccidents && (
                          <td className="border-b border-slate-200 px-4 py-4 print:hidden">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(accident.id)}
                                className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
                                title="Edit"
                              >
                                <FiEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(accident.id)}
                                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100"
                                title="Delete"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="px-4 py-4 print:hidden">
                  <p className="text-sm text-slate-500">
                    Total accident records:{' '}
                    <span className="font-semibold text-slate-700">{filteredAccidents.length}</span>
                  </p>
                </div>

                <div className="px-4 pb-4 print:hidden">
                  <ReportPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    hasNextPage={currentPage < totalPages}
                    hasPrevPage={currentPage > 1}
                    onPrevious={() => setCurrentPage((prevPage) => Math.max(1, prevPage - 1))}
                    onNext={() => setCurrentPage((prevPage) => Math.min(totalPages, prevPage + 1))}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <MapPopup
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        location={selectedLocation}
        readOnly={true}
        mode="accident"
      />

      {showEditModal && editData && canManageAccidents && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <button
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={() => {
                setShowEditModal(false);
                setEditData(null);
              }}
            >
              <FiX />
            </button>

            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-bold text-slate-800">Edit Accident Info</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update accident record details and attached image.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label htmlFor="image" className="mb-2 block text-sm font-medium text-slate-700">
                  Accident Image
                </label>

                {editData.imageUrl && (
                  <div className="mb-3 flex justify-center">
                    <Image
                      src={editData.imageUrl}
                      alt="Accident"
                      width={128}
                      height={128}
                      className="h-32 w-32 rounded-lg border border-slate-200 object-cover"
                    />
                  </div>
                )}

                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setEditData((prev) => ({
                      ...prev,
                      imageFile: event.target.files?.[0] || null,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                />
                <p className="mt-2 text-xs text-slate-500">
                  New image upload is temporarily unavailable. Existing saved images are preserved.
                </p>
              </div>

              <div>
                <label htmlFor="type" className="mb-2 block text-sm font-medium text-slate-700">
                  Type
                </label>
                <input
                  id="type"
                  type="text"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={editData.type || ''}
                  onChange={(event) =>
                    setEditData((prev) => ({ ...prev, type: event.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="severity" className="mb-2 block text-sm font-medium text-slate-700">
                  Severity
                </label>
                <select
                  id="severity"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={editData.severity || ''}
                  onChange={(event) =>
                    setEditData((prev) => ({ ...prev, severity: event.target.value }))
                  }
                >
                  <option value="">Select severity</option>
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  rows={3}
                  value={editData.description || ''}
                  onChange={(event) =>
                    setEditData((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label htmlFor="datetime" className="mb-2 block text-sm font-medium text-slate-700">
                  Date & Time
                </label>
                <input
                  id="datetime"
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={editData.datetime || ''}
                  onChange={(event) =>
                    setEditData((prev) => ({
                      ...prev,
                      datetime: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditData(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition ${saving
                    ? 'cursor-not-allowed bg-emerald-400'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
