'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function AgeBracketChart() {
  const [ageData, setAgeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgeBrackets = async () => {
      setLoading(true);
      try {
        const householdSnapshot = await getDocs(collection(db, 'households'));

        const ageCounts = {
          'Under 1': 0,
          '1-4': 0,
          '5-9': 0,
          '10-14': 0,
          '15-19': 0,
          '20-24': 0,
          '25-29': 0,
          '30-34': 0,
          '35-39': 0,
          '40-44': 0,
          '45-49': 0,
          '50-54': 0,
          '55-59': 0,
          '60 and over': 0,
        };

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

        await Promise.all(
          householdSnapshot.docs.map(async (householdDoc) => {
            const householdId = householdDoc.id;

            const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
            const membersRef = collection(db, 'households', householdId, 'members');

            const [geoSnap, membersSnap] = await Promise.all([
              getDoc(geoRef),
              getDocs(membersRef),
            ]);

            if (geoSnap.exists()) {
              const geoData = geoSnap.data();
              countAge(geoData.headAge);
            }

            await Promise.all(
              membersSnap.docs.map(async (memberDoc) => {
                const demoRef = doc(
                  db,
                  'households',
                  householdId,
                  'members',
                  memberDoc.id,
                  'demographicCharacteristics',
                  'main'
                );

                const demoSnap = await getDoc(demoRef);

                if (demoSnap.exists()) {
                  const demoData = demoSnap.data();
                  countAge(demoData.age);
                }
              })
            );
          })
        );

        const formatted = Object.entries(ageCounts).map(([age, count]) => ({ age, count }));
        setAgeData(formatted);
      } catch (error) {
        console.error('Error fetching age data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgeBrackets();
  }, []);

  if (loading) return <Spinner />;

  const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#9333ea", "#14b8a6", "#6366f1"];

  return (
    <ResponsiveContainer width="100%" height={500} >
      <BarChart
        layout="vertical"
        data={ageData}
        margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="age" type="category" width={80} />
        <Tooltip formatter={(value) => [`${value} residents`, "Age Bracket"]} />
        <Bar dataKey="count">
          {ageData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <svg
        className="animate-spin h-8 w-8 text-green-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8z"
        />
      </svg>
    </div>
  );
}
