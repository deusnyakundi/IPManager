import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Container
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { vlanAPI, ipranClusterAPI } from '../../utils/api';

const ManageVLANRanges = () => {
  const [vlanRanges, setVlanRanges] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [startVLAN, setStartVLAN] = useState('');
  const [endVLAN, setEndVLAN] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVLANRanges();
    fetchClusters();
  }, []);

  const fetchVLANRanges = async () => {
    try {
      const response = await vlanAPI.getVLANRanges();
      setVlanRanges(response.data);
    } catch (error) {
      console.error('Error fetching VLAN ranges:', error);
      setError('Failed to fetch VLAN ranges');
    }
  };

  const fetchClusters = async () => {
    try {
      const response = await ipranClusterAPI.getClusters();
      setClusters(response.data);
    } catch (error) {
      console.error('Error fetching IPRAN clusters:', error);
      setError('Failed to fetch IPRAN clusters');
    }
  };

  const handleAddRange = async () => {
    if (!startVLAN || !endVLAN || !selectedCluster) {
      setError('Please enter VLAN range and select an IPRAN cluster');
      return;
    }

    const start = parseInt(startVLAN);
    const end = parseInt(endVLAN);

    if (start >= end) {
      setError('End VLAN must be greater than Start VLAN');
      return;
    }

    try {
      await vlanAPI.createVLANRange({
        start_vlan: start,
        end_vlan: end,
        ipranClusterId: selectedCluster
      });
      setStartVLAN('');
      setEndVLAN('');
      setSelectedCluster('');
      setError('');
      fetchVLANRanges();
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding VLAN range');
    }
  };

  const handleDeleteRange = async (id) => {
    try {
      await vlanAPI.deleteVLANRange(id);
      fetchVLANRanges();
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting VLAN range');
    }
  };

  return (
    <Container maxWidth="xl" disableGutters>
      <Box sx={{ mb: 0.5, minWidth: 'min-content' }}>
        <Paper elevation={0} sx={{ p: 1, backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider', borderRadius: 0 }}>
          <Grid container justifyContent="space-between" alignItems="center" spacing={0}>
            <Grid item>
              <Typography variant="h4" sx={{ fontSize: '1.25rem' }}>
                Manage VLAN Ranges
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  value={startVLAN}
                  onChange={(e) => setStartVLAN(e.target.value)}
                  placeholder="Start VLAN"
                  sx={{ width: '100px' }}
                />
                <TextField
                  size="small"
                  value={endVLAN}
                  onChange={(e) => setEndVLAN(e.target.value)}
                  placeholder="End VLAN"
                  sx={{ width: '100px' }}
                />
                <FormControl size="small" sx={{ width: '200px' }}>
                  <Select
                    value={selectedCluster}
                    onChange={(e) => setSelectedCluster(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>Select IPRAN Cluster</MenuItem>
                    {clusters.map((cluster) => (
                      <MenuItem key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleAddRange}
                  size="small"
                >
                  Add Range
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ mt: 1 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Start VLAN</TableCell>
                  <TableCell>End VLAN</TableCell>
                  <TableCell>IPRAN Cluster</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vlanRanges.map((range) => (
                  <TableRow key={range.id}>
                    <TableCell>{range.start_vlan}</TableCell>
                    <TableCell>{range.end_vlan}</TableCell>
                    <TableCell>{range.cluster_name}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRange(range.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default ManageVLANRanges; 