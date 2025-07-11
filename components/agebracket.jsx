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
import { collection, getDocs } from 'firebase/firestore';

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

        for (const householdDoc of householdSnapshot.docs) {
          const householdId = householdDoc.id;
          const demoSnap = await getDocs(
            collection(db, 'households', householdId, 'demographicCharacteristics')
          );

          demoSnap.forEach((doc) => {
            const data = doc.data();
            const rawAge = parseInt(data.age);

            if (!isNaN(rawAge)) {
              if (rawAge < 1) ageCounts['Under 1']++;
              else if (rawAge <= 4) ageCounts['1-4']++;
              else if (rawAge <= 9) ageCounts['5-9']++;
              else if (rawAge <= 14) ageCounts['10-14']++;
              else if (rawAge <= 19) ageCounts['15-19']++;
              else if (rawAge <= 24) ageCounts['20-24']++;
              else if (rawAge <= 29) ageCounts['25-29']++;
              else if (rawAge <= 34) ageCounts['30-34']++;
              else if (rawAge <= 39) ageCounts['35-39']++;
              else if (rawAge <= 44) ageCounts['40-44']++;
              else if (rawAge <= 49) ageCounts['45-49']++;
              else if (rawAge <= 54) ageCounts['50-54']++;
              else if (rawAge <= 59) ageCounts['55-59']++;
              else ageCounts['60 and over']++;
            }
          });
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
