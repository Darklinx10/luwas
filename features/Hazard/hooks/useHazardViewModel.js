'use client';

import { useState, useEffect, useCallback } from 'react';
import * as hazardService from '@/features/Hazard/services/hazardService';
import { toast } from 'react-toastify';

export const useHazardViewModel = () => {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch hazards on mount
  useEffect(() => {
    const fetchHazards = async () => {
      setLoading(true);
      try {
        const allHazards = await hazardService.fetchHazards();
        setHazards(allHazards);
      } catch (error) {
        console.error('Error fetching hazards:', error);
        toast.error('Failed to load hazards');
      } finally {
        setLoading(false);
      }
    };

    fetchHazards();
  }, []);

  // Preview hazard
  const previewHazard = useCallback(async (hazard) => {
    try {
      const hazardData = await hazardService.previewHazard(hazard);
      setSelectedHazard(hazardData);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error previewing hazard:', error);
      toast.error('Failed to preview hazard');
    }
  }, []);

  // Delete hazard
  const deleteHazard = useCallback(async (hazard) => {
    try {
      await hazardService.deleteHazard(hazard);
      setHazards((prev) => prev.filter((h) => h.id !== hazard.id));
      toast.success('Hazard deleted successfully');
    } catch (error) {
      console.error('Error deleting hazard:', error);
      toast.error('Failed to delete hazard');
    }
  }, []);

  // Upload hazard
  const uploadHazard = useCallback(
    async ({ geojsonFile, hazardType, description, legendProp, colorSettings }) => {
      setLoadingUpload(true);
      try {
        await hazardService.uploadHazard({
          geojsonFile,
          hazardType,
          description,
          legendProp,
          colorSettings,
        });
        
        // Refresh hazards list
        const allHazards = await hazardService.fetchHazards();
        setHazards(allHazards);
        
        toast.success('Hazard uploaded successfully');
      } catch (error) {
        console.error('Error uploading hazard:', error);
        toast.error(error.message || 'Failed to upload hazard');
        throw error;
      } finally {
        setLoadingUpload(false);
      }
    },
    []
  );

  return {
    hazards,
    loading,
    loadingUpload,
    selectedHazard,
    isPreviewOpen,
    setIsPreviewOpen,
    deleteHazard,
    previewHazard,
    uploadHazard,
  };
};
