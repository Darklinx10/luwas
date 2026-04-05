'use client';

import { useEffect } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import { useMap as useMapContext } from '@/context/mapContext';
import { toast } from 'react-toastify';
import { mapApi } from '../../services/mapApi';

export default function MapClickHandler({ settingDefault, setPlusMarkers, setSettingDefault, fetchMapCenter }) {
  const leafletMap = useLeafletMap();
  const { setDefaultCenter, refreshMapCenter } = useMapContext();

  useEffect(() => {
    if (!leafletMap) return;

    const onClick = async (e) => {
      if (!settingDefault) return;

      const { lat, lng } = e.latlng;

      setPlusMarkers([{ lat, lng }]);
      setDefaultCenter([lat, lng]);
      leafletMap.setView([lat, lng], leafletMap.getZoom());

      try {
        // Use API instead of direct Firestore write (validates admin role on server)
        await mapApi.setDefaultCenter(lat, lng);

        toast.success('New default center added successfully!', {
          position: 'top-right',
          autoClose: 2000,
        });

        refreshMapCenter();
        fetchMapCenter?.();

        setPlusMarkers([]);
      } catch (err) {
        console.error('Error saving default center:', err);
        
        // Show specific error message
        if (err.message.includes('403')) {
          toast.error('Only admin can set default center.');
        } else if (err.message.includes('401')) {
          toast.error('Please login to set default center.');
        } else {
          toast.error('Failed to save new default center.');
        }
      }

      setSettingDefault(false);
    };

    leafletMap.on('click', onClick);
    return () => leafletMap.off('click', onClick);
  }, [settingDefault, setPlusMarkers, setDefaultCenter, fetchMapCenter, setSettingDefault, leafletMap, refreshMapCenter]);

  return null;
}
