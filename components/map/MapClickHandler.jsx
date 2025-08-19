'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { toast } from 'react-toastify';

export default function MapClickHandler({
  settingDefault,
  setPlusMarkers,
  setDefaultCenter,
  setSettingDefault,
  fetchMapCenter,
}) {
  const map = useMap();

  useEffect(() => {
    const onClick = async (e) => {
      if (!settingDefault) return;

      const { lat, lng } = e.latlng;

      setPlusMarkers([{ lat, lng }]);
      setDefaultCenter([lat, lng]);
      map.setView([lat, lng], map.getZoom());

      try {
        await setDoc(doc(db, 'settings', 'mapCenter'), { lat, lng });

        toast.success('New default center added successfully!', {
          position: 'top-right',
          autoClose: 2000,
        });

        fetchMapCenter?.();
      } catch (err) {
        console.error('Error saving default center:', err);
        toast.error('Failed to save new default center.');
      }

      setSettingDefault(false);
    };

    map.on('click', onClick);
    return () => map.off('click', onClick);
  }, [map, settingDefault, setPlusMarkers, setDefaultCenter]);

  return null;
}
