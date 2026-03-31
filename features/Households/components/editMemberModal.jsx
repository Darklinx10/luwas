'use client';
import { capitalizeWords } from "@/utils/capitalize";

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

  // Helper wrapper for capitalizing on input change
  const handleCapitalChange = (e) => {
    const { name, value } = e.target;
    const fieldsToCapitalize = ['firstName', 'middleName', 'lastName', 'suffix'];
    const newValue = fieldsToCapitalize.includes(name) ? capitalizeWords(value.trim()) : value;
    onChange({ target: { name, value: newValue } });
  };

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
              onChange={handleCapitalChange} // ✅ capitalize
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
              onChange={handleCapitalChange} // ✅ capitalize
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
              onChange={handleCapitalChange} // ✅ capitalize
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
              onChange={onChange}
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

          {/* Suffix */}
          <div>
            <label htmlFor="suffix" className="block text-sm font-medium text-gray-700 mb-1">
              Suffix (Optional)
            </label>
            <input
              id="suffix"
              name="suffix"
              value={member.suffix || ''}
              onChange={handleCapitalChange}
              placeholder="e.g. Jr., Sr."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Sex */}
          <div>
            <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">
              Sex
            </label>
            <select
              id="sex"
              name="sex"
              value={member.sex || ''}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Relationship to Head */}
          <div>
            <label htmlFor="relationshipToHead" className="block text-sm font-medium text-gray-700 mb-1">
              Relationship to Head
            </label>
            <input
              id="relationshipToHead"
              name="relationshipToHead"
              value={member.relationshipToHead || ''}
              onChange={handleCapitalChange}
              placeholder="e.g. Spouse, Child"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Is PWD */}
          <div className="flex items-center gap-2">
            <input
              id="isPWD"
              name="isPWD"
              type="checkbox"
              checked={member.isPWD || false}
              onChange={(e) => onChange({ target: { name: 'isPWD', value: e.target.checked } })}
              className="rounded border border-gray-300 focus:ring-2 focus:ring-green-500"
            />
            <label htmlFor="isPWD" className="text-sm font-medium text-gray-700">
              Person with Disability (PWD)
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={updating}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={updating}
            className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updating && (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {updating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
