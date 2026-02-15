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
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/authContext';
import { collection, getDocs, getDoc, query, orderBy, startAfter, limit, doc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

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
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [barangayResidents, setBarangayResidents] = useState([]);
  const [ageBracketData, setAgeBracketData] = useState([]);

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
    if (authLoading || !profile) return;

    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const batchSize = 500;
        let lastDoc = null;

        let totalHouseholds = 0;
        let totalResidents = 0;
        let totalFamilies = 0;
        let totalPWD = 0;
        let totalSeniors = 0;

        const barangayCounts = {};
        const ageCounts = {
          'Under 1': 0, '1-4': 0, '5-9': 0, '10-14': 0, '15-19': 0,
          '20-24': 0, '25-29': 0, '30-34': 0, '35-39': 0, '40-44': 0,
          '45-49': 0, '50-54': 0, '55-59': 0, '60 and over': 0,
        };

        const userBarangay =
          profile.role === 'Brgy-Secretary' ? profile.barangay?.toLowerCase() : null;

        const countAge = (age) => {
          if (!age) return;
          const a = parseInt(age);
          if (isNaN(a)) return;
          if (a < 1) ageCounts['Under 1']++;
          else if (a <= 4) ageCounts['1-4']++;
          else if (a <= 9) ageCounts['5-9']++;
          else if (a <= 14) ageCounts['10-14']++;
          else if (a <= 19) ageCounts['15-19']++;
          else if (a <= 24) ageCounts['20-24']++;
          else if (a <= 29) ageCounts['25-29']++;
          else if (a <= 34) ageCounts['30-34']++;
          else if (a <= 39) ageCounts['35-39']++;
          else if (a <= 44) ageCounts['40-44']++;
          else if (a <= 49) ageCounts['45-49']++;
          else if (a <= 54) ageCounts['50-54']++;
          else if (a <= 59) ageCounts['55-59']++;
          else ageCounts['60 and over']++;
        };

        while (!cancelled) {
          const q = lastDoc
            ? query(collection(db, 'households'), orderBy('__name__'), startAfter(lastDoc), limit(batchSize))
            : query(collection(db, 'households'), orderBy('__name__'), limit(batchSize));

          const snapshot = await getDocs(q);
          if (cancelled || snapshot.empty) break;

          lastDoc = snapshot.docs[snapshot.docs.length - 1];

          await Promise.all(snapshot.docs.map(async (hhDoc) => {
            if (cancelled) return;

            const hhId = hhDoc.id;
            const geoSnap = await getDoc(doc(db, 'households', hhId, 'geographicIdentification', 'main'));
            const geoData = geoSnap.exists() ? geoSnap.data() : {};
            const barangayKey = geoData.barangay?.toLowerCase();
            if (userBarangay && barangayKey !== userBarangay) return;

            const membersSnap = await getDocs(collection(db, 'households', hhId, 'members'));
            const healthSnap = await getDoc(doc(db, 'households', hhId, 'health', 'main'));
            const health = healthSnap.exists() ? healthSnap.data() : null;

            const uniqueResidentIds = new Set();
            let headFound = false;

            await Promise.all(membersSnap.docs.map(async (mDoc) => {
              if (cancelled) return;
              const memberId = mDoc.id;
              const base = mDoc.data();
              const demoSnap = await getDoc(doc(db, 'households', hhId, 'members', memberId, 'demographicCharacteristics', 'main'));
              const demo = demoSnap.exists() ? demoSnap.data() : {};

              const rel = (demo.relationshipToHead || base.relationshipToHead || '').toLowerCase();
              if (rel === 'head') headFound = true;

              uniqueResidentIds.add(memberId);

              if (demo.age >= 60) totalSeniors++;
              countAge(demo.age);
            }));

            // If no head in members, check geoData
            if (!headFound && geoData?.headFirstName) {
              uniqueResidentIds.add(`head-${hhId}`);
            }

            const residentCount = uniqueResidentIds.size;
            if (residentCount > 0 || geoData?.headFirstName || geoData?.barangay) {
              totalHouseholds++;
              totalResidents += residentCount;
              totalFamilies++;
              if (health?.isPWD) totalPWD++;
              if (barangayKey) {
                barangayCounts[barangayKey] = (barangayCounts[barangayKey] || 0) + residentCount;
              }
            }
          }));
        }

        // Fetch hazards & accidents concurrently
        const hazardTypes = ['Active Faults','Earthquake Induced Landslide','Ground Shaking','Landslide','Liquefaction','Rain Induced Landslide','Storm Surge','Tsunami'];
        const hazardSnaps = await Promise.all(hazardTypes.map(h => getDocs(collection(db, 'hazards', h, 'hazardInfo'))));
        const totalHazards = hazardSnaps.reduce((sum, snap) => sum + snap.size, 0);
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

        setBarangayResidents(
          Object.entries(barangayCounts)
            .map(([name, residents]) => ({ name, residents }))
            .sort((a, b) => b.residents - a.residents)
        );

        setAgeBracketData(
          Object.entries(ageCounts).map(([age, count]) => ({ age, count }))
        );

      } catch (err) {
        if (!cancelled) console.error('❌ Dashboard fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => { cancelled = true; };
  }, [authLoading, profile]);

  if (authLoading) return <div>Loading authentication...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard title="Total Residents" value={stats.residents} icon={<FaUsers />} color="bg-blue-500" loading={loading} />
        <SummaryCard title="Total Households" value={stats.households} icon={<FaHome />} color="bg-green-500" loading={loading} />
        <SummaryCard title="Total Families" value={stats.families} icon={<FaUsersCog />} color="bg-yellow-500" loading={loading} />
        <SummaryCard title="Population Growth Rate" value={stats.growthRate} icon={<FaChartLine />} color="bg-red-500" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow p-3">
          <h3 className="text-lg font-semibold mb-4">Residents Data</h3>
          <BarChartComponent data={barangayResidents} loading={loading} />
        </div>
        <div className="bg-white rounded-xl shadow p-3">
          <h3 className="text-lg font-semibold mb-4">Age Bracket</h3>
          <AgeBracketChart data={ageBracketData} loading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <BottomStat title="Total PWD" value={stats.pwd} icon={<FaWheelchair />} color="bg-blue-500" loading={loading} />
        <BottomStat title="Total Senior Citizens" value={stats.seniors} icon={<FaUserClock />} color="bg-green-500" loading={loading} />
        <BottomStat title="Total Hazards" value={stats.hazards} icon={<FaExclamationTriangle />} color="bg-yellow-500" loading={loading} />
        <BottomStat title="Total Accidents" value={stats.accidents} icon={<FaCarCrash />} color="bg-red-500" loading={loading} />
      </div>
    </div>
  );
}