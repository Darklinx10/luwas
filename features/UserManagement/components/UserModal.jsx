'use client';

import { FiEye, FiEyeOff, FiMapPin, FiShield, FiUser, FiX } from 'react-icons/fi';
import { useMemo, useState } from 'react';
import geoData from '@/utils/geoData-ph.json';
import { normalizeName } from '@/lib/utils/nameNormalizer';

export default function UserModal({ user, setUser, onClose, onSave, saving, mode }) {
  const regionVII = geoData.regions.find((region) => region.name.includes('Region VII'));
  const bohol = regionVII?.provinces?.find((province) => province.name === 'Bohol');
  const municipalities = bohol?.cities || [];

  const selectedMunicipality = municipalities.find(
    (municipality) => municipality.name === user.municipality
  );
  const barangays = selectedMunicipality?.barangays || [];

  const modalTitle = mode === 'edit' ? 'Edit User Account' : 'Add New User';
  const modalSubtitle =
    mode === 'edit'
      ? 'Update user profile details, location assignment, and account information.'
      : 'Create a new LUWAS user account and assign an initial role.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <button
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          onClick={onClose}
          aria-label="Close modal"
        >
          <FiX size={18} />
        </button>

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              {mode === 'edit' ? 'Edit Mode' : 'Add Mode'}
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              User Account
            </span>
          </div>

          <h2 className="mt-3 text-xl font-bold text-slate-800">{modalTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{modalSubtitle}</p>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="First Name"
              id="firstName"
              value={user.firstName}
              onChange={(value) =>
                setUser((prev) => ({ ...prev, firstName: normalizeName(value) }))
              }
              autoComplete="given-name"
              placeholder="Enter first name"
              required
            />

            <Input
              label="Middle Name"
              id="middleName"
              value={user.middleName}
              onChange={(value) =>
                setUser((prev) => ({ ...prev, middleName: normalizeName(value) }))
              }
              autoComplete="additional-name"
              placeholder="Enter middle name"
            />

            <Input
              label="Last Name"
              id="lastName"
              value={user.lastName}
              onChange={(value) =>
                setUser((prev) => ({ ...prev, lastName: normalizeName(value) }))
              }
              autoComplete="family-name"
              placeholder="Enter last name"
              required
            />

            <Input
              label="Contact Number"
              id="contactNumber"
              value={user.contactNumber}
              onChange={(value) => {
                if (value === '' || /^\d+$/.test(value)) {
                  setUser((prev) => ({
                    ...prev,
                    contactNumber: value.slice(0, 11),
                  }));
                }
              }}
              type="tel"
              autoComplete="tel"
              placeholder="Enter 10-11 digit number"
            />

            <SelectField
              label="Municipality / City"
              id="municipality"
              value={user.municipality || ''}
              onChange={(value) =>
                setUser((prev) => ({
                  ...prev,
                  municipality: value,
                  barangay: '',
                }))
              }
              options={municipalities.map((municipality) => ({
                value: municipality.name,
                label: municipality.name,
              }))}
              placeholder="Select Municipality"
              required
            />

            <SelectField
              label="Barangay"
              id="barangay"
              value={user.barangay || ''}
              onChange={(value) =>
                setUser((prev) => ({ ...prev, barangay: value }))
              }
              options={barangays.map((barangay, index) => {
                const name = typeof barangay === 'string' ? barangay : barangay.name;
                return {
                  value: name || '',
                  label: name || `Barangay ${index + 1}`,
                };
              })}
              placeholder="Select Barangay"
              required
              disabled={!user.municipality}
            />

            <div className="md:col-span-2">
              <Input
                label="Email"
                id="email"
                value={user.email}
                onChange={(value) => setUser((prev) => ({ ...prev, email: value }))}
                type="email"
                autoComplete="email"
                placeholder="Enter email address"
                disabled={mode === 'edit'}
                required
              />
            </div>

            {mode === 'add' && (
              <>
                <div className="md:col-span-2">
                  <Input
                    label="Password"
                    id="password"
                    type="password"
                    value={user.password}
                    onChange={(value) =>
                      setUser((prev) => ({ ...prev, password: value }))
                    }
                    autoComplete="new-password"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <SelectField
                  label="Role"
                  id="role"
                  value={user.role}
                  onChange={(value) => setUser((prev) => ({ ...prev, role: value }))}
                  options={[
                    { value: 'Brgy-Secretary', label: 'Brgy-Secretary' },
                    { value: 'MDRRMC-Personnel', label: 'MDRRMC-Personnel' },
                  ]}
                  placeholder="Select Role"
                />
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition ${saving
                ? 'cursor-not-allowed bg-emerald-400'
                : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
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
              'Save User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  disabled = false,
  required = false,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''
          }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Input({
  label,
  id,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  disabled = false,
  required = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        id={id}
        type={isPassword && showPassword ? 'text' : type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''
          }`}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-[38px] text-slate-500 transition hover:text-slate-700"
        >
          {showPassword ? <FiEye /> : <FiEyeOff />}
        </button>
      )}
    </div>
  );
}