'use client';

import { db } from '@/lib/firebaseConfig';
import { capitalizeWords } from '@/utils/capitalize';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const MapPopup = dynamic(() => import('@/components/mapPopUP'), { ssr: false });

export default function EditHouseholdModal({ open, onClose, householdId, onUpdated }) {
  const [mapOpenIndex, setMapOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    headFirstName: '',
    headMiddleName: '',
    headLastName: '',
    headSuffix: '',
    barangay: '',
    sitio: '',
    headSex: '',
    contactNumber: '',
    headAge: '',
    homes: [{ label: 'Primary Home', latitude: '', longitude: '' }],
  });

  // Capitalize relevant fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    const fieldsToCapitalize = ['headFirstName', 'headLastName', 'barangay', 'sitio'];

    setForm((prev) => ({
      ...prev,
      [name]: fieldsToCapitalize.includes(name) ? capitalizeWords(value) : value,
    }));
  };

  const handleHomeChange = (index, field, value) => {
    const updatedHomes = [...form.homes];
    updatedHomes[index] = { ...updatedHomes[index], [field]: value };
    setForm((prev) => ({ ...prev, homes: updatedHomes }));
  };

  useEffect(() => {
    if (!open || !householdId) return;

    const fetchHousehold = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'households', householdId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            headFirstName: data.headFirstName || '',
            headMiddleName: data.headMiddleName || '',
            headLastName: data.headLastName || '',
            headSuffix: data.headSuffix || '',
            barangay: data.barangay || '',
            sitio: data.sitio || '',
            headSex: data.headSex || '',
            contactNumber: data.contactNumber || '',
            headAge: data.headAge || '',
            homes: data.homes || [{ label: 'Primary Home', latitude: '', longitude: '' }],
          });
        }
      } catch (error) {
        console.error('Error fetching household:', error);
        toast.error('Failed to load household data');
      } finally {
        setLoading(false);
      }
    };

    fetchHousehold();
  }, [open, householdId]);

  const handleSave = async () => {
    if (!householdId) return;

    try {
      setSubmitting(true);

      const docRef = doc(db, 'households', householdId);
      await updateDoc(docRef, {
        headFirstName: form.headFirstName,
        headMiddleName: form.headMiddleName,
        headLastName: form.headLastName,
        headSuffix: form.headSuffix,
        barangay: form.barangay,
        sitio: form.sitio,
        headSex: form.headSex,
        contactNumber: form.contactNumber,
        headAge: form.headAge,
        homes: form.homes.filter((h) => h.latitude && h.longitude),
        updatedAt: new Date(),
      });

      toast.success('Household updated successfully');
      if (onUpdated) onUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating household:', error);
      toast.error('Failed to update household');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-green-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Household</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-white hover:bg-green-700 p-1 rounded disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Loading household data...</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Head Information Section */}
            <div className="border-b pb-4">
              <h3 className="font-bold text-gray-800 mb-3">Household Head</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="headFirstName"
                  placeholder="First Name"
                  value={form.headFirstName}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  name="headMiddleName"
                  placeholder="Middle Name"
                  value={form.headMiddleName}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  name="headLastName"
                  placeholder="Last Name"
                  value={form.headLastName}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  name="headSuffix"
                  placeholder="Suffix (Jr., Sr., etc.)"
                  value={form.headSuffix}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  name="headSex"
                  value={form.headSex}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input
                  name="headAge"
                  type="number"
                  placeholder="Age"
                  value={form.headAge}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="border-b pb-4">
              <h3 className="font-bold text-gray-800 mb-3">Location</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="barangay"
                  placeholder="Barangay"
                  value={form.barangay}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  name="sitio"
                  placeholder="Sitio"
                  value={form.sitio}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  name="contactNumber"
                  placeholder="Contact Number"
                  value={form.contactNumber}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 col-span-2"
                />
              </div>
            </div>

            {/* Homes Section */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Homes</h3>
              <div className="space-y-3">
                {form.homes.map((home, index) => (
                  <div key={index} className="border rounded p-3 bg-gray-50">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <input
                        placeholder="Label (e.g., Primary Home)"
                        value={home.label}
                        onChange={(e) => handleHomeChange(index, 'label', e.target.value)}
                        className="border rounded px-3 py-2 col-span-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="number"
                        placeholder="Latitude"
                        value={home.latitude}
                        onChange={(e) => handleHomeChange(index, 'latitude', e.target.value)}
                        step="0.0001"
                        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="number"
                        placeholder="Longitude"
                        value={home.longitude}
                        onChange={(e) => handleHomeChange(index, 'longitude', e.target.value)}
                        step="0.0001"
                        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => {
                          if (home.latitude && home.longitude) {
                            setMapOpenIndex(index);
                          } else {
                            toast.warn('Please enter coordinates first');
                          }
                        }}
                        className="bg-blue-500 text-white rounded px-2 py-2 text-sm hover:bg-blue-600"
                      >
                        View Map
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Popup */}
            {mapOpenIndex !== null && form.homes[mapOpenIndex] && (
              <MapPopup
                isOpen={mapOpenIndex !== null}
                onClose={() => setMapOpenIndex(null)}
                location={{
                  lat: parseFloat(form.homes[mapOpenIndex].latitude),
                  lng: parseFloat(form.homes[mapOpenIndex].longitude),
                }}
                readOnly={true}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 p-4 flex justify-end gap-2 border-t">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
