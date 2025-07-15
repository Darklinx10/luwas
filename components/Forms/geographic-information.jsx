'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import dynamic from 'next/dynamic';

// 🔄 Dynamically import the Map component (client-side only)
const MapPopup = dynamic(() => import('@/components/mapPopUp'), { ssr: false });

// 📍 Hierarchical location data used for region/province/city/barangay selection
const geoData = {
  "Region VII – Central Visayas": {
    "Bohol": {
      "Clarin": [
        "Bacani", "Bogtongbod", "Bonbon", "Bontud", "Buacao", "Buangan", "Cabog", "Caboy",
        "Caluwasan", "Candajec", "Cantoyoc", "Comaang", "Danahao", "Katipunan", "Lajog",
        "Mataub", "Nahawan", "Poblacion Centro", "Poblacion Norte", "Poblacion Sur",
        "Tangaran", "Tontunan", "Tubod", "Villaflor"
      ]
    }
  }
};

// 📥 Maps input field names to autocomplete hints for better UX
const autocompleteMap = {
  region: 'address-level1',
  province: 'address-level1',
  city: 'address-level2',
  barangay: 'address-level3',
  sitio: 'address-level3',
  eaNumber: 'off',
  buildingSerial: 'off',
  housingUnitSerial: 'off',
  householdSerial: 'off',
  respondentLineNo: 'off',
  contactNumber: 'tel',
  email: 'email',
  headLastName: 'family-name',
  headFirstName: 'given-name',
  headSuffix: 'honorific-suffix',
  headMiddleName: 'additional-name',
  floorNo: 'address-line1',
  houseNo: 'street-address',
  blockLotNo: 'address-line2',
  streetName: 'address-line1',
  subdivision: 'address-line3',
};

export default function GeographicIdentification({ householdId, goToNext }) {
  // 📍 Map modal toggle
  const [mapOpen, setMapOpen] = useState(false);

  // 📝 Main form state
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
    headAge:'',
    headSex:'',
    floorNo: '',
    houseNo: '',
    blockLotNo: '',
    streetName: '',
    subdivision: '',
    latitude: '',
    longitude: '',
  });

  // 🔄 Handle cascading dropdowns (reset dependents on change)
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'region') {
      setForm((prev) => ({ ...prev, region: value, province: '', city: '', barangay: '' }));
    } else if (name === 'province') {
      setForm((prev) => ({ ...prev, province: value, city: '', barangay: '' }));
    } else if (name === 'city') {
      setForm((prev) => ({ ...prev, city: value, barangay: '' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 📍 Handle setting map coordinates from the popup
  const handleSaveLocation = (location) => {
    setForm((prev) => ({
      ...prev,
      latitude: location.lat.toFixed(6),
      longitude: location.lng.toFixed(6),
    }));
    setMapOpen(false);
  };

  // 💾 Save data to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        toast.error('User not authenticated.');
        return;
      }

      // 📄 Firestore reference: households/{householdId}/geographicIdentification/main
      const ref = doc(db, 'households', householdId, 'geographicIdentification', 'main');

      await setDoc(ref, {
        ...form,
        uid: user.uid, // 🔐 Tag the user who submitted the form
      });

      toast.success('Geographic information saved!');
      goToNext();
    } catch (error) {
      console.error('Error saving geographic form:', error);
      toast.error('Failed to save data.');
    }
  };

  // 🧱 Create input or select field depending on `options`
  const createInput = (id, label, type = 'text', options = []) => {
    const auto = autocompleteMap[id] || 'off';

    return (
      <div className="flex flex-col">
        <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
        {options.length > 0 ? (
          <select
            id={id}
            name={id}
            value={form[id]}
            onChange={handleChange}
            autoComplete={auto}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select {label}</option>
            {options.map((opt, index) => (
              <option key={index} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            name={id}
            type={type}
            value={form[id]}
            onChange={handleChange}
            autoComplete={auto}
            className="border p-2 rounded w-full"
            placeholder={label}
            required
          />
        )}
      </div>
    );
  };

  // 📋 Dynamic dropdown values based on selected region/province/city
  const regionOptions = Object.keys(geoData);
  const provinceOptions = form.region ? Object.keys(geoData[form.region]) : [];
  const cityOptions = form.province ? Object.keys(geoData[form.region]?.[form.province] || {}) : [];
  const barangayOptions = form.city ? geoData[form.region]?.[form.province]?.[form.city] || [] : [];

  return (
    <form onSubmit={handleSubmit} className="pr-2 space-y-6">
      {/* Basic Location Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Region */}
        <div className="flex flex-col">
          <label htmlFor="region" className="mb-1 text-sm font-medium text-gray-700">Region</label>
          <select
            id="region"
            name="region"
            value={form.region}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          >
            <option value="">Select Region</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* Province */}
        <div className="flex flex-col">
          <label htmlFor="province" className="mb-1 text-sm font-medium text-gray-700">Province</label>
          <select
            id="province"
            name="province"
            value={form.province}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          >
            <option value="">Select Province</option>
            {provinceOptions.map((province) => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div className="flex flex-col">
          <label htmlFor="city" className="mb-1 text-sm font-medium text-gray-700">Municipality / City</label>
          <select
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          >
            <option value="">Select City</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Barangay */}
        <div className="flex flex-col">
          <label htmlFor="barangay" className="mb-1 text-sm font-medium text-gray-700">Barangay</label>
          <select
            id="barangay"
            name="barangay"
            value={form.barangay}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          >
            <option value="">Select Barangay</option>
            {barangayOptions.map((barangay) => (
              <option key={barangay} value={barangay}>{barangay}</option>
            ))}
          </select>
        </div>

        {/* Sitio / Purok */}
        <div className="flex flex-col">
          <label htmlFor="sitio" className="mb-1 text-sm font-medium text-gray-700">Sitio / Purok</label>
          <input
            id="sitio"
            name="sitio"
            type="text"
            value={form.sitio}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Sitio / Purok"
          />
        </div>

        {/* Enumeration Area Number */}
        <div className="flex flex-col">
          <label htmlFor="eaNumber" className="mb-1 text-sm font-medium text-gray-700">Enumeration Area Number</label>
          <input
            id="eaNumber"
            name="eaNumber"
            type="text"
            value={form.eaNumber}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Enumeration Area Number"
          />
        </div>

        {/* Building Serial Number */}
        <div className="flex flex-col">
          <label htmlFor="buildingSerial" className="mb-1 text-sm font-medium text-gray-700">Building Serial Number</label>
          <input
            id="buildingSerial"
            name="buildingSerial"
            type="text"
            value={form.buildingSerial}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Building Serial Number"
          />
        </div>

        {/* Housing Unit Serial Number */}
        <div className="flex flex-col">
          <label htmlFor="housingUnitSerial" className="mb-1 text-sm font-medium text-gray-700">Housing Unit Serial Number</label>
          <input
            id="housingUnitSerial"
            name="housingUnitSerial"
            type="text"
            value={form.housingUnitSerial}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Housing Unit Serial Number"
          />
        </div>

        {/* Household Serial Number */}
        <div className="flex flex-col">
          <label htmlFor="householdSerial" className="mb-1 text-sm font-medium text-gray-700">Household Serial Number</label>
          <input
            id="householdSerial"
            name="householdSerial"
            type="text"
            value={form.householdSerial}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Household Serial Number"
          />
        </div>

        {/* Respondent Line No. */}
        <div className="flex flex-col">
          <label htmlFor="respondentLineNo" className="mb-1 text-sm font-medium text-gray-700">Respondent Line No.</label>
          <input
            id="respondentLineNo"
            name="respondentLineNo"
            type="text"
            value={form.respondentLineNo}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Respondent Line No."
          />
        </div>

        {/* Contact Number */}
        <div className="flex flex-col">
          <label htmlFor="contactNumber" className="mb-1 text-sm font-medium text-gray-700">Contact Number</label>
          <input
            id="contactNumber"
            name="contactNumber"
            type="tel"
            value={form.contactNumber}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Contact Number"
          />
        </div>

        {/* Email Address */}
        <div className="flex flex-col">
          <label htmlFor="email" className="mb-1 text-sm font-medium text-gray-700">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Email Address"
          />
        </div>
      </div>

      {/* Household Head */}
      <h2 className="text-xl font-semibold text-green-600 pt-4">Household Head</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label htmlFor="headLastName" className="mb-1 text-sm font-medium text-gray-700">Last Name</label>
          <input
            id="headLastName"
            name="headLastName"
            type="text"
            value={form.headLastName}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Last Name"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="headFirstName" className="mb-1 text-sm font-medium text-gray-700">First Name</label>
          <input
            id="headFirstName"
            name="headFirstName"
            type="text"
            value={form.headFirstName}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="First Name"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="headSuffix" className="mb-1 text-sm font-medium text-gray-700">Suffix</label>
          <input
            id="headSuffix"
            name="headSuffix"
            type="text"
            value={form.headSuffix}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Suffix"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="headMiddleName" className="mb-1 text-sm font-medium text-gray-700">Middle Name</label>
          <input
            id="headMiddleName"
            name="headMiddleName"
            type="text"
            value={form.headMiddleName}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Middle Name"
          />
        </div>
      </div>

      {/* Physical Address */}
      <h2 className="text-xl font-semibold text-green-600 pt-4">Address</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label htmlFor="floorNo" className="mb-1 text-sm font-medium text-gray-700">Floor No</label>
          <input
            id="floorNo"
            name="floorNo"
            type="text"
            value={form.floorNo}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Floor No"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="houseNo" className="mb-1 text-sm font-medium text-gray-700">House / Building No</label>
          <input
            id="houseNo"
            name="houseNo"
            type="text"
            value={form.houseNo}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="House / Building No"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="blockLotNo" className="mb-1 text-sm font-medium text-gray-700">Block / Lot No</label>
          <input
            id="blockLotNo"
            name="blockLotNo"
            type="text"
            value={form.blockLotNo}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Block / Lot No"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="streetName" className="mb-1 text-sm font-medium text-gray-700">Street Name</label>
          <input
            id="streetName"
            name="streetName"
            type="text"
            value={form.streetName}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Street Name"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="subdivision" className="mb-1 text-sm font-medium text-gray-700">Subdivision / Village</label>
          <input
            id="subdivision"
            name="subdivision"
            type="text"
            value={form.subdivision}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Subdivision / Village"
          />
        </div>
      </div>

      {/* 🗺️ GPS Coordinates from map */}
      <h2 className="text-xl font-semibold text-green-600 pt-4">Map Coordinates</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Latitude</label>
          <input
            type="text"
            name="latitude"
            value={form.latitude}
            readOnly
            className="border p-2 rounded w-full bg-gray-100"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Longitude</label>
          <input
            type="text"
            name="longitude"
            value={form.longitude}
            readOnly
            className="border p-2 rounded w-full bg-gray-100"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
          >
            Pick Location from Map
          </button>
        </div>
      </div>

      {/* ✅ Submit button */}
      <div className="pt-6 flex justify-end">
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 cursor-pointer">
          Save & Continue &gt;
        </button>
      </div>

      {/* 🗺️ Modal popup for choosing map location */}
      <MapPopup isOpen={mapOpen} onClose={() => setMapOpen(false)} onSave={handleSaveLocation} />
    </form>
  );
}
