import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  Typography,
  Container,
  Snackbar,
  Alert
} from '@mui/material';
import SitesList from '../components/sites/SitesList';
import SiteForm from '../components/sites/SiteForm';
import api from '../utils/api';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const fileInputRef = useRef(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sites', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        }
      });

      console.log('Raw API response:', response);

      const { sites: sitesData, pagination } = response.data || {};
      
      if (Array.isArray(sitesData)) {
        setSites(sitesData);
        setTotalRows(pagination?.total || sitesData.length);
      } else {
        console.error('Invalid sites data format:', response.data);
        setSites([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      setSites([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [page, rowsPerPage, searchTerm]);

  const handleSubmit = async (data) => {
    try {
      await api.post('/sites', data);
      fetchSites();
      setFormDialogOpen(false);
      setNotification({
        open: true,
        message: 'Site created successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating site:', error);
      setNotification({
        open: true,
        message: 'Error creating site',
        severity: 'error'
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/sites/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sites-export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setNotification({
        open: true,
        message: 'Sites exported successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting sites:', error);
      setNotification({
        open: true,
        message: 'Error exporting sites',
        severity: 'error'
      });
    }
  };

  const handleImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/sites/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      fetchSites();
      setNotification({
        open: true,
        message: `Successfully imported ${response.data.imported} sites`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error importing sites:', error);
      setNotification({
        open: true,
        message: 'Error importing sites',
        severity: 'error'
      });
    }
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sites Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" onClick={() => setFormDialogOpen(true)}>
            Add Site
          </Button>
          <Button variant="outlined" onClick={handleExport}>
            Export
          </Button>
          <Button
            variant="outlined"
            component="label"
          >
            Import
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleImport}
            />
          </Button>
        </Box>
      </Box>

      <SitesList 
        sites={sites}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={totalRows}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)}>
        <SiteForm onSubmit={handleSubmit} onClose={() => setFormDialogOpen(false)} />
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Sites; 