'use client';

import { db } from '@/lib/firebaseConfig';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { capitalizeWords } from '@/utils/capitalize';

const MapPopup = dynamic(() => import('../../../../components/mapPopUP'), { ssr: false });

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
    const capitalizedValue = ['headFirstName', 'headMiddleName', 'headLastName', 'headSuffix', 'barangay', 'sitio'].includes(name)
      ? capitalizeWords(value)
      : value;
    setForm((prev) => ({ ...prev, [name]: capitalizedValue }));
  };

  const handleHomeChange = (index, key, value) => {
    setForm((prev) => {
      const homes = [...prev.homes];
      homes[index][key] = value;
      return { ...prev, homes };
    });
  };

  const handleRemoveHome = (index) => {
    setForm((prev) => ({
      ...prev,
      homes: prev.homes.filter((_, i) => i !== index).map((home, idx) => ({
        ...home,
        label: idx === 0 ? 'Primary Home' : `Secondary Home ${idx}`,
      })),
    }));
  };

  const handleSaveLocation = (position) => {
    if (mapOpenIndex === null) return;
    handleHomeChange(mapOpenIndex, 'latitude', position.lat.toFixed(6));
    handleHomeChange(mapOpenIndex, 'longitude', position.lng.toFixed(6));
    setMapOpenIndex(null);
  };

  useEffect(() => {
    const fetchHousehold = async () => {
      if (!open || !householdId) return;
      setLoading(true);
      try {
        const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
        const geoSnap = await getDoc(geoRef);
        if (!geoSnap.exists()) {
          toast.error('Household not found');
          onClose();
          return;
        }

        const geoData = geoSnap.data();
        const updatedForm = {
          barangay: geoData.barangay || '',
          sitio: geoData.sitio || '',
          homes: geoData.homes && geoData.homes.length
            ? geoData.homes
            : [{ label: 'Primary Home', latitude: '', longitude: '' }],
          headFirstName: geoData.headFirstName || '',
          headMiddleName: geoData.headMiddleName || '',
          headLastName: geoData.headLastName || '',
          headSuffix: geoData.headSuffix || '',
          headSex: geoData.headSex || '',
          headAge: geoData.headAge || '',
          contactNumber: geoData.contactNumber || '',
        };

        // Fetch members to overwrite head if exists
        const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));
        for (const memberDoc of membersSnap.docs) {
          const memberId = memberDoc.id;
          const demoRef = doc(db, 'households', householdId, 'members', memberId, 'demographicCharacteristics', 'main');
          const demoSnap = await getDoc(demoRef);
          const memberRef = doc(db, 'households', householdId, 'members', memberId);
          const memberSnap = await getDoc(memberRef);
          const baseData = memberSnap.exists() ? memberSnap.data() : {};

          if (demoSnap.exists()) {
            const demoData = demoSnap.data();
            const relationship = demoData.relationshipToHead || baseData.relationshipToHead || '';
            if (relationship.toLowerCase() === 'head') {
              Object.assign(updatedForm, {
                headFirstName: baseData.firstName || demoData.firstName || '',
                headMiddleName: baseData.middleName || demoData.middleName || '',
                headLastName: baseData.lastName || demoData.lastName || '',
                headSuffix: baseData.suffix || demoData.suffix || '',
                headSex: demoData.sex || '',
                headAge: demoData.age || '',
                contactNumber: demoData.contactNumber || '',
              });
              break;
            }
          }
        }

        setForm((prev) => ({ ...prev, ...updatedForm }));
      } catch (err) {
        console.error('Failed to fetch household data:', err);
        toast.error('Failed to fetch household data');
      } finally {
        setLoading(false);
      }
    };

    fetchHousehold();
  }, [open, householdId, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
      const { headFirstName, headMiddleName, headLastName, headSuffix, headSex, headAge, contactNumber, ...geoFields } = form;

      await updateDoc(geoRef, { ...geoFields, updatedAt: new Date() });

      // Update head member if exists
      const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));
      let headFound = false;

      for (const memberDoc of membersSnap.docs) {
        const memberId = memberDoc.id;
        const demoRef = doc(db, 'households', householdId, 'members', memberId, 'demographicCharacteristics', 'main');
        const demoSnap = await getDoc(demoRef);
        const relationship = demoSnap.exists() ? demoSnap.data().relationshipToHead || '' : '';
        if (relationship.toLowerCase() === 'head') {
          const headMemberRef = doc(db, 'households', householdId, 'members', memberId);
          await Promise.all([
            updateDoc(demoRef, { contactNumber, sex: headSex, age: headAge, updatedAt: new Date() }),
            updateDoc(headMemberRef, {
              firstName: capitalizeWords(headFirstName),
              middleName: capitalizeWords(headMiddleName),
              lastName: capitalizeWords(headLastName),
              suffix: capitalizeWords(headSuffix),
              updatedAt: new Date()
            }),
          ]);
          headFound = true;
          break;
        }
      }

      // If no members exist, save head info in geo doc
      if (!headFound) {
        await updateDoc(geoRef, {
          headFirstName: capitalizeWords(headFirstName),
          headMiddleName: capitalizeWords(headMiddleName),
          headLastName: capitalizeWords(headLastName),
          headSuffix: capitalizeWords(headSuffix),
          headSex,
          headAge,
          contactNumber,
          updatedAt: new Date()
        });
      }

      toast.success('Household updated successfully');
      onClose();
      if (typeof onUpdated === 'function') onUpdated(form);
    } catch (err) {
      console.error('Error updating household:', err);
      toast.error('Error updating household');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative shadow-lg overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold">&times;</button>

        <h2 className="text-xl font-bold mb-4">Edit Household</h2>

        {loading ? (
          <p className="text-center text-gray-500 animate-pulse">Loading data...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Household Head */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['headFirstName', 'First Name'],
                ['headMiddleName', 'Middle Name'],
                ['headLastName', 'Last Name'],
                ['headSuffix', 'Suffix'],
                ['barangay', 'Barangay'],
                ['sitio', 'Sitio'],
                ['headSex', 'Sex'],
                ['contactNumber', 'Contact Number'],
                ['headAge', 'Age'],
              ].map(([name, label]) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700">{label}</label>
                  <input
                    type={name === 'headAge' ? 'number' : 'text'}
                    value={form[name]}
                    name={name}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border rounded"
                    required={name !== 'headSuffix'}
                  />
                </div>
              ))}
            </div>

            {/* Multiple Homes */}
            <h3 className="text-lg font-semibold pt-4">Homes</h3>
            {form.homes.map((home, index) => (
              <div key={index} className="border p-4 rounded mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{home.label}</span>
                  {index > 0 && (
                    <button type="button" className="text-red-600" onClick={() => handleRemoveHome(index)}>Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Latitude</label>
                    <input type="text" value={home.latitude} readOnly className="mt-1 p-2 w-full border rounded bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Longitude</label>
                    <input type="text" value={home.longitude} readOnly className="mt-1 p-2 w-full border rounded bg-gray-100" />
                  </div>
                  <div className="sm:col-span-2">
                    <button type="button" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={() => setMapOpenIndex(index)}>Pick Location from Map</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Submit buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button type="submit" disabled={submitting} className={`px-4 py-2 rounded text-white ${submitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                {submitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        <MapPopup
          key={mapOpenIndex ?? 'map'}
          isOpen={mapOpenIndex !== null}
          onClose={() => setMapOpenIndex(null)}
          onSave={handleSaveLocation}
          location={
            mapOpenIndex !== null
              ? {
                  lat: parseFloat(form.homes[mapOpenIndex].latitude || 0),
                  lng: parseFloat(form.homes[mapOpenIndex].longitude || 0),
                }
              : null
          }
          readOnly={false}
          mode="household"
        />
      </div>
    </div>
  );
}