import React, { useState, useEffect } from 'react';
import { siteAPI, regionAPI } from '../../utils/api';
import { Typography, Box, Button, TextField, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const SiteSubmission = () => {
  const { user, token } = useAuth(); // Access user and token from AuthContext
  const [siteName, setSiteName] = useState('');
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await regionAPI.getRegions();
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
      setError('Failed to fetch regions.');
    }
  };

  const handleSubmit = async () => {
    if (!siteName || !selectedRegion) {
      setError('Please enter a site name and select a region.');
      return;
    }
    try {
      const response = await siteAPI.createSite({ siteName, regionId: selectedRegion }, {
        headers: { Authorization: `Bearer ${token}` } // Pass token for authentication
      });
      setSiteName('');
      setSelectedRegion('');
      setError('');
      setSuccess(`Site created successfully with IP: ${response.data.ip} and VLAN: ${response.data.vlan}`);
    } catch (error) {
      console.error('Error creating site:', error);
      setError('Failed to create site.');
    }
  };

  if (!user) {
    return <Typography variant="h6">Please log in to submit a site.</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Submit a New Site
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <TextField
        label="Site Name"
        value={siteName}
        onChange={(e) => setSiteName(e.target.value)}
        sx={{ mr: 2 }}
      />
      <FormControl sx={{ minWidth: 120, mr: 2 }}>
        <InputLabel>Region</InputLabel>
        <Select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          label="Region"
        >
          {regions.map((region) => (
            <MenuItem key={region.id} value={region.id}>
              {region.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" onClick={handleSubmit}>
        Submit
      </Button>
    </Box>
  );
};

export default SiteSubmission;