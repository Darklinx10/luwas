"use client";

import {
  FaUsers,
  FaHome,
  FaUsersCog,
  FaChartLine,
  FaWheelchair,
  FaUserClock,
  FaExclamationTriangle,
  FaBirthdayCake,
} from "react-icons/fa";
import dynamic from "next/dynamic";

// Dynamically import chart libraries (if using Recharts/Chart.js/etc.)
const BarChartComponent = dynamic(() => import("@/components/barchart"), { ssr: false });
const AgeBracketChart = dynamic(() => import("@/components/agebracket"), { ssr: false });

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Residents" value="1234" icon={<FaUsers />} color="bg-blue-500" />
        <SummaryCard title="Total Households" value="1234" icon={<FaHome />} color="bg-green-500" />
        <SummaryCard title="Total Families" value="1234" icon={<FaUsersCog />} color="bg-yellow-500" />
        <SummaryCard title="Population Growth Rate" value="12.34%" icon={<FaChartLine />} color="bg-red-500" />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Residents Chart */}
        <div className="col-span-2 bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Residents Data</h3>
          <BarChartComponent />
        </div>

        {/* Right - Age Bracket Chart */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Age Bracket</h3>
          <AgeBracketChart />
        </div>
      </div>

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BottomStat title="Total PWD" value="1234" icon={<FaWheelchair />} color="bg-blue-500" />
        <BottomStat title="Total Senior Citizens" value="1234" icon={<FaUserClock />} color="bg-green-500" />
        <BottomStat title="Total Hazards" value="1234" icon={<FaExclamationTriangle />} color="bg-yellow-500" />
        <BottomStat title="Total Age" value="1234" icon={<FaBirthdayCake />} color="bg-red-500" />
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, icon, color }) {
  return (
    <div className={`flex items-center p-4 rounded-xl text-white shadow ${color}`}>
      <div className="text-3xl mr-4">{icon}</div>
      <div>
        <div className="text-lg font-semibold">{value}</div>
        <div className="text-sm">{title}</div>
      </div>
    </div>
  );
}

// Bottom Stats Card Component
function BottomStat({ title, value, icon, color }) {
  return (
    <div className="flex items-center justify-between bg-white border rounded-xl shadow p-4">
      <div className="flex items-center">
        <div className={`text-xl p-2 rounded-full text-white ${color} mr-3`}>{icon}</div>
        <div>
          <div className="text-sm">{title}</div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}
