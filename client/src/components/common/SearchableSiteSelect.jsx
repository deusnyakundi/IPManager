import React, { useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress
} from '@mui/material';

const SearchableSiteSelect = ({ 
  sites = [], 
  value, 
  onChange,
  loading = false,
  error = null,
  label = "Select Site",
  required = false
}) => {
  const uniqueSites = Array.from(new Map(sites.map(site => [site.id, site])).values());

  // Create a memoized filter function
  const filterSites = useCallback((options, { inputValue }) => {
    if (!inputValue) return options;
    
    const searchTerm = inputValue.toLowerCase().trim();
    
    // Debugging: Log the search term and options
    console.log('Filtering with search term:', searchTerm);
    
    return options.filter(site => {
      if (!site || !site.name) return false;
      
      const isMatch = site.name.toLowerCase().indexOf(searchTerm) !== -1;
      
      // Debugging: Log each match
      if (isMatch) {
        console.log('Matched site:', site.name);
      }
      
      return isMatch;
    });
  }, [sites]);

  return (
    <Autocomplete
      options={uniqueSites}
      getOptionLabel={(option) => `${option.name} ${option.region?.name ? `(${option.region.name})` : ''}`}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      loading={loading}
      fullWidth
      autoComplete={false}
      disableCloseOnSelect={false}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={filterSites}
      clearOnBlur={false}
      clearOnEscape={true}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={!!error}
          helperText={error}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default SearchableSiteSelect; 