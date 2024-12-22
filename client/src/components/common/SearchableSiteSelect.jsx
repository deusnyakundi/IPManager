import React, { useState } from 'react';
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
  return (
    <Autocomplete
      options={sites}
      getOptionLabel={(option) => `${option.name} ${option.region?.name ? `(${option.region.name})` : ''}`}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      loading={loading}
      fullWidth
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