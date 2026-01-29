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
import SummaryCard from './components/summartCard';
import BottomStat from './components/bottomStats';
import RoleGuard from '@/components/roleGuard';
import { db } from '@/firebase/config';
import { collection, getDocs, getDoc, onSnapshot, doc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/authContext';

// Lazy-loaded charts
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
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    households: 0,
    residents: 0,
    families: 0,
    pwd: 0,
    seniors: 0,
    hazards: 0,
    accidents: 0,
    growthRate: '0%',
  });

  useEffect(() => {
  if (!profile) return;

  setLoading(true);

  const unsub = onSnapshot(collection(db, 'households'), async (snapshot) => {
    let totalHouseholds = 0;
    let totalResidents = 0;
    let totalFamilies = 0;
    let totalPWD = 0;
    let totalSeniors = 0;

    const userBarangay = profile.role === 'Brgy-Secretary' ? profile.barangay?.toLowerCase() : null;

    await Promise.all(
      snapshot.docs.map(async (hhDoc) => {
        const hhId = hhDoc.id;

        // Geographic info
        const geoSnap = await getDoc(doc(db, 'households', hhId, 'geographicIdentification', 'main'));
        const geoData = geoSnap.exists() ? geoSnap.data() : {};

        if (userBarangay && (geoData.barangay?.toLowerCase() || '') !== userBarangay) return;

        const membersSnap = await getDocs(collection(db, 'households', hhId, 'members'));
        const uniqueResidentIds = new Set();
        let headFoundInMembers = false;

        // Fetch PWD info from health
        const healthSnap = await getDoc(doc(db, 'households', hhId, 'health', 'main'));
        const health = healthSnap.exists() ? healthSnap.data() : null;

        // Count PWD based on health data
        if (health?.isPWD && typeof health.pwdLineNumber === 'string') {
          totalPWD++;
        }

        for (const m of membersSnap.docs) {
          const base = m.data();
          const demoSnap = await getDoc(doc(db, 'households', hhId, 'members', m.id, 'demographicCharacteristics', 'main'));
          const demo = demoSnap.exists() ? demoSnap.data() : {};

          const rel = (demo.relationshipToHead || base.relationshipToHead || '').toLowerCase();

          if (rel === 'head') {
            headFoundInMembers = true;
            uniqueResidentIds.add(m.id);
          } else {
            uniqueResidentIds.add(m.id);
          }

          // Seniors
          if (demo.age >= 60) totalSeniors++;
        }

        if (!headFoundInMembers && geoData?.headFirstName) {
          uniqueResidentIds.add(`head-${hhId}`);
        }

        const residentCount = uniqueResidentIds.size;

        totalHouseholds++;
        totalResidents += residentCount;
        totalFamilies++;
      })
    );
      

      // Hazards
      const hazardTypes = ['Active Faults','Earthquake Induced Landslide','Ground Shaking','Landslide','Liquefaction','Rain Induced Landslide','Storm Surge','Tsunami'];
      let totalHazards = 0;
      await Promise.all(
        hazardTypes.map(async (hazard) => {
          const snap = await getDocs(collection(db, 'hazards', hazard, 'hazardInfo'));
          totalHazards += snap.size;
        })
      );

      // Accidents
      const accidentsSnap = await getDocs(collection(db, 'accidents'));

     

      setStats({
        households: totalHouseholds,
        residents: totalResidents,
        families: totalFamilies,
        pwd: totalPWD,
        seniors: totalSeniors,
        hazards: totalHazards,
        accidents: accidentsSnap.size,
        growthRate: '0%',
      });

      setLoading(false);
    });

    return () => unsub();
  }, [user, profile]);

  if (authLoading) return <div>Loading authentication...</div>;

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard title="Total Residents" value={stats.residents} icon={<FaUsers />} color="bg-blue-500" loading={loading} />
        <SummaryCard title="Total Households" value={stats.households} icon={<FaHome />} color="bg-green-500" loading={loading} />
        <SummaryCard title="Total Families" value={stats.families} icon={<FaUsersCog />} color="bg-yellow-500" loading={loading} />
        <SummaryCard title="Population Growth Rate" value={stats.growthRate} icon={<FaChartLine />} color="bg-red-500" loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow p-3">
          <h3 className="text-lg font-semibold mb-4">Residents Data</h3>
          <BarChartComponent stats={stats} /> {/* Pass stats if needed */}
        </div>
        <div className="bg-white rounded-xl shadow p-3">
          <h3 className="text-lg font-semibold mb-4">Age Bracket</h3>
          <AgeBracketChart stats={stats} /> {/* Age brackets for chart */}
        </div>
      </div>

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <BottomStat title="Total PWD" value={stats.pwd} icon={<FaWheelchair />} color="bg-blue-500" loading={loading} />
        <BottomStat title="Total Senior Citizens" value={stats.seniors} icon={<FaUserClock />} color="bg-green-500" loading={loading} />
        <BottomStat title="Total Hazards" value={stats.hazards} icon={<FaExclamationTriangle />} color="bg-yellow-500" loading={loading} />
        <BottomStat title="Total Accidents" value={stats.accidents} icon={<FaCarCrash />} color="bg-red-500" loading={loading} />
      </div>
    </div>
  );
}
