'use client';

import {
  FaUsers,
  FaHome,
  FaUsersCog,
  FaChartLine,
  FaWheelchair,
  FaUserClock,
  FaExclamationTriangle,
  FaBirthdayCake,
} from 'react-icons/fa';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { collection, collectionGroup, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';

const BarChartComponent = dynamic(() => import('@/components/barchart'), { ssr: false });
const AgeBracketChart = dynamic(() => import('@/components/agebracket'), { ssr: false });

export default function DashboardPage() {
  const [stats, setStats] = useState({
    residents: 0,
    householdHeads: 0,
    householdMembers: 0,
    households: 0,
    families: 0,
    pwd: 0,
    seniors: 0,
    ageCount: 0,
    hazards: 0,
    growthRate: '0%',
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const householdSnap = await getDocs(collection(db, 'households'));
        const householdCount = householdSnap.size;

        let residentCount = 0;
        let householdHeads = 0;
        let householdMembers = 0;
        let pwdCount = 0;
        let seniorCount = 0;
        let ageCount= 0;

        for (const householdDoc of householdSnap.docs) {
          const householdId = householdDoc.id;

          // 🧠 Fetch geo data for household head
          const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
          const geoSnap = await getDoc(geoDocRef);
          const geoData = geoSnap.exists() ? geoSnap.data() : {};
          const headAge = parseInt(geoData.headAge);

          residentCount++;
          householdHeads++;

          if (!isNaN(headAge)) {
            ageCount += headAge;
            if (headAge >= 60) seniorCount++;
          }

          const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));
          const healthSnap = await getDocs(collection(db, 'households', householdId, 'health'));
          const healthMap = new Map(healthSnap.docs.map((h) => [h.id, h.data()]));

          // ✅ Count PWD if `isPWD === true` in health/main
          try {
            const mainHealthDoc = await getDoc(doc(db, 'households', householdId, 'health', 'main'));
            if (mainHealthDoc.exists()) {
              const mainHealth = mainHealthDoc.data();
              if (mainHealth?.isPWD === true) {
                pwdCount++;
              }
            }
          } catch (e) {
            console.warn(`⚠️ No main health document for household ${householdId}`);
          }

          // Count members
          residentCount += membersSnap.size;
          householdMembers += membersSnap.size;

          // Loop through members for senior count + age
          for (const memberDoc of membersSnap.docs) {
            const memberId = memberDoc.id;

            const demoSnap = await getDoc(doc(db, 'households', householdId, 'members', memberId, 'demographicCharacteristics', 'main'));
            const demo = demoSnap.exists() ? demoSnap.data() : {};
            const age = parseInt(demo.age);

            if (!isNaN(age)) {
              ageCount += age;
              if (age >= 60) seniorCount++;
            }

            const health = healthMap.get(memberId);
            if (health?.isPWD === true) {
              pwdCount++;
            }
          }
        }


        // ✅ Hazards count from any `hazards` collection
        let hazardsCount = 0;
        try {
          const hazardSnap = await getDocs(collectionGroup(db, 'hazards'));
          hazardsCount = hazardSnap.size;
        } catch (e) {
          console.warn('No hazards collection found.');
        }

        setStats({
          residents: residentCount,
          householdHeads,
          householdMembers,
          households: householdCount,
          families: householdCount,
          pwd: pwdCount,
          seniors: seniorCount,
          ageCount: residentCount,
          hazards: hazardsCount,
          growthRate: '0%',
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchStats();
  }, []);


  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
        <SummaryCard title="Total Residents" value={stats.residents} icon={<FaUsers />} color="bg-blue-500" />
        <SummaryCard title="Total Households" value={stats.households} icon={<FaHome />} color="bg-green-500" />
        <SummaryCard title="Total Families" value={stats.families} icon={<FaUsersCog />} color="bg-yellow-500" />
        <SummaryCard title="Population Growth Rate" value={stats.growthRate} icon={<FaChartLine />} color="bg-red-500" />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Residents Data</h3>
          <BarChartComponent />
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Age Bracket</h3>
          <AgeBracketChart />
        </div>
      </div>

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BottomStat title="Total PWD" value={stats.pwd} icon={<FaWheelchair />} color="bg-blue-500" />
        <BottomStat title="Total Senior Citizens" value={stats.seniors} icon={<FaUserClock />} color="bg-green-500" />
        <BottomStat title="Total Hazards" value={stats.hazards} icon={<FaExclamationTriangle />} color="bg-yellow-500" />
        <BottomStat title="Total Age" value={stats.ageCount} icon={<FaBirthdayCake />} color="bg-red-500" />
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
    <div className="flex items-center justify-between bg-white rounded-xl shadow p-6">
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
