import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const AnalyticsFilters = ({ onFilterChange, availableFilters }) => {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    regions: [],
    faultTypes: [],
    dateRange: {
      start: null,
      end: null,
    },
    minClientsAffected: '',
    maxMTTR: '',
    classification: '',
  });

  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...filters,
      [field]: value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (field, value) => {
    const newFilters = {
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value,
      },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      regions: [],
      faultTypes: [],
      dateRange: {
        start: null,
        end: null,
      },
      minClientsAffected: '',
      maxMTTR: '',
      classification: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.regions.length > 0) count++;
    if (filters.faultTypes.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.minClientsAffected) count++;
    if (filters.maxMTTR) count++;
    if (filters.classification) count++;
    return count;
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
          {getActiveFilterCount() > 0 && (
            <Chip
              label={`${getActiveFilterCount()} active`}
              size="small"
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Regions</InputLabel>
              <Select
                multiple
                value={filters.regions}
                onChange={(e) => handleFilterChange('regions', e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {availableFilters?.regions?.map((region) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Fault Types</InputLabel>
              <Select
                multiple
                value={filters.faultTypes}
                onChange={(e) => handleFilterChange('faultTypes', e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {availableFilters?.faultTypes?.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    label="Start Date"
                    value={filters.dateRange.start}
                    onChange={(value) => handleDateChange('start', value)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    label="End Date"
                    value={filters.dateRange.end}
                    onChange={(value) => handleDateChange('end', value)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Min Clients Affected"
                  type="number"
                  value={filters.minClientsAffected}
                  onChange={(e) => handleFilterChange('minClientsAffected', e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Max MTTR (hours)"
                  type="number"
                  value={filters.maxMTTR}
                  onChange={(e) => handleFilterChange('maxMTTR', e.target.value)}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button
                variant="contained"
                onClick={() => onFilterChange(filters)}
              >
                Apply Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default AnalyticsFilters; 