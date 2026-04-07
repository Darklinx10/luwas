'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/roleGuard';
import { useAuth } from '@/context/authContext';
import {
  FiDownload,
  FiHome,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiUpload,
  FiUsers,
} from 'react-icons/fi';
import { useHouseholds } from '../hooks/useHouseholds';
import HouseholdTable from './HouseholdTable';
import MapPopup from '@/components/mapPopUP';
import Pagination from './Pagination';
import UploadHouseholdsModal from './UploadHouseholdModal';

function StatCard({ title, value, icon, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{value ?? 0}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  variant = 'secondary',
  icon,
}) {
  const base =
    'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50';

  const styles =
    variant === 'primary'
      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {icon}
      {children}
    </button>
  );
}

export default function HouseholdPageContent() {
  const router = useRouter();
  const vm = useHouseholds();
  const { profile, loading: authLoading, role } = useAuth();

  const [mapPopupOpen, setMapPopupOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleMapClick = (household, location) => {
    setSelectedHousehold(household);
    setSelectedLocation({
      lat: Number(location?.latitude) || 9.9611,
      lng: Number(location?.longitude) || 124.0247,
    });
    setMapPopupOpen(true);
  };

  const handleAddMember = (householdId) => {
    router.push(`/household/edit/${householdId}#members`);
  };

  const handleEditHousehold = (household) => {
    router.push(`/household/edit/${household.householdId}`);
  };

  const handleEditMember = (householdId, member) => {
    router.push(`/household/edit/${householdId}#members`);
  };

  if (authLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading household page...</div>;
  }

  const isSecretary = profile?.role === 'Brgy-Secretary';
  const isPersonnel = profile?.role === 'MDRRMC-Personnel';
  const isAdmin = profile?.role === 'MDRRMC-Admin';

  return (
    <RoleGuard allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin']}>
      <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
        {/* Page Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Home / Households</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-800">Households</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Manage, review, and update household records used across dashboard,
                reports, and mapped household locations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile?.barangay && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                  Barangay: {profile.barangay}
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Role: {role || 'User'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Households"
            value={vm.totalHouseholds}
            icon={<FiHome size={20} />}
            subtitle="Recorded household entries"
          />
          <StatCard
            title="Total Residents"
            value={vm.totalResidents}
            icon={<FiUsers size={20} />}
            subtitle="From household member data"
          />
          <StatCard
            title="Current Page"
            value={vm.page}
            icon={<FiDownload size={20} />}
            subtitle={`Showing page ${vm.page} of ${vm.totalPages || 1}`}
          />
          <StatCard
            title="Search Scope"
            value={vm.searchInput?.trim() ? 'Filtered' : 'All'}
            icon={<FiMapPin size={20} />}
            subtitle={
              vm.searchInput?.trim()
                ? `Query: ${vm.searchInput}`
                : 'Showing all available household records'
            }
          />
        </div>

        {/* Search and Actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search household head name"
                value={vm.searchInput}
                onChange={(e) => vm.setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    vm.handleSearchSubmit(e);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {isSecretary && (
                <ToolbarButton
                  onClick={vm.handleAddHouseholdClick}
                  disabled={vm.loading}
                  variant="primary"
                  icon={<FiPlus size={16} />}
                >
                  Add Household
                </ToolbarButton>
              )}

              {isPersonnel && (
                <>
                  <ToolbarButton
                    onClick={() => window.print()}
                    disabled={vm.loading}
                    icon={<FiDownload size={16} />}
                  >
                    Print
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={vm.downloadCSV}
                    disabled={vm.loading}
                    icon={<FiDownload size={16} />}
                  >
                    Download CSV
                  </ToolbarButton>
                </>
              )}

              {isAdmin && (
                <ToolbarButton
                  onClick={vm.handleUploadHouseholdData}
                  disabled={vm.loading || vm.submitting}
                  variant="primary"
                  icon={<FiUpload size={16} />}
                >
                  Upload Household Data
                </ToolbarButton>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div
          id="print-section"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Household Information
                </h2>
                <p className="text-sm text-slate-500">
                  Review encoded household records, members, and mapped locations.
                </p>
              </div>

              <div className="mt-2 md:mt-0">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {vm.loading ? 'Loading records...' : `${vm.households?.length || 0} records on this page`}
                </span>
              </div>
            </div>
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
            role={role}
          />

          <div className="border-t border-slate-200 px-4 py-4">
            <Pagination
              page={vm.page}
              totalPages={vm.totalPages}
              onFirst={() => vm.setPage(1)}
              onPrev={() => vm.setPage((prev) => Math.max(prev - 1, 1))}
              onNext={() => vm.setPage((prev) => Math.min(prev + 1, vm.totalPages))}
              onLast={() => vm.setPage(vm.totalPages)}
              onPageSelect={(value) => vm.setPage(value)}
            />
          </div>
        </div>

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
          household={selectedHousehold}
        />
      </div>
    </RoleGuard>
  );
}