import React, { useState, useEffect } from 'react';
import { regionAPI } from '../../utils/api';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from '../common/ConfirmDialog';

const ManageRegions = () => {
  const [regions, setRegions] = useState([]);
  const [newRegion, setNewRegion] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    try {
      await regionAPI.deleteRegion(deleteId);
      setSuccessMessage('Region deleted successfully');
      setShowSuccess(true);
      fetchRegions();
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting region');
    } finally {
      setDeleteId(null);
    }
  };

  const handleAdd = async () => {
    try {
      await regionAPI.post('/regions', { name: newRegion });
      setSuccessMessage('Region added successfully');
      setShowSuccess(true);
      setNewRegion('');
      fetchRegions();
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding region');
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
                Manage Regions
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
                  label="New Region"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  sx={{ 
                    width: '200px',
                    '& .MuiInputBase-root': { 
                      height: '32px',
                      minHeight: '32px'
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '2px 14px',
                    },
                    '& .MuiInputLabel-root': {
                      transform: 'translate(14px, 8px) scale(1)',
                    },
                    '& .MuiInputLabel-shrink': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                    }
                  }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleAddRegion}
                  size="small"
                  sx={{ 
                    height: '32px',
                    minHeight: '32px'
                  }}
                >
                  Add Region
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
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Region</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {regions.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell>{region.name}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteRegion(region.id)}
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

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Region"
        content="Are you sure you want to delete this region? This action cannot be undone."
      />

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManageRegions;