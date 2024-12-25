import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../utils/api';

const ManageVLANBlocks = () => {
  const [vlanRanges, setVlanRanges] = useState([]);
  const [regions, setRegions] = useState([]);
  const [newRange, setNewRange] = useState({ start: '', end: '' });
  const [selectedRegion, setSelectedRegion] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVLANRanges();
    fetchRegions();
  }, []);

  const fetchVLANRanges = async () => {
    try {
      const response = await api.get('/vlanblock/ranges');
      setVlanRanges(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching VLAN ranges:', error);
      setError('Failed to fetch VLAN ranges.');
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

  const handleAddRange = async () => {
    const { start, end } = newRange;
    if (!start || !end || !selectedRegion) {
      setError('Please enter a valid VLAN range and select a region.');
      return;
    }
    const startVLAN = parseInt(start, 10);
    const endVLAN = parseInt(end, 10);
    if (isNaN(startVLAN) || isNaN(endVLAN) || startVLAN < 1 || endVLAN > 4094 || startVLAN >= endVLAN) {
      setError('Invalid VLAN range. Please enter valid numbers between 1 and 4094.');
      return;
    }
    try {
      await api.post('/vlanblock/ranges', { 
        start_vlan: startVLAN, 
        end_vlan: endVLAN, 
        region_id: selectedRegion 
      });
      setNewRange({ start: '', end: '' });
      setSelectedRegion('');
      setError('');
      fetchVLANRanges();
    } catch (error) {
      console.error('Error adding VLAN range:', error);
      setError('Failed to add VLAN range.');
    }
  };

  const handleDeleteRange = async (id) => {
    try {
      await api.delete(`/vlanblock/ranges/${id}`);
      fetchVLANRanges();
    } catch (error) {
      console.error('Error deleting VLAN range:', error);
    }
  };

  return (
    <Container 
      maxWidth="xl"
      disableGutters
      sx={{ 
        height: '100%',
        minWidth: 0,
        overflow: 'auto',
        backgroundColor: 'background.paper', 
      }}
    >
      <Box sx={{ 
        mb: 0.5,
        minWidth: 'min-content',
      }}>
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
                Manage VLAN Blocks
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                alignItems: 'center',
                height: '32px'
              }}>
                <TextField
                  size="small"
                  label="Start VLAN"
                  value={newRange.start}
                  onChange={(e) => setNewRange({ ...newRange, start: e.target.value })}
                  sx={{ 
                    width: '120px',
                    '& .MuiInputBase-root': { 
                      height: '32px',
                      minHeight: '32px'
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '2px 14px',
                    },
                  }}
                />
                <TextField
                  size="small"
                  label="End VLAN"
                  value={newRange.end}
                  onChange={(e) => setNewRange({ ...newRange, end: e.target.value })}
                  sx={{ 
                    width: '120px',
                    '& .MuiInputBase-root': { 
                      height: '32px',
                      minHeight: '32px'
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '2px 14px',
                    },
                  }}
                />
                <FormControl size="small" sx={{ width: '200px' }}>
                  <InputLabel>Region</InputLabel>
                  <Select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    label="Region"
                    sx={{ 
                      height: '32px',
                      minHeight: '32px'
                    }}
                  >
                    {regions.map((region) => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  onClick={handleAddRange}
                  size="small"
                  sx={{ 
                    height: '32px',
                    minHeight: '32px'
                  }}
                >
                  Add Block
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ 
          mt: 1,
          borderRadius: 0,
        }}>
          <Box sx={{ p: 1 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 1,
                  '& .MuiAlert-message': {
                    color: 'error.main',
                  }
                }}
              >
                {error}
              </Alert>
            )}
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Start VLAN</TableCell>
                    <TableCell>End VLAN</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vlanRanges.map((range) => (
                    <TableRow key={range.id}>
                      <TableCell>{range.start_vlan}</TableCell>
                      <TableCell>{range.end_vlan}</TableCell>
                      <TableCell>{range.region_name}</TableCell>
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
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ManageVLANBlocks;