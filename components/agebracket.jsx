'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function AgeBracketChart() {
  const [ageData, setAgeData] = useState([]);

  useEffect(() => {
    const fetchAgeBrackets = async () => {
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

        // Helper function to categorize and count an age
        const countAge = (age) => {
          if (age === undefined || age === '') return;
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

        for (const householdDoc of householdSnapshot.docs) {
          const householdId = householdDoc.id;

          // ✅ Geographic headAge
          const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
          const geoSnap = await getDoc(geoRef);
          if (geoSnap.exists()) {
            const geoData = geoSnap.data();
            countAge(geoData.headAge);
          }

          // ✅ Loop members
          const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));
          for (const memberDoc of membersSnap.docs) {
            const memberId = memberDoc.id;

            const demoRef = doc(
              db,
              'households',
              householdId,
              'members',
              memberId,
              'demographicCharacteristics',
              'main'
            );
            const demoSnap = await getDoc(demoRef);
            if (demoSnap.exists()) {
              const demoData = demoSnap.data();
              countAge(demoData.age);
            }
          }
        }



        const formatted = Object.entries(ageCounts).map(([age, count]) => ({ age, count }));
        setAgeData(formatted);
      } catch (error) {
        console.error('Error fetching age data:', error);
      }
    };

    fetchAgeBrackets();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart
        layout="vertical"
        data={ageData}
        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="age" type="category" />
        <Tooltip />
        <Bar dataKey="count" fill="#fbbf24" />
      </BarChart>
    </ResponsiveContainer>
  );
}
