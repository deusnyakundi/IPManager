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
    region: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  useEffect(() => {
    fetchSites();
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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
          <Grid item>
            <Typography variant="h4">Sites Management</Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowSiteForm(true)}
              >
                Add Site
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
              >
                Export
              </Button>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
              >
                Import
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleImport}
                />
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 2, p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <IconButton onClick={() => setShowFilters(true)}>
              <FilterIcon />
            </IconButton>
          </Box>

          <SitesList
            sites={sites}
            loading={loading}
            onEdit={(site) => {
              setSelectedSite(site);
              setShowSiteForm(true);
            }}
          />
        </Paper>
      </Box>

      <Dialog
        open={showSiteForm}
        onClose={() => {
          setShowSiteForm(false);
          setSelectedSite(null);
        }}
        maxWidth="md"
        fullWidth
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
        maxWidth="sm"
        fullWidth
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