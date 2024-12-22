import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import api from '../../utils/api';

const SiteForm = ({ site, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    region_id: '',
  });
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        ipAddress: site.ipAddress || '',
        region_id: site.region_id || '',
      });
    }
    fetchRegions();
  }, [site]);

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions');
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        name: formData.name,
        ip: formData.ipAddress,
        region_id: formData.region_id,
      };
      console.log('Submitting site data:', submitData);
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error in SiteForm submission:', error);
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <DialogTitle>
        {site ? 'Edit Site' : 'Add New Site'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            name="name"
            label="Site Name"
            value={formData.name}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            name="ipAddress"
            label="IP Address"
            value={formData.ipAddress}
            onChange={handleChange}
            required
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Region</InputLabel>
            <Select
              name="region_id"
              value={formData.region_id}
              onChange={handleChange}
              label="Region"
              required
            >
              {regions.map((region) => (
                <MenuItem key={region.id} value={region.id}>
                  {region.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
        >
          {site ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default SiteForm; 