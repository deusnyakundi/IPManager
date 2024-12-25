import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, IconButton, Grid, Dialog } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../utils/api';

const ManageClusters = () => {
  const [clusters, setClusters] = useState([]);
  const [regions, setRegions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCluster, setEditingCluster] = useState(null);
  const [formData, setFormData] = useState({ name: '', region_id: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClusters();
    fetchRegions();
  }, []);

  const fetchClusters = async () => {
    try {
      const response = await api.get('/ipran-clusters');
      setClusters(response.data);
    } catch (error) {
      console.error('Error fetching clusters:', error);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions');
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCluster) {
        await api.put(`/ipran-clusters/${editingCluster.id}`, formData);
      } else {
        await api.post('/ipran-clusters', formData);
      }
      fetchClusters();
      handleClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving cluster');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/ipran-clusters/${id}`);
      fetchClusters();
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting cluster');
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingCluster(null);
    setFormData({ name: '', region_id: '' });
    setError('');
  };

  const handleEdit = (cluster) => {
    setEditingCluster(cluster);
    setFormData({ 
      name: cluster.name, 
      region_id: cluster.region_id 
    });
    setOpenDialog(true);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        backgroundColor: 'background.paper',
      }}
    >
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
            m: 0,
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
              Manage IPRAN Clusters
            </Typography>
          </Grid>
          <Grid item>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              variant="contained"
              size="small"
              sx={{
                height: '32px',
                minHeight: '32px',
              }}
            >
              Add Cluster
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ mt: 1, borderRadius: 0 }}>
        <Box sx={{ p: 1 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cluster Name</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clusters.map((cluster) => (
                  <TableRow key={cluster.id}>
                    <TableCell>{cluster.name}</TableCell>
                    <TableCell>{cluster.region_name}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEdit(cluster)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(cluster.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={handleClose}>
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editingCluster ? 'Edit Cluster' : 'Add Cluster'}
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <TextField
            label="Cluster Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            size="small"
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Region"
            value={formData.region_id}
            onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
            fullWidth
            required
            size="small"
            sx={{ mb: 2 }}
          >
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingCluster ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ManageClusters;
