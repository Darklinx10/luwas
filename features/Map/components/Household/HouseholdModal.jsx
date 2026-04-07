'use client';

import { FiHome, FiMapPin, FiPhone, FiUsers, FiX } from 'react-icons/fi';
import { formatHouseholdName } from '../../utils/formatHouseholdName';

export default function HouseholdModal({
  isOpen,
  selectedHousehold,
  isMDRRMCAdmin,
  setIsModalOpen,
}) {
  if (!isOpen || !selectedHousehold || isMDRRMCAdmin) return null;

  const householdName = formatHouseholdName(selectedHousehold);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <button
          type="button"
          onClick={() => setIsModalOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close modal"
        >
          <FiX className="text-lg" />
        </button>

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              Household Marker
            </span>
          </div>

          <h2 className="mt-3 text-xl font-bold text-slate-800">
            {householdName}&apos;s Residence
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Household location and demographic summary
          </p>
        </div>

        <div className="space-y-4 p-6 text-sm text-slate-700">
          <div className="grid grid-cols-1 gap-3">
            <InfoRow icon={<FiHome />} label="Home Label" value={selectedHousehold.homeLabel || 'N/A'} />
            <InfoRow icon={<FiMapPin />} label="Barangay" value={selectedHousehold.barangay || 'N/A'} />
            <InfoRow icon={<FiMapPin />} label="Sitio" value={selectedHousehold.sitio || 'N/A'} />
            <InfoRow icon={<FiPhone />} label="Contact Number" value={selectedHousehold.contactNumber || 'N/A'} />
            <InfoRow
              icon={<FiMapPin />}
              label="Coordinates"
              value={`${selectedHousehold.lat?.toFixed(5)}, ${selectedHousehold.lng?.toFixed(5)}`}
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FiUsers />
              Demographics
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Residents" value={selectedHousehold.totalResidents || 0} />
              <StatBox label="Male" value={selectedHousehold.totalMale || 0} />
              <StatBox label="Female" value={selectedHousehold.totalFemale || 0} />
              <StatBox label="PWDs" value={selectedHousehold.totalPWDs || 0} />
              <StatBox label="Seniors" value={selectedHousehold.totalSeniors || 0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-sm text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-800">{value}</p>
    </div>
  );
}