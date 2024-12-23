import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { siteAPI } from '../services/siteAPI';
import SitesList from '../components/sites/SitesList';
import SiteForm from '../components/sites/SiteForm';
import SiteFilters from '../components/sites/SiteFilters';

const SitesManagement = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    region: [],
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSites();
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const response = await siteAPI.getAllSites({
        search: searchTerm,
        ...filters
      });
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await siteAPI.exportSites();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sites.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting sites:', error);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    try {
      await siteAPI.importSites(file);
      fetchSites();
    } catch (error) {
      console.error('Error importing sites:', error);
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (selectedSite) {
        await siteAPI.updateSite(selectedSite.id, data);
      } else {
        await siteAPI.createSite(data);
      }
      await fetchSites();
      setShowSiteForm(false);
      setSelectedSite(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Container 
      maxWidth="xl"
      disableGutters
      sx={{ height: '100%' }}
    >
      <Box sx={{ mb: 0.5 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1, 
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            borderRadius: 0,
          }}
        >
          <Grid 
            container 
            justifyContent="space-between" 
            alignItems="center" 
            spacing={1}
            sx={{ 
              minHeight: '36px',
              py: 0
            }}
          >
            <Grid item>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  m: 0,
                  color: 'text.primary',
                }}
              >
                Sites Management
              </Typography>
            </Grid>
            <Grid item sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 0.5,
                  alignItems: 'center',
                  height: '32px',
                }}
              >
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="Search sites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1.2rem' }} />,
                    sx: { 
                      height: '32px',
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                    }
                  }}
                />
                <IconButton 
                  onClick={() => setShowFilters(true)}
                  size="small"
                  sx={{ 
                    height: '32px',
                    width: '32px',
                    p: 0.5,
                  }}
                >
                  <FilterIcon fontSize="small" />
                </IconButton>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowSiteForm(true)}
                size="small"
              >
                Add Site
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                size="small"
              >
                Export
              </Button>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                size="small"
              >
                Import
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleImport}
                />
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ 
          mt: 1,
          borderRadius: 0,
        }}>
          <Box sx={{ p: 1 }}>
            <SitesList
              sites={sites}
              loading={loading}
              onEdit={(site) => {
                setSelectedSite(site);
                setShowSiteForm(true);
              }}
            />
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={showSiteForm}
        onClose={() => {
          setShowSiteForm(false);
          setSelectedSite(null);
        }}
        PaperProps={{
          sx: {
            width: 'auto',
            m: 0,
            borderRadius: 1,
          }
        }}
      >
        <SiteForm
          site={selectedSite}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowSiteForm(false);
            setSelectedSite(null);
          }}
        />
      </Dialog>

      <Dialog
        open={showFilters}
        onClose={() => setShowFilters(false)}
        PaperProps={{
          sx: {
            width: 'auto',
            m: 0,
            borderRadius: 1,
          }
        }}
      >
        <SiteFilters
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      </Dialog>
    </Container>
  );
};

export default SitesManagement; 