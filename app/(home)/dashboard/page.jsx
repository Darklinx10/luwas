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
  Spinner,
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

  if (authLoading) return <div className="p-8">Loading authentication...</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          color="bg-green-500"
          loading={loading}
        />
        <SummaryCard
          title="Total Families"
          value={stats.families}
          icon={<FaUsersCog />}
          color="bg-yellow-500"
          loading={loading}
        />
        <SummaryCard
          title="Mapped Households"
          value={stats.mapped}
          icon={<FaChartLine />}
          color="bg-purple-500"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barangay Residents Chart */}
        <div className="bg-white rounded-xl shadow p-3">
          <h3 className="text-lg font-semibold mb-4">Residents by Barangay</h3>
          <BarChart data={barangayResidents} loading={loading} />
        </div>

        {/* Age Bracket Chart */}
        <div className="bg-white rounded-xl shadow p-3">
          <h3 className="text-lg font-semibold mb-4">Age Bracket Distribution</h3>
          <AgeBracketChart data={ageBracketData} loading={loading} />
        </div>
      </div>

      {/* Demographics and Hazards Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
          color="bg-green-500"
          loading={loading}
        />
        <BottomStat
          title="Total Hazards"
          value={stats.hazards}
          icon={<FaExclamationTriangle />}
          color="bg-yellow-500"
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

      {/* Demographics Info */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Demographics Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 mb-2">Male: {stats.malePercent}%</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${stats.malePercent}%` }}
              ></div>
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-2">Female: {stats.femalePercent}%</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-pink-500 h-3 rounded-full transition-all"
                style={{ width: `${stats.femalePercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}