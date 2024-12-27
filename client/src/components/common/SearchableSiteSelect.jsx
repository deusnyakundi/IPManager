import React, { useState, useRef, useEffect } from 'react';
import { 
  TextField, 
  Paper, 
  Box, 
  Typography, 
  CircularProgress,
  ClickAwayListener
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchableSiteSelect = ({
  sites = [],
  value,
  onChange,
  loading = false,
  error = null,
  label = "Select Site",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  const handleClickAway = () => {
    setIsOpen(false);
  };

  // Filter sites based on search term
  const filteredSites = sites.filter(site => {
    if (!searchTerm) return true;
    return site.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle site selection
  const handleSelect = (site) => {
    onChange(site);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Display value in input with both Region and MSP
  const displayValue = value 
    ? `${value.name} ${value.region?.name ? `(${value.region.name})` : ''} ${value.msp?.name ? `(${value.msp.name})` : ''}`
    : '';

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: '100%',  }}>
        <TextField
          ref={inputRef}
          fullWidth
          required={required}
          error={!!error}
          helperText={error}
          placeholder={label}
          value={isOpen ? searchTerm : displayValue}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1.2rem' }} />,
            endAdornment: loading && <CircularProgress size={20} />,
            sx: { 
              height: '32px',
              minHeight: '32px',
              fontSize: '0.875rem',
            }
          }}
        />

        {isOpen && (
          <Paper
            sx={{
              position: 'fixed',
              top: '200px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              maxWidth: '800px',
              height: 'calc(100vh - 250px)',
              overflow: 'auto',
              zIndex: 1500,
              boxShadow: 3,
              '& .MuiBox-root': {
                py: 1,
                px: 2,
              }
            }}
          >
            {filteredSites.length > 0 ? (
              filteredSites.map((site) => (
                <Box
                  key={site.id}
                  onClick={() => handleSelect(site)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <Typography variant="body2">
                    {site.name} 
                    {site.region?.name && ` (${site.region.name})`}
                    {site.msp?.name && ` (${site.msp.name})`}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ p: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  No sites found
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default SearchableSiteSelect;
