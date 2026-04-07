'use client';

import {
  FaCarCrash,
  FaChartLine,
  FaExclamationTriangle,
  FaHome,
  FaUserClock,
  FaUsers,
  FaUsersCog,
  FaWheelchair,
} from 'react-icons/fa';
import RoleGuard from '@/components/roleGuard';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/authContext';
import {
  useDashboard,
  SummaryCard,
  BottomStat,
} from '@/features/Dashboard';

const BarChart = dynamic(() => import('@/features/Dashboard/components/BarChart'), { ssr: false });
const AgeBracketChart = dynamic(() => import('@/features/Dashboard/components/AgeBracketChart'), { ssr: false });

export default function DashboardPageWrapper() {
  return (
    <RoleGuard allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin']}>
      <DashboardPage />
    </RoleGuard>
  );
}

function DashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const { loading, stats, barangayResidents, ageBracketData } = useDashboard(profile, authLoading);

  if (authLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading authentication...</div>;
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of households, residents, mapped locations, and system risk records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile?.barangay && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              Barangay: {profile.barangay}
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Role: {profile?.role || 'User'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Residents"
          value={stats.residents}
          icon={<FaUsers />}
          color="bg-blue-500"
          loading={loading}
        />
        <SummaryCard
          title="Total Households"
          value={stats.households}
          icon={<FaHome />}
          color="bg-emerald-600"
          loading={loading}
        />
        <SummaryCard
          title="Total Families"
          value={stats.families}
          icon={<FaUsersCog />}
          color="bg-teal-500"
          loading={loading}
        />
        <SummaryCard
          title="Mapped Households"
          value={stats.mapped}
          icon={<FaChartLine />}
          color="bg-slate-700"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Residents by Barangay</h3>
            <p className="text-sm text-slate-500">
              Distribution of encoded residents across barangays.
            </p>
          </div>
          <BarChart data={barangayResidents} loading={loading} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Age Bracket Distribution</h3>
            <p className="text-sm text-slate-500">
              Population grouped by age category.
            </p>
          </div>
          <AgeBracketChart data={ageBracketData} loading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <BottomStat
          title="Total PWD"
          value={stats.pwd}
          icon={<FaWheelchair />}
          color="bg-blue-500"
          loading={loading}
        />
        <BottomStat
          title="Total Senior Citizens"
          value={stats.seniors}
          icon={<FaUserClock />}
          color="bg-emerald-600"
          loading={loading}
        />
        <BottomStat
          title="Total Hazards"
          value={stats.hazards}
          icon={<FaExclamationTriangle />}
          color="bg-amber-500"
          loading={loading}
        />
        <BottomStat
          title="Total Accidents"
          value={stats.accidents}
          icon={<FaCarCrash />}
          color="bg-red-500"
          loading={loading}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-800">Demographics Overview</h3>
          <p className="text-sm text-slate-500">
            Gender distribution based on recorded resident data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Male</p>
              <p className="text-sm font-semibold text-slate-800">{stats.malePercent}%</p>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200">
              <div
                className="h-3 rounded-full bg-blue-500 transition-all"
                style={{ width: `${stats.malePercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Female</p>
              <p className="text-sm font-semibold text-slate-800">{stats.femalePercent}%</p>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200">
              <div
                className="h-3 rounded-full bg-pink-500 transition-all"
                style={{ width: `${stats.femalePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}