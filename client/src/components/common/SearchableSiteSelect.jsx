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
import api from '../../utils/api';

const SearchableSiteSelect = ({
  label,
  onSelect,
  optional = false,
  filterOLTs = false,
  sites: externalSites,
  value: externalValue,
  onChange: externalOnChange,
  loading: externalLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const inputRef = useRef(null);

  const effectiveSites = externalSites || sites;
  const effectiveLoading = externalLoading || loading;
  const effectiveValue = externalValue || selectedSite;

  useEffect(() => {
    if (!externalSites) {
      fetchSites();
    }
  }, [filterOLTs, externalSites]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      let endpoint = '/sites';
      if (filterOLTs) {
        endpoint = '/config/all-assignments';
      }
      const response = await api.get(endpoint);
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  const filteredSites = effectiveSites.filter(site => {
    if (!searchTerm) return true;
    const searchField = filterOLTs ? site.site_name : site.name;
    return searchField.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (site) => {
    if (externalOnChange) {
      externalOnChange(site);
    } else {
      setSelectedSite(site);
      onSelect(site);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const displayValue = effectiveValue 
    ? filterOLTs 
      ? effectiveValue.site_name
      : `${effectiveValue.name} ${effectiveValue.region?.name ? `(${effectiveValue.region.name})` : ''} ${effectiveValue.msp?.name ? `(${effectiveValue.msp.name})` : ''}`
    : '';

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: '100%' }}>
        <TextField
          ref={inputRef}
          fullWidth
          required={!optional}
          label={label}
          placeholder={label}
          value={isOpen ? searchTerm : displayValue}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1.2rem' }} />,
            endAdornment: effectiveLoading && <CircularProgress size={20} />,
            sx: { 
              height: '40px',
              minHeight: '40px',
              fontSize: '0.875rem',
            }
          }}
        />

        {isOpen && (
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '300px',
              overflow: 'auto',
              mt: 1,
              zIndex: 1500,
              boxShadow: 3,
            }}
          >
            {filteredSites.length > 0 ? (
              filteredSites.map((site) => (
                <Box
                  key={filterOLTs ? site.id : site.id}
                  onClick={() => handleSelect(site)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <Typography variant="body2">
                    {filterOLTs ? (
                      `${site.site_name} - ${site.ipAddress}`
                    ) : (
                      `${site.name} ${site.region?.name ? `(${site.region.name})` : ''} ${site.msp?.name ? `(${site.msp.name})` : ''} - ${site.ipAddress}`
                    )}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ p: 2 }}>
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
