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
  filterOLTs = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);

  const handleClickAway = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    fetchSites();
  }, [filterOLTs]);

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

  const filteredSites = sites.filter(site => {
    if (!searchTerm) return true;
    const searchField = filterOLTs ? site.site_name : site.name;
    return searchField.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (site) => {
    setSelectedSite(site);
    onSelect(site);
    setIsOpen(false);
    setSearchTerm('');
  };

  const displayValue = selectedSite 
    ? filterOLTs 
      ? selectedSite.site_name
      : `${selectedSite.name} ${selectedSite.region?.name ? `(${selectedSite.region.name})` : ''} ${selectedSite.msp?.name ? `(${selectedSite.msp.name})` : ''}`
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
            endAdornment: loading && <CircularProgress size={20} />,
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
