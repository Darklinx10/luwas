'use client';

export default function EditMemberModal({
  isOpen,
  member,
  onClose,
  onChange,
  onSave,
  updating,
  mapRelationToCategory,
}) {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-[90%] max-w-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Member Information</h2>

        <div className="space-y-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              value={member.firstName || ''}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              value={member.lastName || ''}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Middle Name */}
          <div>
            <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              value={member.middleName || ''}
              onChange={onChange}
              placeholder="Middle Name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              value={member.age || ''}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number
            </label>
            <input
              id="contactNumber"
              name="contactNumber"
              type="tel"
              value={member.contactNumber || ''}
              onChange={onChange}
              placeholder="e.g. 0917XXXXXXX"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Relation to Head */}
          <div>
            <label htmlFor="nuclearRelation" className="block text-sm font-medium text-gray-700 mb-1">
              Relation to Head
            </label>
            <select
              name="nuclearRelation"
              value={mapRelationToCategory(
                member.nuclearRelation || member.relationshipToHead
              )}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="" disabled>Select relation</option>
              <option value="Head">Head</option>
              <option value="Spouse">Spouse</option>
              <option value="Partner">Partner</option>
              <option value="Child">Child</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Relative">Relative</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            disabled={updating}
            className={`px-4 py-2 rounded-lg text-white transition flex justify-center items-center gap-2 ${
              updating ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {updating ? (
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
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
