import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  Typography,
  Container,
  Snackbar,
  Alert,
  Paper,
  Grid
} from '@mui/material';
import SitesList from '../components/sites/SitesList';
import SiteForm from '../components/sites/SiteForm';
import ImportResultsDialog from '../components/sites/ImportResultsDialog';
import api from '../utils/api';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [importResults, setImportResults] = useState(null);
  const [showImportResults, setShowImportResults] = useState(false);
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

      const sitesData = Array.isArray(response.data) ? response.data : response.data?.sites;
      const paginationData = Array.isArray(response.data) ? null : response.data?.pagination;
      
      if (Array.isArray(sitesData)) {
        setSites(sitesData);
        setTotalRows(paginationData?.total || sitesData.length);
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
      if (editingSite) {
        await api.put(`/sites/${editingSite.id}`, data);
        setNotification({
          open: true,
          message: 'Site updated successfully',
          severity: 'success'
        });
      } else {
        await api.post('/sites', data);
        setNotification({
          open: true,
          message: 'Site created successfully',
          severity: 'success'
        });
      }
      fetchSites();
      setFormDialogOpen(false);
      setEditingSite(null);
    } catch (error) {
      console.error('Error saving site:', error);
      setNotification({
        open: true,
        message: `Error ${editingSite ? 'updating' : 'creating'} site`,
        severity: 'error'
      });
    }
  };

  const handleEdit = (site) => {
    setEditingSite(site);
    setFormDialogOpen(true);
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
      setImportResults(response.data);
      setShowImportResults(true);
    } catch (error) {
      console.error('Error importing sites:', error);
      setNotification({
        open: true,
        message: 'Error importing sites',
        severity: 'error'
      });
    }
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
    <Container 
      maxWidth="xl" 
      disableGutters 
      sx={{ 
        height: '100vh',
        minWidth: 0,
        overflow: 'auto',
        backgroundColor: 'background.paper'
      }}
    >
      <Box sx={{ mb: 0.5, minWidth: 'min-content' }}>
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
            spacing={0}
            sx={{ 
              minHeight: '32px',
              py: 0,
              m: 0
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
            <Grid item>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                alignItems: 'center',
                height: '32px'
              }}>
                <Button 
                  variant="contained" 
                  onClick={() => setFormDialogOpen(true)}
                  size="small"
                  sx={{ 
                    height: '32px',
                    minHeight: '32px'
                  }}
                >
                  Add Site
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleExport}
                  size="small"
                  sx={{ 
                    height: '32px',
                    minHeight: '32px'
                  }}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{ 
                    height: '32px',
                    minHeight: '32px'
                  }}
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
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ mt: 1, borderRadius: 0 }}>
          <Box sx={{ p: 1 }}>
            <SitesList 
              sites={sites}
              loading={loading}
              page={page}
              rowsPerPage={rowsPerPage}
              totalRows={totalRows}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onEdit={handleEdit}
            />
          </Box>
        </Paper>
      </Box>

      <Dialog 
        open={formDialogOpen} 
        onClose={() => {
          setFormDialogOpen(false);
          setEditingSite(null);
        }}
        PaperProps={{
          sx: {
            borderRadius: 0
          }
        }}
      >
        <SiteForm 
          onSubmit={handleSubmit} 
          onClose={() => {
            setFormDialogOpen(false);
            setEditingSite(null);
          }}
          initialData={editingSite}
        />
      </Dialog>

      <ImportResultsDialog 
        open={showImportResults}
        onClose={() => setShowImportResults(false)}
        results={importResults}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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