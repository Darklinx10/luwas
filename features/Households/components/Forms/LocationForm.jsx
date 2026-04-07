'use client';

import RequiredField from '@/components/Required';
import geoData from '@/utils/geoData-ph.json';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'react-toastify';

const MapPopup = dynamic(() => import('@/components/mapPopUP'), { ssr: false });

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const readOnlyClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500';

const FormField = ({ label, htmlFor, children }) => (
  <div className="flex flex-col">
    <label htmlFor={htmlFor} className="mb-1.5 text-sm font-medium text-slate-700">
      {label}
    </label>
    {children}
  </div>
);

export default function LocationForm({
  locationData,
  onLocationChange,
  onNext,
  onCancel,
  isSaving,
}) {
  const [showErrors, setShowErrors] = useState({});
  const [currentHomeIndex, setCurrentHomeIndex] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);

  const selectedRegion = geoData.regions?.find((r) => r.name === locationData.region);
  const provinceOptions = selectedRegion?.provinces || [];
  const selectedProvince = provinceOptions.find((p) => p.name === locationData.province);
  const cityOptions = selectedProvince?.cities || [];
  const selectedCity = cityOptions.find((c) => c.name === locationData.city);
  const barangayOptions = selectedCity?.barangays || [];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'region') {
      onLocationChange({
        ...locationData,
        region: value,
        province: '',
        city: '',
        barangay: '',
      });
    } else if (name === 'province') {
      onLocationChange({
        ...locationData,
        province: value,
        city: '',
        barangay: '',
      });
    } else if (name === 'city') {
      onLocationChange({
        ...locationData,
        city: value,
        barangay: '',
      });
    } else {
      onLocationChange({ ...locationData, [name]: value });
    }

    setShowErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleHomeChange = (key, value, index) => {
    const nextHomes = [...locationData.homes];
    nextHomes[index][key] = value;
    onLocationChange({ ...locationData, homes: nextHomes });
  };

  const handleAddHome = () => {
    const nextHomes = [...locationData.homes, { label: '', latitude: '', longitude: '' }];
    onLocationChange({
      ...locationData,
      homes: nextHomes.map((home, index) => ({
        ...home,
        label: index === 0 ? 'Primary Home' : `Secondary Home ${index}`,
      })),
    });
  };

  const handleRemoveHome = (index) => {
    if (locationData.homes.length <= 1) {
      toast.warning('At least one home is required');
      return;
    }

    const nextHomes = locationData.homes.filter((_, i) => i !== index);
    onLocationChange({
      ...locationData,
      homes: nextHomes.map((home, idx) => ({
        ...home,
        label: idx === 0 ? 'Primary Home' : `Secondary Home ${idx}`,
      })),
    });
  };

  const handleSaveLocation = (location) => {
    handleHomeChange('latitude', location.lat.toFixed(6), currentHomeIndex);
    handleHomeChange('longitude', location.lng.toFixed(6), currentHomeIndex);
    setMapOpen(false);
    toast.success('Location pinned successfully!');
  };

  const validateLocation = () => {
    const errors = {};

    if (!locationData.region) errors.region = true;
    if (!locationData.province) errors.province = true;
    if (!locationData.city) errors.city = true;
    if (!locationData.barangay) errors.barangay = true;
    if (!locationData.zipcode) errors.zipcode = true;

    let hasValidHome = false;
    locationData.homes.forEach((home, index) => {
      if (home.latitude && home.longitude) {
        hasValidHome = true;
      } else {
        errors[`home-${index}`] = true;
      }
    });

    if (!hasValidHome) errors.homes = true;

    setShowErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateLocation()) {
      toast.error('Please complete the required location fields and home coordinates');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-emerald-700">Family Location</h2>
        <p className="mt-1 text-sm text-slate-500">
          Set the location hierarchy and pin each mapped household residence.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RequiredField htmlFor="region" label="Region" required showError={showErrors.region}>
          <select
            id="region"
            name="region"
            value={locationData.region}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select Region</option>
            {geoData.regions?.map((region) => (
              <option key={region.name} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
        </RequiredField>

        <RequiredField htmlFor="province" label="Province" required showError={showErrors.province}>
          <select
            id="province"
            name="province"
            value={locationData.province}
            onChange={handleChange}
            className={inputClass}
            disabled={!selectedRegion}
          >
            <option value="">Select Province</option>
            {provinceOptions.map((province) => (
              <option key={province.name} value={province.name}>
                {province.name}
              </option>
            ))}
          </select>
        </RequiredField>

        <RequiredField htmlFor="city" label="Municipality / City" required showError={showErrors.city}>
          <select
            id="city"
            name="city"
            value={locationData.city}
            onChange={handleChange}
            className={inputClass}
            disabled={!selectedProvince}
          >
            <option value="">Select Municipality / City</option>
            {cityOptions.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </RequiredField>

        <RequiredField htmlFor="barangay" label="Barangay" required showError={showErrors.barangay}>
          <select
            id="barangay"
            name="barangay"
            value={locationData.barangay}
            onChange={handleChange}
            className={inputClass}
            disabled={!selectedCity}
          >
            <option value="">Select Barangay</option>
            {barangayOptions.map((barangay) => (
              <option key={barangay.name} value={barangay.name}>
                {barangay.name}
              </option>
            ))}
          </select>
        </RequiredField>

        <RequiredField htmlFor="zipcode" label="Zipcode" required showError={showErrors.zipcode}>
          <input
            id="zipcode"
            name="zipcode"
            type="text"
            value={locationData.zipcode}
            onChange={handleChange}
            className={inputClass}
            placeholder="e.g. 4800"
          />
        </RequiredField>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-emerald-700">Homes / Residences</h3>
          <p className="mt-1 text-sm text-slate-500">
            Pin at least one home location from the map.
          </p>
        </div>

        {showErrors.homes && (
          <p className="mb-4 text-sm text-red-500">
            At least one home with coordinates is required.
          </p>
        )}

        <div className="space-y-4">
          {locationData.homes.map((home, index) => (
            <div
              key={`${home.label}-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">{home.label}</h4>
                  <p className="text-xs text-slate-500">
                    Residence #{index + 1}
                  </p>
                </div>

                {locationData.homes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveHome(index)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label={`Latitude ${home.latitude ? '✓' : ''}`} htmlFor={`lat-${index}`}>
                  <input
                    id={`lat-${index}`}
                    type="text"
                    value={home.latitude}
                    readOnly
                    className={readOnlyClass}
                    placeholder="Coordinates appear here"
                  />
                </FormField>

                <FormField label={`Longitude ${home.longitude ? '✓' : ''}`} htmlFor={`lng-${index}`}>
                  <input
                    id={`lng-${index}`}
                    type="text"
                    value={home.longitude}
                    readOnly
                    className={readOnlyClass}
                    placeholder="Coordinates appear here"
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentHomeIndex(index);
                      setMapOpen(true);
                    }}
                    className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Pin Location from Map
                  </button>
                </div>
              </div>

              {showErrors[`home-${index}`] && (
                <p className="mt-3 text-xs text-red-500">
                  Latitude and longitude are required for this home.
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddHome}
          className="mt-4 w-full rounded-xl border-2 border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          Add Another Home
        </button>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
        >
          Next
        </button>
      </div>

      <MapPopup
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        onSave={handleSaveLocation}
      />
    </div>
  );
}