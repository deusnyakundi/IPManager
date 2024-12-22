import React from 'react';
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

const SiteFilters = ({ filters, onChange, onClose }) => {
  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value
    });
  };

  return (
    <Box>
      <DialogTitle>Filter Sites</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Region</InputLabel>
            <Select
              multiple
              value={filters.region}
              onChange={(e) => handleChange('region', e.target.value)}
              label="Region"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {/* Add your region options here */}
              <MenuItem value="region1">Region 1</MenuItem>
              <MenuItem value="region2">Region 2</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          variant="contained" 
          onClick={() => {
            onChange({
              region: [],
              status: [],
              tags: []
            });
          }}
        >
          Clear Filters
        </Button>
      </DialogActions>
    </Box>
  );
};

export default SiteFilters; 