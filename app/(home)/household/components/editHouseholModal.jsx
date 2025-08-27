'use client';

import { db } from '@/firebase/config';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const MapPopup = dynamic(() => import('../../../../components/mapPopUP'), { ssr: false });

export default function EditHouseholdModal({ open, onClose, householdId, onUpdated }) {
  const [mapOpen, setMapOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    headFirstName: '',
    headMiddleName: '',
    headLastName: '',
    headSuffix: '',
    barangay: '',
    headSex: '',
    contactNumber: '',
    headAge: '',
    latitude: '',
    longitude: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
          latitude: geoData.latitude || '',
          longitude: geoData.longitude || '',

        };

        const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));

        const demographicPromises = membersSnap.docs.map(async (memberDoc) => {
          const memberId = memberDoc.id;
          const demoRef = doc(db, 'households', householdId, 'members', memberId, 'demographicCharacteristics', 'main');
          const demoSnap = await getDoc(demoRef);
          return { demoSnap, memberId };
        });

        const resolvedDemos = await Promise.all(demographicPromises);

        for (const { demoSnap, memberId } of resolvedDemos) {
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
      const {
        headFirstName,
        headMiddleName,
        headLastName,
        headSuffix,
        headSex,
        headAge,
        contactNumber,
        ...geoFields
      } = form;
  
      // Update geographic info
      await updateDoc(geoRef, {
        ...geoFields,
        updatedAt: new Date(),
      });
  
      // Find the head member
      const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));
      let headMemberId = null;
  
      for (const memberDoc of membersSnap.docs) {
        const memberId = memberDoc.id;
        const demoRef = doc(db, 'households', householdId, 'members', memberId, 'demographicCharacteristics', 'main');
        const demoSnap = await getDoc(demoRef);
        const relationship = demoSnap.exists() ? demoSnap.data().relationshipToHead || '' : '';
        if (relationship.toLowerCase() === 'head') {
          headMemberId = memberId;
          const headDemoRef = demoRef;
          const headMemberRef = doc(db, 'households', householdId, 'members', memberId);
  
          await Promise.all([
            updateDoc(headDemoRef, {
              contactNumber: contactNumber || '',
              sex: headSex || '',
              age: headAge || '',
              updatedAt: new Date(),
            }),
            updateDoc(headMemberRef, {
              firstName: headFirstName || '',
              middleName: headMiddleName || '',
              lastName: headLastName || '',
              suffix: headSuffix || '',
              updatedAt: new Date(),
            }),
          ]);
          break;
        }
      }
  
      toast.success('Household updated successfully');
      onClose();
  
      // Pass updated household to parent for immediate table refresh
      const updatedHousehold = {
        householdId,
        headFirstName,
        headMiddleName,
        headLastName,
        headSuffix,
        headSex,
        headAge,
        contactNumber,
        barangay: geoFields.barangay || '',
        latitude: geoFields.latitude || '',
        longitude: geoFields.longitude || '',
      };
  
      if (typeof onUpdated === 'function') onUpdated(updatedHousehold);
  
    } catch (err) {
      console.error('Error updating household:', err);
      toast.error('Error updating household');
    } finally {
      setSubmitting(false);
    }
  };
  

  const handleSaveLocation = (position) => {
    setForm((prev) => ({
      ...prev,
      latitude: position.lat.toFixed(6),
      longitude: position.lng.toFixed(6),
    }));
    setMapOpen(false);
  };

  if (!open) return null;



  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4">Edit Household</h2>

        {loading ? (
          <p className="text-center text-gray-500 mb-4 animate-pulse">Loading data...</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 bg-white p-2">
            {[
              ['headFirstName', 'First Name'],
              ['headMiddleName', 'Middle Name'],
              ['headLastName', 'Last Name'],
              ['headSuffix', 'Suffix'],
              ['barangay', 'Barangay'],
              ['headSex', 'Sex'],
              ['contactNumber', 'Contact Number'],
              ['headAge', 'Age'],
            ].map(([name, label]) => (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <input
                  id={name}
                  type={name === 'headAge' ? 'number' : 'text'}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded"
                  required={name !== 'headSuffix'}
                />
              </div>
            ))}

            <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  id="latitude"
                  type="text"
                  name="latitude"
                  value={form.latitude}
                  readOnly
                  className="mt-1 p-2 w-full bg-gray-100 border rounded"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  id="longitude"
                  type="text"
                  name="longitude"
                  value={form.longitude}
                  readOnly
                  className="mt-1 p-2 w-full bg-gray-100 border rounded"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Pick Location from Map
                </button>
              </div>
            </div>

            <div className="col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-[200px] px-4 py-2 bg-gray-300 text-black font-medium rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={`w-[200px] px-4 py-2 text-white font-medium rounded transition flex justify-center items-center gap-2 ${
                  submitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {submitting ? (
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
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        )}

        <MapPopup
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
          onSave={handleSaveLocation}
          location={
            form.latitude && form.longitude
              ? { lat: parseFloat(form.latitude), lng: parseFloat(form.longitude) }
              : null
          }
          readOnly={false}
          mode="household"
        />
      </div>
    </div>
  );
}
