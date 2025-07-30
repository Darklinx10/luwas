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
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Dynamically load charts
const BarChartComponent = dynamic(() => import('@/components/barchart'), { ssr: false });
const AgeBracketChart = dynamic(() => import('@/components/agebracket'), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();

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

  // Auth + Data Fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn('🚫 Not authenticated, redirecting to login...');
        router.push('/login');
        return;
      }

      try {
        const householdSnap = await getDocs(collection(db, 'households'));
        const householdCount = householdSnap.size;

        let residentCount = 0;
        let householdHeads = 0;
        let householdMembers = 0;
        let pwdCount = 0;
        let seniorCount = 0;
        let ageCount = 0;

        for (const householdDoc of householdSnap.docs) {
          const householdId = householdDoc.id;

          const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
          const geoSnap = await getDoc(geoDocRef);
          const geoData = geoSnap.exists() ? geoSnap.data() : {};
          const headAge = parseInt(geoData.headAge);

          householdHeads++;
          if (!isNaN(headAge)) {
            ageCount += headAge;
          }

          const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));
          const healthSnap = await getDocs(collection(db, 'households', householdId, 'health'));
          const healthMap = new Map(healthSnap.docs.map((h) => [h.id, h.data()]));

          try {
            const mainHealthDoc = await getDoc(doc(db, 'households', householdId, 'health', 'main'));
            if (mainHealthDoc.exists()) {
              const mainHealth = mainHealthDoc.data();
              if (mainHealth?.isPWD === true) {
                pwdCount++;
              }
            }
          } catch {
            console.warn(`⚠️ Missing health doc for household ${householdId}`);
          }

          residentCount += membersSnap.size;
          householdMembers += membersSnap.size;

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

        // Set dummy hazard count for now (or replace with actual query if needed)
        const hazardsCount = 8;

        setStats({
          residents: residentCount,
          householdHeads,
          householdMembers,
          households: householdCount,
          families: householdCount,
          pwd: pwdCount,
          seniors: seniorCount,
          ageCount,
          hazards: hazardsCount,
          growthRate: '30%', // Example static
        });
      } catch (err) {
        console.error('🔥 Error fetching dashboard stats:', err);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
        <SummaryCard title="Total Residents" value={stats.residents} icon={<FaUsers />} color="bg-blue-500" />
        <SummaryCard title="Total Households" value={stats.households} icon={<FaHome />} color="bg-green-500" />
        <SummaryCard title="Total Families" value={stats.families} icon={<FaUsersCog />} color="bg-yellow-500" />
        <SummaryCard title="Population Growth Rate" value={stats.growthRate} icon={<FaChartLine />} color="bg-red-500" />
      </div>

      {/* Charts Section */}
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

// Reusable summary card
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

// Reusable bottom stat
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
