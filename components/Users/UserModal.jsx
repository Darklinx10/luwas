import React from 'react';
import { FiX } from 'react-icons/fi';
import InputField from './Input';
import RequiredField from '@/components/Required';

const UserModal = ({ user, setUser, onClose, onSave, saving, mode, showErrors = {} }) => (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-black"
        onClick={onClose}
      >
        <FiX />
      </button>

      <h2 className="text-lg font-bold mb-4">
        {mode === 'edit' ? 'Edit User Info' : 'Add New Secretary'}
      </h2>

      <div className="space-y-3">
        {/* First Name */}
        <RequiredField htmlFor="firstName" label="First Name" required showError={showErrors.firstName}>
          <InputField
            id="firstName"
            value={user.firstName}
            onChange={v => setUser(p => ({ ...p, firstName: v }))}
            placeholder="Enter first name"
          />
        </RequiredField>

        {/* Middle Name */}
        <RequiredField htmlFor="middleName" label="Middle Name" showError={showErrors.middleName}>
          <InputField
            id="middleName"
            value={user.middleName}
            onChange={v => setUser(p => ({ ...p, middleName: v }))}
            placeholder="Enter middle name"
          />
        </RequiredField>

        {/* Last Name */}
        <RequiredField htmlFor="lastName" label="Last Name" required showError={showErrors.lastName}>
          <InputField
            id="lastName"
            value={user.lastName}
            onChange={v => setUser(p => ({ ...p, lastName: v }))}
            placeholder="Enter last name"
          />
        </RequiredField>

        {/* Contact Number */}
        <RequiredField htmlFor="contactNumber" label="Contact Number" showError={showErrors.contactNumber}>
          <InputField
            id="contactNumber"
            type="tel"
            value={user.contactNumber}
            onChange={v => setUser(p => ({ ...p, contactNumber: v }))}
            placeholder="Enter contact number"
          />
        </RequiredField>

        {/* Barangay */}
        <RequiredField htmlFor="barangay" label="Barangay" showError={showErrors.barangay}>
          <InputField
            id="barangay"
            value={user.barangay}
            onChange={v => setUser(p => ({ ...p, barangay: v }))}
            placeholder="Enter barangay"
          />
        </RequiredField>

        {/* Email */}
        <RequiredField htmlFor="email" label="Email" required showError={showErrors.email}>
          <InputField
            id="email"
            type="email"
            value={user.email}
            onChange={v => setUser(p => ({ ...p, email: v }))}
            placeholder="you@example.com"
            disabled={mode === 'edit'}
          />
        </RequiredField>

        {mode === 'add' && (
          <>
            {/* Password */}
            <RequiredField htmlFor="password" label="Password" required showError={showErrors.password}>
              <InputField
                id="password"
                type="password"
                value={user.password}
                onChange={v => setUser(p => ({ ...p, password: v }))}
                placeholder="••••••••"
              />
            </RequiredField>

            {/* Role */}
            <RequiredField htmlFor="role" label="Role" required showError={showErrors.role}>
              <select
                id="role"
                value={user.role}
                onChange={e => setUser(p => ({ ...p, role: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select role</option>
                <option value="Secretary">Secretary</option>
                <option value="OfficeStaff">Office Staff</option>
              </select>
            </RequiredField>
          </>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-4 py-2 text-white rounded ${saving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default UserModal;
