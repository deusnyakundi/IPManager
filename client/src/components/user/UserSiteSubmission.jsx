import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, TextField, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import axios from 'axios';

const UserSiteSubmission = () => {
  const [regions, setRegions] = useState([]);
  const [siteName, setSiteName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [generatedIP, setGeneratedIP] = useState('');
  const [vlan, setVlan] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await axios.get('/api/regions');
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
      const response = await axios.post('/api/sites/generate-ip', { siteName, regionId: selectedRegion });
      setGeneratedIP(response.data.ip);
      setVlan(response.data.vlan);
      setError('');
    } catch (error) {
      console.error('Error generating IP:', error);
      setError('Failed to generate IP.');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Submit Site
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
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
      {generatedIP && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          Generated IP: {generatedIP} <br />
          VLAN: {vlan}
        </Typography>
      )}
    </Box>
  );
};

export default UserSiteSubmission;