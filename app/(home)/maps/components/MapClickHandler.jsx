'use client';

import { useEffect } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import { useMap as useMapContext } from '@/context/mapContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { toast } from 'react-toastify';

export default function MapClickHandler({ settingDefault, setPlusMarkers, setSettingDefault, fetchMapCenter }) {
  const leafletMap = useLeafletMap();
  const { setDefaultCenter, refreshMapCenter } = useMapContext(); // ✅ get setDefaultCenter from context

  useEffect(() => {
    if (!leafletMap) return;
  
    const onClick = async (e) => {
      if (!settingDefault) return;
    
      const { lat, lng } = e.latlng;
    
      // temporarily show marker
      setPlusMarkers([{ lat, lng }]);
      setDefaultCenter([lat, lng]);
      leafletMap.setView([lat, lng], leafletMap.getZoom());
    
      try {
        await setDoc(doc(db, 'settings', 'mapCenter'), { lat, lng });
    
        toast.success('New default center added successfully!', {
          position: 'top-right',
          autoClose: 2000,
        });
    
        refreshMapCenter();
        fetchMapCenter?.();
    
        // remove the marker after success
        setPlusMarkers([]);
      } catch (err) {
        console.error('Error saving default center:', err);
        toast.error('Failed to save new default center.');
      }
    
      setSettingDefault(false);
    };
    
  
    leafletMap.on('click', onClick);
    return () => leafletMap.off('click', onClick);
  }, [settingDefault, setPlusMarkers, setDefaultCenter, fetchMapCenter, setSettingDefault, leafletMap, refreshMapCenter]);
  

  return null;
}
