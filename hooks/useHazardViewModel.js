'use client';

import { useState, useEffect, useCallback } from 'react';
import * as hazardService from '@/services/hazardServices';
import { toast } from 'react-toastify';



export const useHazardViewModel = () => {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  

  /** 🔹 Fetch all hazards */
  const fetchHazards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hazardService.fetchHazards();
      setHazards(data);
    } catch (error) {
      console.error('Error fetching hazards:', error);
      toast.error('Failed to load hazard layers.');
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Delete hazard */
  const deleteHazard = useCallback(async (hazard) => {
    if (!confirm('Are you sure you want to delete this hazard layer?')) return;

    try {
      await hazardService.deleteHazard(hazard);
      toast.success('Hazard layer deleted successfully.');
      fetchHazards();
    } catch (error) {
      console.error('Error deleting hazard:', error);
      toast.error('Failed to delete hazard.');
    }
  }, [fetchHazards]);

  /** 🔹 Preview hazard */
  const previewHazard = useCallback(async (hazard) => {
    try {
      const previewData = await hazardService.previewHazard(hazard);
      setSelectedHazard(previewData);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error previewing hazard:', error);
      toast.error(error.message || 'Failed to load GeoJSON preview.');
    }
  }, []);

  /** 🔹 Upload new hazard */
  const uploadHazard = useCallback(async ({ geojsonFile, hazardType, description, legendProp, colorSettings, onClose }) => {
    if (!geojsonFile || !hazardType || !description) {
      toast.error('Please fill all fields and select a valid GeoJSON file.');
      return;
    }

    setLoadingUpload(true);
    try {
      await hazardService.uploadHazard({ geojsonFile, hazardType, description, legendProp, colorSettings });
      toast.success('Hazard uploaded successfully!');
      await fetchHazards();

      // Clear modal/UI state
      onClose?.();
    } catch (error) {
      console.error('Error uploading hazard:', error);
      toast.error(error.message || 'Failed to upload hazard');
    } finally {
      setLoadingUpload(false);
    }
  }, [fetchHazards]);

  useEffect(() => {
    fetchHazards();
  }, [fetchHazards]);

  return {
    hazards,
    loading,
    loadingUpload,
    selectedHazard,
    isPreviewOpen,
    setIsPreviewOpen,
    fetchHazards,
    deleteHazard,
    previewHazard,
    uploadHazard,
  };
};
