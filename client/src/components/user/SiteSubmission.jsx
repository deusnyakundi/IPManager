import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { siteAPI } from '../../services/siteAPI';
import SearchableSiteSelect from '../common/SearchableSiteSelect';
import api from '../../utils/api';

const SiteSubmission = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedIP, setGeneratedIP] = useState('');
  const [vlan, setVlan] = useState('');
  const [primaryVCID, setPrimaryVCID] = useState('');
  const [secondaryVCID, setSecondaryVCID] = useState('');
  const [vsiId, setVsiId] = useState('');

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const response = await siteAPI.getAllSites();
      console.log('Fetched sites:', response.data);
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setError('Failed to fetch sites.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSite) {
      setError('Please select a site');
      return;
    }
    console.log('Selected site:', selectedSite);
    try {
      const response = await api.post('/sites/generate-ip', { 
        siteId: selectedSite.id,
        region_id: selectedSite.regionId
      });
      console.log('Response:', response.data);
      setGeneratedIP(response.data.ip);
      setVlan(response.data.vlan);
      setPrimaryVCID(response.data.primary_vcid);
      setSecondaryVCID(response.data.secondary_vcid);
      setVsiId(response.data.vsi_id);
      setError('');
    } catch (error) {
      console.log('Request failed with:', error.response?.data);
      console.error('Error generating IP:', error);
      setError(error.response?.data?.message || 'Failed to generate IP.');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Generate IP Address
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <SearchableSiteSelect
        sites={sites}
        value={selectedSite}
        onChange={setSelectedSite}
        loading={loading}
        required
      />

      <Button 
        variant="contained" 
        onClick={handleSubmit}
        disabled={!selectedSite || loading}
        sx={{ mt: 2 }}
      >
        Generate IP
      </Button>

      {generatedIP && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          Generated IP: {generatedIP} <br />
          VLAN: {vlan} <br />
          Primary VCID: {primaryVCID} <br />
          Secondary VCID: {secondaryVCID} <br />
          VSI ID: {vsiId}
        </Typography>
      )}
    </Box>
  );
};

export default SiteSubmission;