'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { FiEdit, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { storage } from '@/lib/firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '@/context/authContext';
import {
  deleteAccidentReport,
  fetchAccidentById,
  fetchAccidentsReport,
  updateAccidentReport,
} from '@/features/Reports/services/reportService';
import ReportPagination from '@/features/Reports/components/Shared/ReportPagination';

const MapPopup = dynamic(() => import('@/components/mapPopUP'), { ssr: false });
const PAGE_SIZE = 10;

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
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  return String(value).slice(0, 16);
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
        if (!normalizedSearch) {
          return true;
        }

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
    setCurrentPage((prevPage) => Math.min(prevPage, totalPages));
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
    if (!canManageAccidents) {
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this accident record?');
    if (!confirmed) {
      return;
    }

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
    if (!canManageAccidents) {
      return;
    }

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
    if (!editData || !canManageAccidents) {
      return;
    }

    setSaving(true);

    try {
      const { id, type, severity, description, datetime, imageFile } = editData;
      let imageUrl = editData.imageUrl || '';

      if (imageFile) {
        const storageRef = ref(storage, `accidents/${id}-${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
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

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    if (!filteredAccidents.length) {
      return;
    }

    const headers = 'Type,Severity,Description,DateTime,Barangay';
    const rows = filteredAccidents.map((accident) =>
      [
        accident.type || '',
        accident.severity || '',
        `"${String(accident.description || '').replace(/"/g, '""')}"`,
        accident.datetime || '',
        accident.barangay || '',
      ].join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = 'accident-report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="p-4">
      <div className="text-sm text-left text-gray-500 mb-2 print:hidden">
        Home / Reports / Accidents
      </div>

      <div id="print-section">
        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-bold text-lg print:text-black print:bg-white print:text-center">
          {title}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-white shadow border-t-0 px-4 py-3 print:hidden">
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              id="search-input"
              name="search"
              type="text"
              placeholder="Search accidents"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Print
            </button>

            <button
              onClick={handleDownloadCSV}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[530px] overflow-y-auto shadow border-t-0 rounded-b-md bg-white p-4 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-10 w-10 text-green-500 mb-3"
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
                <p className="text-gray-600 text-sm">Loading accident records...</p>
              </div>
            </div>
          ) : accidents.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No accident records found.</p>
          ) : filteredAccidents.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No accident record results.</p>
          ) : (
            <>
              <table className="w-full text-sm text-center print:text-xs print:w-full print:border print:border-gray-400">
                <thead className="bg-gray-100 text-gray-600 print:bg-white print:text-black">
                  <tr>
                    <th className="px-4 py-2 border">No.</th>
                    <th className="px-4 py-2 border">Image</th>
                    <th className="px-4 py-2 border">Type</th>
                    <th className="px-4 py-2 border">Severity</th>
                    <th className="px-4 py-2 border">Description</th>
                    <th className="px-4 py-2 border">Barangay</th>
                    <th className="px-4 py-2 border">Date &amp; Time</th>
                    <th className="px-4 py-2 border print:hidden">Map</th>
                    {canManageAccidents && (
                      <th className="px-4 py-2 border print:hidden">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedAccidents.map((accident, index) => (
                    <tr key={accident.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-2 border">
                        {accident.imageUrl ? (
                          <Image
                            src={accident.imageUrl}
                            alt={accident.type || 'Accident'}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover mx-auto rounded"
                          />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </td>
                      <td className="px-4 py-2 border">{accident.type || '-'}</td>
                      <td className="px-4 py-2 border">{accident.severity || '-'}</td>
                      <td className="px-4 py-2 border">{accident.description || '-'}</td>
                      <td className="px-4 py-2 border">{accident.barangay || 'N/A'}</td>
                      <td className="px-4 py-2 border">
                        {accident.datetime ? new Date(accident.datetime).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-2 border print:hidden">
                        <button
                          onClick={() => openMapWithLocation(accident)}
                          className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700 cursor-pointer"
                        >
                          Map
                        </button>
                      </td>
                      {canManageAccidents && (
                        <td className="px-4 py-2 border space-x-2 print:hidden">
                          <button
                            onClick={() => handleEdit(accident.id)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="Edit"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(accident.id)}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-sm text-gray-700 mt-4 print:hidden">
                <strong>Total accident records:</strong>{' '}
                <span className="font-semibold">{filteredAccidents.length}</span>
              </p>

              <ReportPagination
                currentPage={currentPage}
                totalPages={totalPages}
                hasNextPage={currentPage < totalPages}
                hasPrevPage={currentPage > 1}
                onPrevious={() => setCurrentPage((prevPage) => Math.max(1, prevPage - 1))}
                onNext={() => setCurrentPage((prevPage) => Math.min(totalPages, prevPage + 1))}
              />
            </>
          )}
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
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => {
                setShowEditModal(false);
                setEditData(null);
              }}
            >
              <FiX />
            </button>

            <h2 className="text-lg font-bold mb-4">Edit Accident Info</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-center">
                  <strong>Accident Image</strong>
                </label>

                {editData.imageUrl && (
                  <div className="flex justify-center mb-2">
                    <Image
                      src={editData.imageUrl}
                      alt="Accident"
                      width={64}
                      height={64}
                      className="w-32 h-32 object-cover rounded border"
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
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium">
                  Type
                </label>
                <input
                  id="type"
                  name="type"
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editData.type || ''}
                  onChange={(event) =>
                    setEditData((prev) => ({ ...prev, type: event.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="severity" className="block text-sm font-medium">
                  Severity
                </label>
                <select
                  id="severity"
                  name="severity"
                  className="w-full border rounded px-3 py-2"
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
                <label htmlFor="description" className="block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full border rounded px-3 py-2"
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
                <label htmlFor="datetime" className="block text-sm font-medium">
                  Date &amp; Time
                </label>
                <input
                  id="datetime"
                  name="datetime"
                  type="datetime-local"
                  className="w-full border rounded px-3 py-2"
                  value={editData.datetime || ''}
                  onChange={(event) =>
                    setEditData((prev) => ({
                      ...prev,
                      datetime: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditData(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className={`px-4 py-2 text-white rounded flex items-center justify-center gap-2 transition ${
                    saving ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
