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

import BottomStat from './components/bottomStats';
import SummaryCard from './components/summartCard';
import RoleGuard from '@/components/roleGuard';
import { auth, db } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Charts (lazy load)
const BarChartComponent = dynamic(() => import('./components/barchart'), { ssr: false });
const AgeBracketChart = dynamic(() => import('./components/agebracket'), { ssr: false });

export default function DashboardPageWrapper() {
  return (
    <RoleGuard allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel']}>
      <DashboardPage />
    </RoleGuard>
  );
}

function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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
    accidents: 0,
    growthRate: '0%',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn('🚫 Not authenticated, redirecting to login...');
        router.push('/login');
        return;
      }

      try {
        const [householdSnap, accidentsSnap] = await Promise.all([
          getDocs(collection(db, 'households')),
          getDocs(collection(db, 'accidents')),
        ]);

        let residentCount = 0;
        let householdHeads = 0;
        let householdMembers = 0;
        let pwdCount = 0;
        let seniorCount = 0;
        let ageCount = 0;
        let actualHouseholds = 0;

        await Promise.all(
          householdSnap.docs.map(async (householdDoc) => {
            const householdId = householdDoc.id;

            const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
            const geoSnapPromise = getDoc(geoDocRef);
            const membersSnapPromise = getDocs(collection(db, 'households', householdId, 'members'));
            const healthSnapPromise = getDocs(collection(db, 'households', householdId, 'health'));
            const mainHealthDocPromise = getDoc(doc(db, 'households', householdId, 'health', 'main'));

            const [geoSnap, membersSnap, healthSnap, mainHealthDoc] = await Promise.all([
              geoSnapPromise,
              membersSnapPromise,
              healthSnapPromise,
              mainHealthDocPromise,
            ]);

            const geoData = geoSnap.exists() ? geoSnap.data() : {};
            const headAge = parseInt(geoData.headAge);

            // Only count as valid household if there's a valid headAge
            if (!isNaN(headAge)) {
              actualHouseholds++;
              householdHeads++;
              ageCount += headAge;
            }

            const healthMap = new Map(healthSnap.docs.map((h) => [h.id, h.data()]));

            if (mainHealthDoc.exists()) {
              const mainHealth = mainHealthDoc.data();
              if (mainHealth?.isPWD === true) pwdCount++;
            }

            residentCount += membersSnap.size;
            householdMembers += membersSnap.size;

            const demoSnaps = await Promise.all(
              membersSnap.docs.map((memberDoc) =>
                getDoc(doc(db, 'households', householdId, 'members', memberDoc.id, 'demographicCharacteristics', 'main'))
              )
            );

            demoSnaps.forEach((demoSnap, idx) => {
              if (demoSnap.exists()) {
                const demo = demoSnap.data();
                const age = parseInt(demo.age);
                if (!isNaN(age)) {
                  ageCount += age;
                  if (age >= 60) seniorCount++;
                }

                const health = healthMap.get(membersSnap.docs[idx].id);
                if (health?.isPWD === true) pwdCount++;
              }
            });
          })
        );
        
        // ✅ Calculate total hazards dynamically
      const hazardTypes = [
        "Active Faults",
        "Earthquake Induced Landslide",
        "Ground Shaking",
        "Landslide",
        "Liquefaction",
        "Rain Induced Landslide",
        "Storm Surge",
        "Tsunami",
      ];

      let totalHazards = 0;
      await Promise.all(
        hazardTypes.map(async (hazardType) => {
          const snap = await getDocs(collection(db, 'hazards', hazardType, 'hazardInfo'));
          totalHazards += snap.size;
        })
      );

      setStats({
        residents: residentCount,
        householdHeads,
        householdMembers,
        households: actualHouseholds,
        families: actualHouseholds,
        pwd: pwdCount,
        seniors: seniorCount,
        ageCount,
        hazards: totalHazards, // dynamically set
        accidents: accidentsSnap.size,
        growthRate: '0%',
      });
    } catch (err) {
      console.error('🔥 Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  });

  return () => unsubscribe();
}, [router]);

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
        <SummaryCard title="Total Residents" value={stats.residents} icon={<FaUsers />} color="bg-blue-500" loading={loading} />
        <SummaryCard title="Total Households" value={stats.households} icon={<FaHome />} color="bg-green-500" loading={loading} />
        <SummaryCard title="Total Families" value={stats.families} icon={<FaUsersCog />} color="bg-yellow-500" loading={loading} />
        <SummaryCard
        title="Population Growth Rate"
        value={stats.growthRate}
        icon={<FaChartLine />}
        color="bg-red-500"
        loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow p-3">
          <h3 className="text-lg font-semibold mb-4">Residents Data</h3>
          <BarChartComponent />
        </div>
        <div className="bg-white rounded-xl shadow p-3">
          <h3 className="text-lg font-semibold mb-4">Age Bracket</h3>
          <AgeBracketChart />
        </div>
      </div>

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 ">
        <BottomStat title="Total PWD" value={stats.pwd} icon={<FaWheelchair />} color="bg-blue-500" loading={loading} />
        <BottomStat title="Total Senior Citizens" value={stats.seniors} icon={<FaUserClock />} color="bg-green-500" loading={loading} />
        <BottomStat title="Total Hazards" value={stats.hazards} icon={<FaExclamationTriangle />} color="bg-yellow-500" loading={loading} />
        <BottomStat title="Total Accidents" value={stats.accidents} icon={<FaCarCrash />} color="bg-red-500" loading={loading} />
      </div>
    </div>
  );
}