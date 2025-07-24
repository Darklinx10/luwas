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

// Dynamically load charts to avoid SSR issues
const BarChartComponent = dynamic(() => import('@/components/barchart'), { ssr: false });
const AgeBracketChart = dynamic(() => import('@/components/agebracket'), { ssr: false });

export default function DashboardPage() {
  // Initial state to store statistics
  const [stats, setStats] = useState({
    residents: 0,
    householdHeads: 0,
    householdMembers: 0,
    households: 0,
    families: 0,
    pwd: 0,
    seniors: 0,
    ageCount: 0, // total combined age
    hazards: 0,
    growthRate: '0%',
  });

  useEffect(() => {
    // Fetch statistics from Firestore
    const fetchStats = async () => {
      try {
        const householdSnap = await getDocs(collection(db, 'households'));
        const householdCount = householdSnap.size;

        // Tracking variables
        let residentCount = 0;
        let householdHeads = 0;
        let householdMembers = 0;
        let pwdCount = 0;
        let seniorCount = 0;
        let ageCount = 0;

        for (const householdDoc of householdSnap.docs) {
          const householdId = householdDoc.id;

          // Get head of household data (age)
          const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
          const geoSnap = await getDoc(geoDocRef);
          const geoData = geoSnap.exists() ? geoSnap.data() : {};
          const headAge = parseInt(geoData.headAge);

         
          householdHeads++;

          if (!isNaN(headAge)) {
            ageCount += headAge;
            
          }

          // Fetch household members
          const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));

          // Fetch health data
          const healthSnap = await getDocs(collection(db, 'households', householdId, 'health'));
          const healthMap = new Map(healthSnap.docs.map((h) => [h.id, h.data()]));

          // Check if head is PWD
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

          // Update member counts
          residentCount += membersSnap.size;
          householdMembers += membersSnap.size;

          // Loop through members to check age, seniors, and PWD
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

        // Count total hazards from all nested "hazards" collections
        //let hazardsCount = 0;
        //try {
         // const hazardSnap = await getDocs(collectionGroup(db, 'hazards'));
         // hazardsCount = hazardSnap.size;
        //} catch (e) {
        //  console.warn('No hazards collection found.');
        //}
        const hazardsCount = 0;

        // Update state with collected stats
        setStats({
          residents: residentCount,
          householdHeads,
          householdMembers,
          households: householdCount,
          families: householdCount, // currently same as households
          pwd: pwdCount,
          seniors: seniorCount,
          ageCount: residentCount, // note: should be total age if renamed
          hazards: hazardsCount,
          growthRate: '0%', // static for now
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchStats();
  }, []); // only runs once on page load


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

//  Reusable Summary Card component
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

//  Reusable Bottom Stat Card
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
