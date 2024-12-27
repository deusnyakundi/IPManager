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
import { ipAPI, ipranClusterAPI } from '../../utils/api';
import IPInput from '../common/IPInput';

const ManageIPBlocks = () => {
  const [ipBlocks, setIPBlocks] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [newBlock, setNewBlock] = useState('');
  const [cidr, setCidr] = useState('24'); // Default CIDR value
  const [selectedCluster, setSelectedCluster] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIPBlocks();
    fetchClusters();
  }, []);

  const fetchIPBlocks = async () => {
    console.log('Fetching IP blocks...');
    try {
      const response = await ipAPI.getIPBlocks();
      console.log('IP blocks response:', response.data);
      setIPBlocks(response.data);
    } catch (error) {
      console.error('Error details:', error.response || error);
      console.error('Error fetching IP blocks:', error);
    }
  };

  const fetchClusters = async () => {
    try {
      const response = await ipranClusterAPI.getClusters();
      setClusters(response.data);
    } catch (error) {
      console.error('Error fetching clusters:', error);
      setError('Failed to fetch IPRAN clusters');
    }
  };

  const validateIP = (ip) => {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const handleAddBlock = async () => {
    if (!newBlock || !selectedCluster || !cidr) {
      setError('Please enter a valid IP block, CIDR, and select an IPRAN cluster.');
      return;
    }
    if (!validateIP(newBlock)) {
      setError('Invalid IP address format. Please enter a valid IP.');
      return;
    }
    try {
      const blockWithCidr = `${newBlock}/${cidr}`;
      console.log('Adding block with data:', { 
        block: blockWithCidr, 
        ipranClusterId: selectedCluster 
      });
      const response = await ipAPI.createIPBlock({ 
        block: blockWithCidr, 
        ipranClusterId: selectedCluster 
      });
      console.log('Add block response:', response.data);
      setNewBlock('');
      setCidr('24'); // Reset CIDR to default
      setSelectedCluster('');
      setError('');
      fetchIPBlocks();
    } catch (error) {
      console.error('Error adding IP block:', error);
      setError(error.response?.data?.message || 'Error adding IP block');
    }
  };

  const handleDeleteBlock = async (id) => {
    try {
      await ipAPI.deleteIPBlock(id);
      fetchIPBlocks();
    } catch (error) {
      console.error('Error deleting IP block:', error);
      setError(error.response?.data?.message || 'Error deleting IP block');
    }
  };

  return (
    <Container maxWidth="xl" disableGutters sx={{ height: '100vh', minWidth: 0, overflow: 'auto', backgroundColor: 'background.paper' }}>
      <Box sx={{ mb: 0.5, minWidth: 'min-content' }}>
        <Paper elevation={0} sx={{ 
          p: 1, 
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          borderRadius: 0,
        }}>
          <Grid container justifyContent="space-between" alignItems="center" spacing={0} sx={{ minHeight: '32px', py: 0, m: 0 }}>
            <Grid item>
              <Typography variant="h4" sx={{ fontSize: '1.25rem', lineHeight: 1, m: 0, color: 'text.primary' }}>
                Manage IP Blocks
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '32px' }}>
                <Box sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '32px',
                    minHeight: '32px'
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '2px 14px',
                  },
                }}>
                  <IPInput value={newBlock} onChange={setNewBlock} />
                </Box>
                <TextField
                  size="small"
                  value={cidr}
                  onChange={(e) => setCidr(e.target.value)}
                  placeholder="CIDR"
                  sx={{ 
                    width: '80px',
                    '& .MuiInputBase-root': { 
                      height: '32px',
                      minHeight: '32px'
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '2px 14px',
                    },
                  }}
                  inputProps={{ maxLength: 2 }}
                />
                <FormControl size="small" sx={{ width: '200px' }}>
                  <Select
                    value={selectedCluster}
                    onChange={(e) => setSelectedCluster(e.target.value)}
                    displayEmpty
                    sx={{ 
                      height: '32px',
                      '& .MuiSelect-select': {
                        padding: '2px 14px',
                      },
                    }}
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
                  onClick={handleAddBlock}
                  size="small"
                  sx={{ height: '32px' }}
                >
                  Add Block
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

        <Paper sx={{ mt: 1, borderRadius: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>IP Block</TableCell>
                  <TableCell>IPRAN Cluster</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ipBlocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>{block.block}</TableCell>
                    <TableCell>{block.cluster_name || 'Not assigned'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteBlock(block.id)}
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

export default ManageIPBlocks;