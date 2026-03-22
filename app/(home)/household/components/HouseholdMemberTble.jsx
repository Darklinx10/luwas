'use client';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { capitalizeWords } from '@/utils/capitalize'; // ✅ added import

export default function HouseholdMembersTable({
  isExpanded,
  data,
  members,
  loadingMembers,
  handleEditMember,
  handleDeleteMember,
  handleAddMember,
  userRole,
}) {
  if (!isExpanded) return null;

  const nonHeadMembers = members.filter(
    (m) => ((m.relationshipToHead || m.nuclearRelation || '').toLowerCase() !== 'head')
  );

  return (
    <tr>
      <td colSpan="10" className="p-4 border bg-gray-50 text-left text-sm">
      <div className="flex items-center justify-between mb-2">
            <strong>Household Members:</strong>
            {userRole === 'Brgy-Secretary' && (
            <button
              onClick={() => handleAddMember(data.householdId)}
              className="inline-flex items-center text-xs gap-2 px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Add Member
            </button>
          )}
          </div>

        {loadingMembers[data.householdId] ? (
          <p className="text-gray-500 mt-1 animate-pulse">Loading household members...</p>
        ) : members.length === 0 || nonHeadMembers.length === 0 ? (
          <p className="text-gray-500 mt-1">No household members found...</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-center text-sm border border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Relation</th>
                  <th className="p-2 border">Age</th>
                  <th className="p-2 border">Contact Number</th>
                  <th className="p-2 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
              {nonHeadMembers.map((m) => {
                const name = capitalizeWords(
                  [
                    m.lastName,
                    [m.firstName, m.middleName].filter(Boolean).join(' '),
                    m.suffix && m.suffix !== 'N/A' ? m.suffix : '',
                  ]
                    .filter(Boolean)
                    .join(', ')
                ) || 'Unnamed';

                const rawRelation = m.nuclearRelation || m.relationshipToHead || 'Unspecified';
                const relationLabel = capitalizeWords(
                  rawRelation.includes(' - ') ? rawRelation.split(' - ')[1].trim() : rawRelation.trim()
                );
                  return (
                    <tr key={m.id} className="hover:bg-gray-100">
                      <td className="p-2 border">{name}</td>
                      <td className="p-2 border">{relationLabel}</td>
                      <td className="p-2 border">{m.age || 'N/A'}</td>
                      <td className="p-2 border">{m.contactNumber || 'N/A'}</td>
                      <td className="p-2 border text-center space-x-2">
                        <button
                          onClick={() => handleEditMember(m, data.householdId)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <FiEdit />
                        </button>

                        <button
                          onClick={() => handleDeleteMember(m.id)}
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
        )}
      </td>
    </tr>
  );
}