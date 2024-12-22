import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Select, MenuItem, FormControl, InputLabel, Alert, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const ManageVLANRanges = () => {
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
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Manage VLAN Ranges
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Start VLAN"
        value={newRange.start}
        onChange={(e) => setNewRange({ ...newRange, start: e.target.value })}
        sx={{ mr: 2 }}
      />
      <TextField
        label="End VLAN"
        value={newRange.end}
        onChange={(e) => setNewRange({ ...newRange, end: e.target.value })}
        sx={{ mr: 2 }}
      />
      <FormControl sx={{ minWidth: 120, mr: 2 }}>
        <InputLabel>Region</InputLabel>
        <Select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          label="Region"
        >
          {regions.map((region) => (
            <MenuItem key={region.id} value={region.id}>
              {region.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" onClick={handleAddRange}>
        Add
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Start VLAN</TableCell>
              <TableCell>End VLAN</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vlanRanges.map((range) => (
              <TableRow key={range.id}>
                <TableCell>{range.start_vlan}</TableCell>
                <TableCell>{range.end_vlan}</TableCell>
                <TableCell>{range.region_name}</TableCell> {/* Ensure this matches the backend response */}
                <TableCell>
                  <IconButton edge="end" onClick={() => handleDeleteRange(range.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ManageVLANRanges;