'use client';

import RoleGuard from '@/components/roleGuard';
import HouseholdTable from './components/HouseholdTable';
import EditMemberModal from './components/edithhMemberModal';
import EditHouseholdModal from './components/editHouseholModal';
import dynamic from 'next/dynamic';
import { useHouseholdViewModel } from '@/hooks/useHouseholdViewModel';
import { useAuth } from '@/context/authContext';
import { FiSearch, FiPlus, FiUpload } from 'react-icons/fi';

const MapPopup = dynamic(() => import('../../../components/mapPopUP'), { ssr: false });

export default function HouseholdPage() {
  const { profile, loading: authLoading } = useAuth();
  const vm = useHouseholdViewModel(profile);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-6">
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

  return (
    <RoleGuard allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin']}>
      <div className="p-4">
        <div className="text-sm text-left text-gray-500 mb-2 print:hidden">Home / Households</div>

        <div id="print-section">
          <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:text-center print:font-bold print:py-2 print:rounded-none">
            Household Information
          </div>

          {/* Search + Actions */}
          <div className="flex flex-wrap items-center justify-between bg-white shadow border-t-0 px-4 py-3 gap-2 print:hidden">
            <div className="relative w-full sm:w-1/2 max-w-md">
              <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search Family Head"
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {profile?.role === 'Brgy-Secretary' && (
              <button
                onClick={vm.handleAddHouseholdClick}
                className="flex items-center gap-2 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={vm.loading}
              >
                <FiPlus />
                Add Household
              </button>
            )}

            {profile?.role === 'MDRRMC-Personnel' && (
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={vm.loading}
                >
                  Print
                </button>
                <button
                  onClick={vm.downloadCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={vm.loading}
                >
                  Download CSV
                </button>
              </div>
            )}

            {profile?.role === 'MDRRMC-Admin' && (
              <>
                <input
                  type="file"
                  accept=".csv, .json, .xlsx"
                  onChange={vm.handleUploadHouseholdData}
                  className="hidden"
                  id="importFileInput"
                  disabled={vm.loading}
                />
                <label
                  htmlFor="importFileInput"
                  className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer flex items-center gap-2 ${
                    vm.loading ? 'opacity-50 cursor-not-allowed hover:bg-green-600' : ''
                  }`}
                >
                  <FiUpload />
                  Upload Household Data
                </label>
              </>
            )}
          </div>

          {/* Upload Progress Bar */}
          {vm.progress > 0 && (
            <div className="px-4 py-2 bg-white border-t print:hidden mt-2 rounded">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
                {/* Animated bar */}
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    vm.progress === 100 ? 'bg-green-700' : 'bg-green-600 animate-[progress-stripes_1s_linear_infinite]'
                  }`}
                  style={{ width: `${vm.progress}%` }}
                >
                  {/* Optional: subtle inner glow */}
                  <div className="absolute top-0 left-0 h-3 w-full opacity-30 bg-white blur-sm" />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Uploading household data...</span>
                <span>{vm.progress}%</span>
              </div>
            </div>
          )}

          {/* Table */}
          <HouseholdTable
            loading={vm.loading}
            households={vm.households}
            filteredHouseholds={vm.filteredHouseholds}
            expandedHouseholds={vm.expandedHouseholds}
            membersData={vm.membersData}
            toggleExpanded={vm.toggleExpanded}
            handleEditMember={vm.handleEditMember}
            handleDeleteMember={vm.handleDeleteMember}
            handleDeleteHousehold={vm.handleDeleteHousehold}
            openMapWithLocation={vm.openMapWithLocation}
            loadingMembers={vm.loadingMembers}
            totalHouseholds={vm.totalHouseholds}
            totalResidents={vm.totalResidents}
            setSelectedHouseholdId={vm.setSelectedHouseholdId}
            setEditModalOpen={vm.setEditModalOpen}
            fetchHouseholds={vm.fetchHouseholds}
            handleUploadHouseholdData={vm.handleUploadHouseholdData}
            downloadCSV={vm.downloadCSV}
            setLoading={vm.setLoading}
          />
        </div>

        {/* Modals */}
        <EditMemberModal
          isOpen={vm.editMemberModal.isOpen}
          member={vm.editMemberModal.member}
          onClose={vm.closeEditMemberModal}
          onChange={vm.handleEditFieldChange}
          onSave={vm.handleSaveEditMember}
          updating={vm.editMemberModal.updating} // ✅ modal-specific
          mapRelationToCategory={vm.mapRelationToCategory}
        />

        <EditHouseholdModal
          open={vm.editHouseholdModal.open}
          householdId={vm.editHouseholdModal.householdId}
          onClose={() => vm.setEditModalOpen(false)}
          onUpdated={vm.fetchHouseholds}
        />

        <MapPopup
          isOpen={vm.mapPopup.isOpen}
          onClose={vm.closeMapPopup}
          location={vm.mapPopup.location}
        />
      </div>
    </RoleGuard>
  );
}