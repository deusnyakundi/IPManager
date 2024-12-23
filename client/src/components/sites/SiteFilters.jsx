import React, { useState, useEffect } from 'react';
import {
  Box,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { regionAPI } from '../../utils/api';

const SiteFilters = ({ filters, onChange, onClose }) => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    setLoading(true);
    try {
      const response = await regionAPI.getRegions();
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value
    });
  };

  const handleClearFilters = () => {
    onChange({
      region: [],
      status: 'all'
    });
    onClose();
  };

  return (
    <Box>
      <DialogTitle>Filter Sites</DialogTitle>
      <DialogContent sx={{ width: '300px', pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Region</InputLabel>
            <Select
              multiple
              value={filters.region}
              onChange={(e) => handleChange('region', e.target.value)}
              label="Region"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const region = regions.find(r => r.id === value);
                    return (
                      <Chip 
                        key={value} 
                        label={region ? region.name : value}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {regions.map((region) => (
                <MenuItem key={region.id} value={region.id}>
                  {region.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} size="small">
          Close
        </Button>
        <Button 
          variant="contained" 
          onClick={handleClearFilters}
          size="small"
        >
          Clear Filters
        </Button>
      </DialogActions>
    </Box>
  );
};

export default SiteFilters; 