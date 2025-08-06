'use client';

import {
  FaUsers,
  FaHome,
  FaUsersCog,
  FaChartLine,
  FaWheelchair,
  FaUserClock,
  FaExclamationTriangle,
  FaCarCrash,
} from 'react-icons/fa';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/roleGuard';

// Charts (lazy load)
const BarChartComponent = dynamic(() => import('@/components/barchart'), { ssr: false });
const AgeBracketChart = dynamic(() => import('@/components/agebracket'), { ssr: false });

export default function DashboardPageWrapper() {
  return (
    <RoleGuard allowedRoles={['Secretary', 'OfficeStaff']}>
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

        const householdCount = householdSnap.size;
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
        
        //Reminder! Change it later, Dont Hard Code it.
        const hazardsCount = 8; // static or fetched if implemented

        setStats({
          residents: residentCount,
          householdHeads,
          householdMembers,
          households: actualHouseholds,
          families: actualHouseholds,
          pwd: pwdCount,
          seniors: seniorCount,
          ageCount,
          hazards: hazardsCount,
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
        <SummaryCard title="Total Residents" value={stats.residents} icon={<FaUsers />} color="bg-blue-500" loading={loading} />
        <SummaryCard title="Total Households" value={stats.households} icon={<FaHome />} color="bg-green-500" loading={loading} />
        <SummaryCard title="Total Families" value={stats.families} icon={<FaUsersCog />} color="bg-yellow-500" loading={loading} />
        <SummaryCard title="Population Growth Rate" value={stats.growthRate} icon={<FaChartLine />} color="bg-red-500" loading={loading} />
      </div>

      {/* Charts */}
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
        <BottomStat title="Total PWD" value={stats.pwd} icon={<FaWheelchair />} color="bg-blue-500" loading={loading} />
        <BottomStat title="Total Senior Citizens" value={stats.seniors} icon={<FaUserClock />} color="bg-green-500" loading={loading} />
        <BottomStat title="Total Hazards" value={stats.hazards} icon={<FaExclamationTriangle />} color="bg-yellow-500" loading={loading} />
        <BottomStat title="Total Accidents" value={stats.accidents} icon={<FaCarCrash />} color="bg-red-500" loading={loading} />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-5 h-5 border-2 border-gray border-t-transparent rounded-full animate-spin" />
  );
}

function SummaryCard({ title, value, icon, color, loading }) {
  return (
    <div className={`flex items-center p-4 rounded-xl text-white shadow ${color}`}>
      <div className="text-3xl mr-4">{icon}</div>
      <div>
        <div className="text-lg font-semibold">
          {loading ? <Spinner /> : value}
        </div>
        <div className="text-sm">{title}</div>
      </div>
    </div>
  );
}

function BottomStat({ title, value, icon, color, loading }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl shadow p-6">
      <div className="flex items-center">
        <div className={`text-xl p-2 rounded-full text-white ${color} mr-3`}>
          {icon}
        </div>
        <div>
          <div className="text-sm">{title}</div>
          <div className="text-lg font-bold">
            {loading ? <Spinner className="text-gray-200" /> : value}
          </div>
        </div>
      </div>
    </div>
  );
}
