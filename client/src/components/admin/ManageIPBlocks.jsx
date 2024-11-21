import React, { useState, useEffect } from 'react';
import { ipAPI, regionAPI } from '../../utils/api';
import { Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Select, MenuItem, FormControl, InputLabel, Alert, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import IPInput from '../common/IPInput';

const ManageIPBlocks = () => {
  const [ipBlocks, setIPBlocks] = useState([]);
  const [regions, setRegions] = useState([]);
  const [newBlock, setNewBlock] = useState('');
  const [cidr, setCidr] = useState('24'); // Default CIDR value
  const [selectedRegion, setSelectedRegion] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIPBlocks();
    fetchRegions();
  }, []);

  const fetchIPBlocks = async () => {
    try {
      const response = await ipAPI.getIPBlocks();
      console.log('IP Blocks:', response.data);
      setIPBlocks(response.data);
    } catch (error) {
      console.error('Error fetching IP blocks:', error);
      setError('Failed to fetch IP blocks.');
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await regionAPI.getRegions();
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const validateIP = (ip) => {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const handleAddBlock = async () => {
    if (!newBlock || !selectedRegion || !cidr) {
      setError('Please enter a valid IP block, CIDR, and select a region.');
      return;
    }
    if (!validateIP(newBlock)) {
      setError('Invalid IP address format. Please enter a valid IP.');
      return;
    }
    try {
      const blockWithCidr = `${newBlock}/${cidr}`;
      await ipAPI.createIPBlock({ block: blockWithCidr, regionId: selectedRegion });
      setNewBlock('');
      setCidr('24'); // Reset CIDR to default
      setSelectedRegion('');
      setError('');
      fetchIPBlocks();
    } catch (error) {
      console.error('Error adding IP block:', error);
    }
  };

  const handleDeleteBlock = async (id) => {
    try {
      await ipAPI.deleteIPBlock(id);
      fetchIPBlocks();
    } catch (error) {
      console.error('Error deleting IP block:', error);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Manage IP Blocks
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <IPInput value={newBlock} onChange={setNewBlock} />
      <TextField
        value={cidr}
        onChange={(e) => setCidr(e.target.value)}
        placeholder="CIDR"
        sx={{ width: 80, ml: 2 }}
        inputProps={{ maxLength: 2 }}
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
      <Button variant="contained" onClick={handleAddBlock}>
        Add
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Block</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ipBlocks.map((block) => (
              <TableRow key={block.id}>
                <TableCell>{block.block}</TableCell>
                <TableCell>{block.regionname}</TableCell>
                <TableCell>
                  <IconButton edge="end" onClick={() => handleDeleteBlock(block.id)}>
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

export default ManageIPBlocks;