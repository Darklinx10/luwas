'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/roleGuard';
import { useAuth } from '@/context/authContext';
import { FiPlus, FiSearch, FiUpload } from 'react-icons/fi';
import { useHouseholds } from '../hooks/useHouseholds';
import HouseholdTable from './HouseholdTable';
import MapPopup from '@/components/mapPopUP';
import Pagination from './Pagination';
import UploadHouseholdsModal from './UploadHouseholdModal';

export default function HouseholdPageContent() {
  const router = useRouter();
  const vm = useHouseholds();
  const { profile, loading: authLoading, role } = useAuth(); // ✅ Get role from useAuth
  
  // Map popup state
  const [mapPopupOpen, setMapPopupOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleMapClick = (household, location) => {
    setSelectedHousehold(household);
    setSelectedLocation({
      lat: Number(location.latitude) || 9.9611,
      lng: Number(location.longitude) || 124.0247,
    });
    setMapPopupOpen(true);
  };

  const handleAddMember = (householdId) => {
    // Navigate to household edit form to add member in demographic section
    router.push(`/household/edit/${householdId}#members`);
  };

  const handleEditHousehold = (household) => {
    router.push(`/household/edit/${household.householdId}`);
  };

  const handleEditMember = (householdId, member) => {
    // Navigate to household edit form to edit member in demographic section
    router.push(`/household/edit/${householdId}#members`);
  };
  return (
    <RoleGuard allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin']}>
      <div className="p-2">
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
                value={vm.searchInput}
                onChange={(e) => vm.setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    vm.handleSearchSubmit(e);
                  }
                }}
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
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={vm.loading}
                >
                  Print
                </button>
                <button
                  onClick={vm.downloadCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={vm.loading}
                >
                  Download CSV
                </button>
              </div>
            )}

            {profile?.role === 'MDRRMC-Admin' && (
              <>
                <button
                  onClick={vm.handleUploadHouseholdData}
                  disabled={vm.loading || vm.submitting}
                  className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer flex items-center gap-2 ${
                    vm.loading || vm.submitting ? 'disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600' : ''
                  }`}
                >
                  <FiUpload />
                  Upload Household Data
                </button>
              </>
            )}
          </div>

        

   

          <HouseholdTable
            loading={vm.loading}
            households={vm.households}
            expandedHouseholds={vm.expandedHouseholds}
            toggleExpanded={vm.toggleExpanded}
            membersData={vm.membersData}
            loadingMembers={vm.loadingMembers}
            handleEditMember={handleEditMember}
            handleDeleteMember={vm.handleDeleteMember}
            handleDeleteHousehold={vm.handleDeleteHousehold}
            handleEditHousehold={handleEditHousehold}
            handleAddMember={handleAddMember}
            onMapClick={handleMapClick}
            totalHouseholds={vm.totalHouseholds}
            totalResidents={vm.totalResidents}
            page={vm.page}
            pageSize={10}
            role={role} // ✅ Pass role prop for action visibility
          />

          <Pagination
            page={vm.page}
            totalPages={vm.totalPages}
            onFirst={() => vm.setPage(1)}
            onPrev={() => vm.setPage((prev) => Math.max(prev - 1, 1))}
            onNext={() => vm.setPage((prev) => Math.min(prev + 1, vm.totalPages))}
            onLast={() => vm.setPage(vm.totalPages)}
            onPageSelect={(value) => vm.setPage(value)}
          />

          <UploadHouseholdsModal
            isOpen={vm.uploadModalOpen}
            onClose={() => vm.setUploadModalOpen(false)}
            onUploadSuccess={vm.handleUploadSuccess}
          />

          <MapPopup
            isOpen={mapPopupOpen}
            onClose={() => setMapPopupOpen(false)}
            location={selectedLocation}
            readOnly={true}
            mode="household"
          />
        </div>
      </div>
    </RoleGuard>
  );
}