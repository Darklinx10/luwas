'use client';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { capitalizeWords } from '@/utils/capitalize'; // ✅ added import

export default function HouseholdMembersTable({
  isExpanded,
  data,
  members,
  loadingMembers,
  handleEditMember,
  handleDeleteMember,
  handleAddMember,
}) {
  if (!isExpanded) return null;

  const nonHeadMembers = members.filter(
    (m) => ((m.relationshipToHead || m.nuclearRelation || '').toLowerCase() !== 'head')
  );

  // Calculate gender counts
  const maleCount = nonHeadMembers.filter((m) => (m.sex || '').toLowerCase() === 'male').length;
  const femaleCount = nonHeadMembers.filter((m) => (m.sex || '').toLowerCase() === 'female').length;

  return (
    <tr>
      <td colSpan="10" className="p-4 border bg-gray-50 text-left text-sm">
        <div className="flex items-center justify-between mb-3">
          <strong>Household Members:</strong>
          <button
            onClick={() => handleAddMember(data.householdId)}
            className="inline-flex items-center gap-2 rounded bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition"
          >
            <FiPlus className="text-sm" /> Add Member
          </button>
        </div>

        {loadingMembers[data.householdId] ? (
          <p className="text-gray-500 mt-1 animate-pulse">Loading household members...</p>
        ) : members.length === 0 || nonHeadMembers.length === 0 ? (
          <p className="text-gray-500 mt-1">No household members found...</p>
        ) : (
          <>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-center text-sm border border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Relation</th>
                    <th className="p-2 border">Sex</th>
                    <th className="p-2 border">Age</th>
                    <th className="p-2 border">Contact Number</th>
                    <th className="p-2 border text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nonHeadMembers.map((m) => {
                    const name = capitalizeWords(
                      [m.lastName, m.firstName, m.middleName].filter(Boolean).join(', ')
                    ) || 'Unnamed';

                    const rawRelation = m.nuclearRelation || m.relationshipToHead || 'Unspecified';
                    const relationLabel = capitalizeWords(
                      rawRelation.includes(' - ') ? rawRelation.split(' - ')[1].trim() : rawRelation.trim()
                    );

                    const sex = capitalizeWords(m.sex || 'N/A');

                    return (
                      <tr key={m.id} className="hover:bg-gray-100">
                        <td className="p-2 border">{name}</td>
                        <td className="p-2 border">{relationLabel}</td>
                        <td className="p-2 border">{sex}</td>
                        <td className="p-2 border">{m.age || 'N/A'}</td>
                        <td className="p-2 border">{m.contactNumber || 'N/A'}</td>
                        <td className="p-2 border text-center space-x-2">
                          <button
                            onClick={() => handleEditMember(data.householdId, m)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>

                          <button
                            onClick={() => handleDeleteMember(data.householdId, m.memberId || m.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Gender Summary */}
            <div className="mt-3 flex gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Male:</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">{maleCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Female:</span>
                <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded">{femaleCount}</span>
              </div>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}