'use client';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

export default function HouseholdMembersTable({
  isExpanded,
  data,
  members,
  loadingMembers,
  handleEditMember,
  handleDeleteMember,
}) {
  if (!isExpanded) return null;

  return (
    <tr>
      <td colSpan="8" className="p-4 border bg-gray-50 text-left text-sm">
        <strong>Household Members:</strong>

        {loadingMembers[data.householdId] ? (
          <p className="text-gray-500 mt-1 animate-pulse">Loading household members...</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500 mt-1">No household members found...</p>
        ) : members.filter(
            (m) => (m.relationshipToHead || m.nuclearRelation || '').toLowerCase() !== 'head'
          ).length === 0 ? (
          <p className="text-gray-500 mt-1">No members found...</p>
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
                {members
                  .filter(
                    (m) => (m.relationshipToHead || m.nuclearRelation || '').toLowerCase() !== 'head'
                  )
                  .map((m) => {
                    const name = [m.firstName, m.middleName, m.lastName].filter(Boolean).join(' ');
                    const rawRelation = m.nuclearRelation || m.relationshipToHead || 'Unspecified';
                    const relationLabel = rawRelation.includes(' - ')
                      ? rawRelation.split(' - ')[1].trim()
                      : rawRelation.trim();
                    const ageStr = m.age ? `${m.age}` : 'N/A';
                    const contactNumber = m.contactNumber;

                    return (
                      <tr key={m.id} className="hover:bg-gray-100">
                        <td className="p-2 border">{name || 'Unnamed'}</td>
                        <td className="p-2 border">{relationLabel}</td>
                        <td className="p-2 border">{ageStr}</td>
                        <td className="p-2 border">{contactNumber}</td>
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
