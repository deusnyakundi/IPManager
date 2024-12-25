import React, { useState, useEffect } from 'react';
import { mspAPI } from '../../utils/api';
import { Box, Typography, Button, TextField, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, IconButton, Grid, Container } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const ManageMSPs = () => {
  const [msps, setMsps] = useState([]);
  const [formData, setFormData] = useState('');
  const [editingMsp, setEditingMsp] = useState(null);

  useEffect(() => {
    fetchMSPs();
  }, []);

  const fetchMSPs = async () => {
    try {
      const response = await mspAPI.getMSP();
      setMsps(response.data);
    } catch (error) {
      console.error('Error fetching MSPs:', error);
    }
  };

  const handleAddOrUpdateMsp = async () => {
    if (!formData) return;
    try {
      if (editingMsp) {
        await mspAPI.updateMSP(editingMsp.id, formData); // Pass the ID and form data
      } else {
        await mspAPI.createMSP(formData);
      }
      setFormData('');
      setEditingMsp(null);
      fetchMSPs();
    } catch (error) {
      console.error('Error saving MSP:', error);
    }
  };

  const handleDeleteMsp = async (id) => {
    try {
      await mspAPI.deleteMSP(id);
      fetchMSPs();
    } catch (error) {
      console.error('Error deleting MSP:', error);
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
                Manage MSPs
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
                  label={editingMsp ? 'Edit MSP' : 'New MSP'}
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
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
                  onClick={handleAddOrUpdateMsp}
                  size="small"
                  sx={{ 
                    height: '32px',
                    minHeight: '32px'
                  }}
                >
                  {editingMsp ? 'Update MSP' : 'Add MSP'}
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
                    <TableCell>MSP</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {msps.map((msp) => (
                    <TableRow key={msp.id}>
                      <TableCell>{msp.name}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setEditingMsp(msp);
                            setFormData(msp.name);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteMsp(msp.id)}
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

export default ManageMSPs;
