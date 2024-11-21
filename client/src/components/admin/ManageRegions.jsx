import React, { useState, useEffect } from 'react';
import { regionAPI } from '../../utils/api';
import { Typography, Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const ManageRegions = () => {
  const [regions, setRegions] = useState([]);
  const [newRegion, setNewRegion] = useState('');

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await regionAPI.getRegions();
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const handleAddRegion = async () => {
    if (!newRegion) return;
    try {
      await regionAPI.createRegion(newRegion);
      setNewRegion('');
      fetchRegions();
    } catch (error) {
      console.error('Error adding region:', error);
    }
  };

  const handleDeleteRegion = async (id) => {
    try {
      await regionAPI.deleteRegion(id);
      fetchRegions();
    } catch (error) {
      console.error('Error deleting region:', error);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Manage Regions
      </Typography>
      <TextField
        label="New Region"
        value={newRegion}
        onChange={(e) => setNewRegion(e.target.value)}
        sx={{ mr: 2 }}
      />
      <Button variant="contained" onClick={handleAddRegion}>
        Add
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Region</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {regions.map((region) => (
              <TableRow key={region.id}>
                <TableCell>{region.name}</TableCell>
                <TableCell>
                  <IconButton edge="end" onClick={() => handleDeleteRegion(region.id)}>
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

export default ManageRegions;