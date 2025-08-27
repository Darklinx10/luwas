'use client';

import { FiX } from 'react-icons/fi';

export default function UserModal({ user, setUser, onClose, onSave, saving, mode }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
          aria-label="Close modal"
        >
          <FiX />
        </button>
        <h2 className="text-lg font-bold mb-4">
          {mode === 'edit' ? 'Edit User Info' : 'Add New User'}
        </h2>

        <div className="space-y-3">
          <Input
            label="First Name"
            id="firstName"
            value={user.firstName}
            onChange={(v) => setUser((p) => ({ ...p, firstName: v }))}
            autoComplete="given-name"
            placeholder="Enter first name"
            required
          />
          <Input
            label="Middle Name"
            id="middleName"
            value={user.middleName}
            onChange={(v) => setUser((p) => ({ ...p, middleName: v }))}
            autoComplete="additional-name"
            placeholder="Enter middle name"
            required
          />
          <Input
            label="Last Name"
            id="lastName"
            value={user.lastName}
            onChange={(v) => setUser((p) => ({ ...p, lastName: v }))}
            autoComplete="family-name"
            placeholder="Enter last name"
            required
          />
          <Input
            label="Contact Number"
            id="contactNumber"
            value={user.contactNumber}
            onChange={(v) => {
              if ((v === '' || /^0\d{0,10}$/.test(v)) && v.length <= 11) {
                setUser((p) => ({ ...p, contactNumber: v }));
              }
            }}
            type="tel"
            autoComplete="tel"
            placeholder="Enter contact number"
          />
          <Input
            label="Barangay"
            id="barangay"
            value={user.barangay}
            onChange={(v) => setUser((p) => ({ ...p, barangay: v }))}
            autoComplete="address-level3"
            placeholder="Enter barangay"
          />
          <Input
            label="Email"
            id="email"
            value={user.email}
            onChange={(v) => setUser((p) => ({ ...p, email: v }))}
            type="email"
            autoComplete="email"
            placeholder="Enter email address"
            disabled={mode === 'edit'}
            required
          />

          {mode === 'add' && (
            <>
              <Input
                label="Password"
                id="password"
                type="password"
                value={user.password}
                onChange={(v) => setUser((p) => ({ ...p, password: v }))}
                autoComplete="new-password"
                placeholder="Enter password"
                required
              />
              <div>
                <label htmlFor="role" className="block text-sm font-medium">
                  Role
                </label>
                <select
                  id="role"
                  value={user.role}
                  onChange={(e) => setUser((p) => ({ ...p, role: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Brgy-Secretary">Brgy-Secretary</option>
                  <option value="MDRRMC-Personnel">MDRRMC-Personnel</option>
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={onSave}
              disabled={saving}
              className={`px-4 py-2 text-white rounded flex items-center gap-2 ${
                saving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
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
  );
}

// Reusable Input component
const Input = ({ label, id, value, onChange, type = 'text', autoComplete, placeholder, disabled = false, required = false }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      id={id}
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full border rounded px-3 py-2 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      required={required}
    />
  </div>
);
