'use client';
import React, { useMemo } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { FaArrowRight } from 'react-icons/fa';
import HouseholdMembersTable from './HouseholdMemberTble';
import { capitalizeWords } from '@/utils/capitalize';
import { toast } from 'react-toastify';

export default function HouseholdTable({
  loading,
  filteredHouseholds,
  expandedHouseholds,
  membersData,
  toggleExpanded,
  openMapWithLocation,
  setSelectedHouseholdId,
  setEditModalOpen,
  fetchHouseholds,
  totalHouseholds,
  totalResidents,
  handleEditMember,
  handleDeleteMember,
  handleDeleteHousehold,
  loadingMembers,
  setLoading,
  handleAddMember,
  userRole,
}) {
  

  const sortedHouseholds = useMemo(() => {
    return Array.isArray(filteredHouseholds) ? filteredHouseholds : [];
  }, [filteredHouseholds]);
  

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-green-500 mb-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-gray-600 text-sm">Loading household records...</p>
        </div>
      </div>
    );
  }

  if (!sortedHouseholds.length) {
    return <p className="text-center text-gray-500 py-6">No household records found.</p>;
  }

  return (
    <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin">
        <table className="w-full text-sm text-center print:text-xs print:border print:border-gray-400">
          <thead className="bg-gray-100 text-gray-600 print:bg-white print:text-black">
            <tr>
              <th className="p-2 border print:hidden"></th>
              <th className="p-2 border">No.</th>
              <th className="p-2 border">Family Head</th>
              <th className="p-2 border">Barangay</th>
              <th className="p-2 border">Sitio</th>
              <th className="p-2 border">Sex</th>
              <th className="p-2 border">Contact Number</th>
              <th className="p-2 border">Age</th>
              <th className="p-2 border print:hidden">Map</th>
              <th className="p-2 border print:hidden">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedHouseholds.map((hh, index) => {
              const fullName = [
                hh.headLastName,
                [hh.headFirstName, hh.headMiddleName].filter(Boolean).join(' '),
                hh.headSuffix && hh.headSuffix !== 'N/A' ? hh.headSuffix : '',
              ]
                .filter(Boolean)
                .join(', ');

              const isExpanded = expandedHouseholds[hh.householdId];
              const members = membersData[hh.householdId] || [];

              return (
                <React.Fragment key={hh.householdId}>
                  <tr className="hover:bg-gray-50">
                    <td className="p-2 border text-center print:hidden">
                      <button onClick={() => toggleExpanded(hh.householdId)} title="View Members">
                        <FaArrowRight
                          className={`text-green-600 inline transition-transform duration-200 cursor-pointer ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </td>

                    <td className="p-2 border">{index + 1}</td>
                    <td className="p-2 border">{capitalizeWords(fullName)}</td>
                    <td className="p-2 border">{capitalizeWords(hh.barangay)}</td>
                    <td className="p-2 border">{capitalizeWords(hh.sitio)}</td>
                    <td className="p-2 border">{hh.headSex || '-'}</td>
                    <td className="p-2 border">{hh.contactNumber || '-'}</td>
                    <td className="p-2 border">{hh.headAge || '-'}</td>

                    <td className="p-2 border print:hidden">
                      {hh.homes?.length ? (
                        <div className="flex flex-col gap-1">
                          {hh.homes.map((home, idx) => (
                            <button
                              key={`${hh.householdId}-home-${idx}`}
                              onClick={() => openMapWithLocation(hh, idx)}
                              className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700 cursor-pointer"
                              title={`View ${home.label ?? `Home ${idx + 1}`} on Map`}
                            >
                              {home.label ?? `Home ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="p-2 border space-x-2 print:hidden">
                      <button
                        onClick={() => {
                          setSelectedHouseholdId(hh.householdId);
                          setEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>

                      <button
                        onClick={async () => {
                          const confirmed = confirm('Are you sure you want to delete this household?');
                          if (!confirmed) return;
                        
                          setLoading(true);
                          try {
                            // Delete the household properly
                            await handleDeleteHousehold(hh.householdId);
                        
                            // Refresh the table
                            await fetchHouseholds();
                        
                            toast.success('Household deleted successfully.');
                          } catch (err) {
                            console.error('Error deleting household:', err);
                            toast.error('Failed to delete household.');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className={`text-red-600 hover:text-red-800 cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Delete"
                        >
                          {loading ? 'Deleting...' : <FiTrash2 />}
                      </button>
                    </td>
                  </tr>

                  <HouseholdMembersTable
                    key={`members-${hh.householdId}`}
                    isExpanded={isExpanded}
                    data={hh}
                    members={members}
                    loadingMembers={loadingMembers}
                    handleEditMember={handleEditMember}
                    handleDeleteMember={handleDeleteMember}
                    handleAddMember={handleAddMember}
                    userRole={userRole}
                  />
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-start items-center mt-4 text-sm text-gray-700 space-x-6 print:hidden">
        <div>
          <strong>Total Households:</strong> {totalHouseholds}
        </div>
        <div>
          <strong>Total Residents:</strong> {totalResidents}
        </div>
      </div>
    </div>
  );
}
