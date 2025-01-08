import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const FilterDialog = ({ open, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState({
    regions: [],
    faultTypes: [],
    dateRange: {
      start: null,
      end: null,
    },
    minClientsAffected: '',
    maxMTTR: '',
  });

  useEffect(() => {
    if (currentFilters) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({
      regions: [],
      faultTypes: [],
      dateRange: {
        start: null,
        end: null,
      },
      minClientsAffected: '',
      maxMTTR: '',
    });
  };

  // Sample data - in a real application, these would come from the backend
  const regions = [
    'Central',
    'Eastern',
    'Western',
    'Northern',
    'Southern',
    'Coastal',
  ];

  const faultTypes = [
    'Hardware Failure',
    'Software Issue',
    'Power Outage',
    'Fiber Cut',
    'Configuration Error',
    'Environmental',
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Filter Analytics</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Autocomplete
            multiple
            value={filters.regions}
            onChange={(event, newValue) => {
              setFilters((prev) => ({ ...prev, regions: newValue }));
            }}
            options={regions}
            renderInput={(params) => (
              <TextField {...params} label="Regions" placeholder="Select regions" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
          />

          <Autocomplete
            multiple
            value={filters.faultTypes}
            onChange={(event, newValue) => {
              setFilters((prev) => ({ ...prev, faultTypes: newValue }));
            }}
            options={faultTypes}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Fault Types"
                placeholder="Select fault types"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="Start Date"
                value={filters.dateRange.start}
                onChange={(newValue) => {
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: newValue },
                  }));
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              <DatePicker
                label="End Date"
                value={filters.dateRange.end}
                onChange={(newValue) => {
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: newValue },
                  }));
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </LocalizationProvider>

          <TextField
            label="Minimum Clients Affected"
            type="number"
            value={filters.minClientsAffected}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                minClientsAffected: e.target.value,
              }));
            }}
            InputProps={{ inputProps: { min: 0 } }}
          />

          <TextField
            label="Maximum MTTR (hours)"
            type="number"
            value={filters.maxMTTR}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                maxMTTR: e.target.value,
              }));
            }}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleApply} variant="contained">
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterDialog; 