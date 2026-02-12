'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';

export default function PWDTable({ title, barangay: filterBarangay = null }) {
  const [pwds, setPwds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPWD, setSelectedPWD] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchPWDs = async () => {
      setLoading(true);
      try {
        const householdsSnap = await getDocs(collection(db, 'households'));

        const allData = await Promise.all(
          householdsSnap.docs.map(async (householdDoc) => {
            const householdId = householdDoc.id;

            const geoSnap = await getDoc(
              doc(db, 'households', householdId, 'geographicIdentification', 'main')
            );
            const healthSnap = await getDoc(
              doc(db, 'households', householdId, 'health', 'main')
            );

            const geoData = geoSnap.exists() ? geoSnap.data() : {};
            const health = healthSnap.exists() ? healthSnap.data() : null;

            if (!health?.isPWD || typeof health.pwdLineNumber !== 'string')
              return null;

            const lineNumber = health.pwdLineNumber;

            const barangay = geoData?.barangay || '—';
            const sitio = geoData?.sitio || '—';

            let name = '—',
              age = '—',
              sex = '—',
              contact = '—';

            if (lineNumber === 'head') {
              const demoSnap = await getDoc(
                doc(db, 'households', householdId, 'demographicCharacteristics', 'main')
              );
              const demo = demoSnap.exists() ? demoSnap.data() : null;
              if (!demo) return null;

              name = [
                demo.firstName,
                demo.middleName,
                demo.lastName,
                demo.suffix &&
                demo.suffix.toLowerCase() !== 'n/a'
                  ? demo.suffix
                  : '',
              ]
                .filter(Boolean)
                .join(' ');

              age = demo?.age || '—';
              sex = demo?.sex || '—';
              contact = demo?.contactNumber || '—';
            } else {
              const memberSnap = await getDoc(
                doc(db, 'households', householdId, 'members', lineNumber)
              );
              const demoSnap = await getDoc(
                doc(
                  db,
                  'households',
                  householdId,
                  'members',
                  lineNumber,
                  'demographicCharacteristics',
                  'main'
                )
              );

              const member = memberSnap.exists() ? memberSnap.data() : null;
              const demo = demoSnap.exists() ? demoSnap.data() : null;

              if (!member) return null;

              name = [
                member.firstName,
                member.middleName,
                member.lastName,
                member.suffix &&
                member.suffix.toLowerCase() !== 'n/a'
                  ? member.suffix
                  : '',
              ]
                .filter(Boolean)
                .join(' ');

              age = demo?.age || '—';
              sex = demo?.sex || '—';
              contact = demo?.contactNumber || '—';
            }

            return {
              id: `${householdId}-${lineNumber}`,
              name,
              age,
              sex,
              barangay,
              sitio,
              contact,
              disability: health.pwdDisabilityType || '—',
              householdId,
            };
          })
        );

        setPwds(allData.filter(Boolean));
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch PWD data.');
      } finally {
        setLoading(false);
      }
    };

    fetchPWDs();
  }, []);

  const effectiveBarangay =
    profile?.role === 'Brgy-Secretary'
      ? profile?.barangay
      : filterBarangay;

  const filteredData = pwds
    .filter(
      (item) =>
        !effectiveBarangay ||
        item.barangay?.trim().toLowerCase() ===
          effectiveBarangay?.trim().toLowerCase()
    )
    .filter((item) =>
      Object.values(item)
        .some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    if (!filteredData.length) return;

    const headers =
      'No,Name,Sex,Age,Barangay,Sitio,Contact,Disability';

    const rows = [...filteredData]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p, index) =>
        [
          index + 1,
          p.name,
          p.sex,
          p.age,
          p.barangay,
          p.sitio,
          p.contact,
          p.disability,
        ].join(',')
      );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pwd_report_2026.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleSaveEdit = async () => {
    if (!selectedPWD) return;

    setLoading(true);

    const {
      householdId,
      id,
      sex,
      age,
      contact,
      barangay,
      sitio,
      disability,
    } = selectedPWD;

    const lineNumber = id.replace(`${householdId}-`, '');
    const isHead = lineNumber === 'head';

    try {
      const healthRef = doc(
        db,
        'households',
        householdId,
        'health',
        'main'
      );

      const geoRef = doc(
        db,
        'households',
        householdId,
        'geographicIdentification',
        'main'
      );

      const demographicRef = isHead
        ? doc(
            db,
            'households',
            householdId,
            'demographicCharacteristics',
            'main'
          )
        : doc(
            db,
            'households',
            householdId,
            'members',
            lineNumber,
            'demographicCharacteristics',
            'main'
          );

      await Promise.all([
        updateDoc(healthRef, { pwdDisabilityType: disability }),
        updateDoc(geoRef, { barangay, sitio }),
        updateDoc(demographicRef, {
          sex,
          age,
          contactNumber: contact,
        }),
      ]);

      setPwds((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, sex, age, contact, barangay, sitio, disability }
            : item
        )
      );

      setShowModal(false);
      toast.success('PWD info updated.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update PWD info.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove PWD status for ${item.name}?`)) return;

    setLoading(true);

    try {
      const { householdId, id } = item;

      const healthRef = doc(
        db,
        'households',
        householdId,
        'health',
        'main'
      );

      await updateDoc(healthRef, {
        isPWD: false,
        pwdLineNumber: '',
        pwdDisabilityType: '',
      });

      setPwds((prev) => prev.filter((p) => p.id !== id));

      toast.success(`PWD status removed for ${item.name}.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove PWD status.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading)
    return (
      <p className="text-center py-6 text-gray-600">
        Loading user profile...
      </p>
    );

  return (
    <div className="p-4">
      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
        {title}
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto shadow border-t-0 rounded-b-md bg-white p-4">
        {loading ? (
          <p className="text-center py-6 text-gray-600">
            Loading PWD records...
          </p>
        ) : filteredData.length === 0 ? (
          <p className="text-center py-6 text-gray-500">
            No PWD records found.
          </p>
        ) : (
          <>
            <table className="w-full text-sm text-center">
              <thead>
                <tr>
                  <th className="border px-3 py-2">No.</th>
                  <th className="border px-3 py-2">Name</th>
                  <th className="border px-3 py-2">Sex</th>
                  <th className="border px-3 py-2">Age</th>
                  <th className="border px-3 py-2">Barangay</th>
                  <th className="border px-3 py-2">Sitio</th>
                  <th className="border px-3 py-2">Contact</th>
                  <th className="border px-3 py-2">Disability</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredData]
                  .sort((a, b) =>
                    a.name.localeCompare(b.name)
                  )
                  .map((item, index) => (
                    <tr key={item.id}>
                      <td className="border px-3 py-2">
                        {index + 1}
                      </td>
                      <td className="border px-3 py-2">
                        {item.name}
                      </td>
                      <td className="border px-3 py-2">
                        {item.sex}
                      </td>
                      <td className="border px-3 py-2">
                        {item.age}
                      </td>
                      <td className="border px-3 py-2">
                        {item.barangay}
                      </td>
                      <td className="border px-3 py-2">
                        {item.sitio}
                      </td>
                      <td className="border px-3 py-2">
                        {item.contact}
                      </td>
                      <td className="border px-3 py-2">
                        {item.disability}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <p className="text-sm text-gray-700 mt-4">
              <strong>Total PWDs:</strong> {filteredData.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
