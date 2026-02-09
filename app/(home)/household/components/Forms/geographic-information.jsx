'use client';

import RequiredField from '@/components/Required';
import { db } from '@/lib/firebaseConfig';
import geoData from '@/utils/geoData-ph.json';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'react-toastify';

const MapPopup = dynamic(() => import('@/components/mapPopUP'), { ssr: false });

export default function GeographicIdentification({ householdId, goToNext }) {
  const [mapOpen, setMapOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState({});
  const [currentHomeIndex, setCurrentHomeIndex] = useState(0);

  const [form, setForm] = useState({
    region: '',
    province: '',
    city: '',
    barangay: '',
    sitio: '',
    eaNumber: '',
    buildingSerial: '',
    housingUnitSerial: '',
    householdSerial: '',
    respondentLineNo: '',
    contactNumber: '',
    email: '',
    headLastName: '',
    headFirstName: '',
    headSuffix: '',
    headMiddleName: '',
    headAge: '',
    headSex: '',
    floorNo: '',
    houseNo: '',
    blockLotNo: '',
    streetName: '',
    subdivision: '',
    homes: [
      { label: 'Primary Home', latitude: '', longitude: '' },
    ],
  });

  // Cascading dropdown handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['region', 'province', 'city'].includes(name)) {
      if (name === 'region') setForm(prev => ({ ...prev, region: value, province: '', city: '', barangay: '' }));
      if (name === 'province') setForm(prev => ({ ...prev, province: value, city: '', barangay: '' }));
      if (name === 'city') setForm(prev => ({ ...prev, city: value, barangay: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Homes handlers
  const handleHomeChange = (key, value, index) => {
    setForm(prev => {
      const newHomes = [...prev.homes];
      newHomes[index][key] = value;
      return { ...prev, homes: newHomes };
    });
  };

  const handleAddHome = () => {
    setForm(prev => {
      const newHomes = [...prev.homes, { label: '', latitude: '', longitude: '' }];
      return {
        ...prev,
        homes: newHomes.map((home, index) => ({
          ...home,
          label: index === 0 ? 'Primary Home' : `Secondary Home ${index}`,
        })),
      };
    });
  };

  const handleRemoveHome = (index) => {
    setForm(prev => {
      const newHomes = prev.homes.filter((_, i) => i !== index);
      return {
        ...prev,
        homes: newHomes.map((home, idx) => ({
          ...home,
          label: idx === 0 ? 'Primary Home' : `Secondary Home ${idx}`,
        })),
      };
    });
  };

  const handleSaveLocation = (location) => {
    handleHomeChange('latitude', location.lat.toFixed(6), currentHomeIndex);
    handleHomeChange('longitude', location.lng.toFixed(6), currentHomeIndex);
    setMapOpen(false);
  };

  // Validation
  const validateForm = () => {
    const requiredFields = [
      'region', 'province', 'city', 'barangay', 'sitio', 'eaNumber', 'buildingSerial',
      'housingUnitSerial', 'householdSerial', 'respondentLineNo', 'contactNumber', 'email',
      'headLastName', 'headFirstName', 'headSex', 'headAge'
    ];
    const errors = {};

    requiredFields.forEach(field => {
      if (!form[field]?.toString().trim()) errors[field] = true;
    });

    form.homes.forEach((home, index) => {
      if (!home.latitude || !home.longitude) errors[`home-${index}`] = true;
    });

    setShowErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return toast.error('Please fill out all required fields.');

    setIsSaving(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return toast.error('User not authenticated.');

      const ref = doc(db, 'households', householdId, 'geographicIdentification', 'main');
      await setDoc(ref, { ...form, uid: user.uid }, { merge: true });

      toast.success('Geographic information saved!');
      goToNext();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false);
    }
  };

  // Dropdown options
  const selectedRegion = geoData.regions.find(r => r.name === form.region);
  const provinceOptions = selectedRegion?.provinces || [];
  const selectedProvince = provinceOptions.find(p => p.name === form.province);
  let cityOptions = selectedProvince?.cities?.length ? selectedProvince.cities : selectedRegion?.cities || [];
  const selectedCity = cityOptions.find(c => c.name === form.city);
  const barangayOptions = selectedCity?.barangays || [];

  return (
    <form onSubmit={handleSubmit} className="pr-2 space-y-6">

      {/* Location Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RequiredField htmlFor="region" label="Region" required showError={showErrors.region}>
          <select id="region" name="region" value={form.region} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="">Select Region</option>
            {geoData.regions.map(region => <option key={region.name} value={region.name}>{region.name}</option>)}
          </select>
        </RequiredField>

        <RequiredField htmlFor="province" label="Province" required showError={showErrors.province}>
          <select id="province" name="province" value={form.province} onChange={handleChange} className="border p-2 rounded w-full" disabled={!selectedRegion}>
            <option value="">Select Province</option>
            {provinceOptions.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </RequiredField>

        <RequiredField htmlFor="city" label="Municipality / City" required showError={showErrors.city}>
          <select id="city" name="city" value={form.city} onChange={handleChange} className="border p-2 rounded w-full" disabled={!selectedRegion}>
            <option value="">Select City / Municipality</option>
            {cityOptions.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </RequiredField>

        <RequiredField htmlFor="barangay" label="Barangay" required showError={showErrors.barangay}>
          <select id="barangay" name="barangay" value={form.barangay} onChange={handleChange} className="border p-2 rounded w-full" disabled={!selectedCity}>
            <option value="">Select Barangay</option>
            {barangayOptions.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        </RequiredField>

        <RequiredField htmlFor="sitio" label="Sitio / Purok" required showError={showErrors.sitio}>
          <input id="sitio" name="sitio" type="text" value={form.sitio} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Sitio / Purok" />
        </RequiredField>

        <RequiredField htmlFor="eaNumber" label="Enumeration Area Number" required showError={showErrors.eaNumber}>
          <input id="eaNumber" name="eaNumber" type="text" value={form.eaNumber} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Enumeration Area Number" />
        </RequiredField>

        <RequiredField htmlFor="buildingSerial" label="Building Serial Number" required showError={showErrors.buildingSerial}>
          <input id="buildingSerial" name="buildingSerial" type="text" value={form.buildingSerial} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Building Serial Number" />
        </RequiredField>

        <RequiredField htmlFor="housingUnitSerial" label="Housing Unit Serial Number" required showError={showErrors.housingUnitSerial}>
          <input id="housingUnitSerial" name="housingUnitSerial" type="text" value={form.housingUnitSerial} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Housing Unit Serial Number" />
        </RequiredField>

        <RequiredField htmlFor="householdSerial" label="Household Serial Number" required showError={showErrors.householdSerial}>
          <input id="householdSerial" name="householdSerial" type="text" value={form.householdSerial} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Household Serial Number" />
        </RequiredField>

        <RequiredField htmlFor="respondentLineNo" label="Respondent Line No." required showError={showErrors.respondentLineNo}>
          <input id="respondentLineNo" name="respondentLineNo" type="text" value={form.respondentLineNo} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Respondent Line No." />
        </RequiredField>

        <RequiredField htmlFor="contactNumber" label="Contact Number" required showError={showErrors.contactNumber}>
          <input id="contactNumber" name="contactNumber" type="tel" maxLength={11} value={form.contactNumber} onChange={handleChange} className="border p-2 rounded w-full" placeholder="e.g., 09123456789" />
        </RequiredField>

        <RequiredField htmlFor="email" label="Email Address" required showError={showErrors.email}>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Email Address" />
        </RequiredField>
      </div>

      {/* Household Head */}
      <h2 className="text-xl font-semibold text-green-600 pt-4">Household Head</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RequiredField htmlFor="headLastName" label="Last Name" required showError={showErrors.headLastName}>
          <input id="headLastName" name="headLastName" type="text" value={form.headLastName} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Last Name" />
        </RequiredField>

        <RequiredField htmlFor="headFirstName" label="First Name" required showError={showErrors.headFirstName}>
          <input id="headFirstName" name="headFirstName" type="text" value={form.headFirstName} onChange={handleChange} className="border p-2 rounded w-full" placeholder="First Name" />
        </RequiredField>

        <div className="flex flex-col">
          <label htmlFor="headSuffix" className="mb-1 text-sm font-medium text-gray-700">Suffix</label>
          <input id="headSuffix" name="headSuffix" type="text" value={form.headSuffix} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Suffix" />
        </div>

        <div className="flex flex-col">
          <label htmlFor="headMiddleName" className="mb-1 text-sm font-medium text-gray-700">Middle Name</label>
          <input id="headMiddleName" name="headMiddleName" type="text" value={form.headMiddleName} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Middle Name" />
        </div>

        <RequiredField htmlFor="headSex" label="Sex" required showError={showErrors.headSex}>
          <select id="headSex" name="headSex" value={form.headSex} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </RequiredField>

        <RequiredField htmlFor="headAge" label="Age" required showError={showErrors.headAge}>
          <input id="headAge" name="headAge" type="number" value={form.headAge} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Age" min={0} />
        </RequiredField>
      </div>

      {/* Address */}
      <h2 className="text-xl font-semibold text-green-600 pt-4">Address</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {['floorNo', 'houseNo', 'blockLotNo', 'streetName', 'subdivision'].map(field => (
          <div key={field} className="flex flex-col">
            <label htmlFor={field} className="mb-1 text-sm font-medium text-gray-700">{field.replace(/([A-Z])/g, ' $1')}</label>
            <input id={field} name={field} type="text" value={form[field]} onChange={handleChange} className="border p-2 rounded w-full" placeholder={field.replace(/([A-Z])/g, ' $1')} />
          </div>
        ))}
      </div>

      {/* Homes */}
      <h2 className="text-xl font-semibold text-green-600 pt-4">Homes</h2>
      {form.homes.map((home, index) => (
        <div key={index} className="border p-4 rounded mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">{home.label}</span>
            {index > 0 && <button type="button" className="text-red-600" onClick={() => handleRemoveHome(index)}>Remove</button>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Latitude</label>
              <input type="text" value={home.latitude} readOnly className="border p-2 rounded w-full" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Longitude</label>
              <input type="text" value={home.longitude} readOnly className="border p-2 rounded w-full" />
            </div>
            <div className="sm:col-span-2">
              <button type="button" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={() => { setCurrentHomeIndex(index); setMapOpen(true); }}>
                Pick Location from Map
              </button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={handleAddHome} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Add Another Home
      </button>

      {/* Submit */}
      <div className="pt-6 flex justify-end">
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center gap-2" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save & Continue >'}
        </button>
      </div>

      <MapPopup isOpen={mapOpen} onClose={() => setMapOpen(false)} onSave={handleSaveLocation} />
    </form>
  );
}
