import React from 'react';
import RequiredField from '@/components/Required';

export default function LocationFields({ form, handleChange, showErrors, geoData }) {
  const regionOptions = Object.keys(geoData);
  const provinceOptions = form.region ? Object.keys(geoData[form.region]) : [];
  const cityOptions = form.province ? Object.keys(geoData[form.region]?.[form.province] || {}) : [];
  const barangayOptions = form.city ? geoData[form.region]?.[form.province]?.[form.city] || [] : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <RequiredField htmlFor="region" label="Region" required showError={showErrors.region}>
        <select
          id="region"
          name="region"
          value={form.region}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          autoComplete="address-level1"
        >
          <option value="">Select Region</option>
          {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </RequiredField>

      <RequiredField htmlFor="province" label="Province" required showError={showErrors.province}>
        <select
          id="province"
          name="province"
          value={form.province}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          autoComplete="address-level1"
        >
          <option value="">Select Province</option>
          {provinceOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </RequiredField>

      <RequiredField htmlFor="city" label="Municipality / City" required showError={showErrors.city}>
        <select
          id="city"
          name="city"
          value={form.city}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          autoComplete="address-level2"
        >
          <option value="">Select City</option>
          {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </RequiredField>

      <RequiredField htmlFor="barangay" label="Barangay" required showError={showErrors.barangay}>
        <select
          id="barangay"
          name="barangay"
          value={form.barangay}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          autoComplete="address-level3"
        >
          <option value="">Select Barangay</option>
          {barangayOptions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </RequiredField>
    </div>
  );
}
