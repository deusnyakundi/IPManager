import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../utils/api';

const ManageVCIDRanges = () => {
  const [vcidRanges, setVCIDRanges] = useState([]);
  const [regions, setRegions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    region_id: '',
    start_primary_vcid: '',
    end_primary_vcid: '',
    start_secondary_vcid: '',
    end_secondary_vcid: '',
    start_vsi_id: '',
    end_vsi_id: ''
  });

  useEffect(() => {
    console.log('ManageVCIDRanges mounted');
    fetchVCIDRanges();
    fetchRegions();
  }, []);

  const fetchVCIDRanges = async () => {
    console.log('Fetching VCID ranges...');
    try {
      const response = await api.get('/vcid/ranges');
      console.log('VCID ranges response:', response.data);
      setVCIDRanges(response.data);
    } catch (error) {
      console.log('API endpoint:', '/vcid/ranges');
      console.log('Error response:', error.response);
      console.error('Error details:', error.response || error);
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
    setLoading(true);
    try {
      await api.post('/vcid/ranges', formData);
      setOpen(false);
      fetchVCIDRanges();
      setFormData({
        region_id: '',
        start_primary_vcid: '',
        end_primary_vcid: '',
        start_secondary_vcid: '',
        end_secondary_vcid: '',
        start_vsi_id: '',
        end_vsi_id: ''
      });
    } catch (error) {
      console.error('Error creating VCID range:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/vcid/ranges/${id}`);
      fetchVCIDRanges();
    } catch (error) {
      console.error('Error deleting VCID range:', error);
    }
  };

  return (
    <Container 
      maxWidth="xl"
      disableGutters
      sx={{ 
        height: '100vh',  // Set full viewport height
        backgroundColor: 'background.paper', 
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
            spacing={1}
            sx={{ 
              minHeight: '36px',
              py: 0
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
                VCID Ranges
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpen(true)}
                size="small"
                sx={{ height: '32px' }}
              >
                Add VCID Range
              </Button>
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
                    <TableCell>Primary VCID Range</TableCell>
                    <TableCell>Secondary VCID Range</TableCell>
                    <TableCell>VSI ID Range</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vcidRanges.map((range) => (
                    <TableRow key={range.id}>
                      <TableCell>{range.region_name}</TableCell>
                      <TableCell>{`${range.start_primary_vcid} - ${range.end_primary_vcid}`}</TableCell>
                      <TableCell>{`${range.start_secondary_vcid} - ${range.end_secondary_vcid}`}</TableCell>
                      <TableCell>{`${range.start_vsi_id} - ${range.end_vsi_id}`}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={() => handleDelete(range.id)}
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

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            '& .MuiDialogTitle-root': {
              fontSize: '1.25rem',
              p: 2,
            },
            '& .MuiDialogContent-root': {
              p: 2,
            },
            '& .MuiDialogActions-root': {
              p: 2,
            },
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add VCID Range</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Region</InputLabel>
                <Select
                  value={formData.region_id}
                  onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                  label="Region"
                  required
                >
                  {regions.map((region) => (
                    <MenuItem key={region.id} value={region.id}>
                      {region.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  size="small"
                  label="Start Primary VCID"
                  type="number"
                  value={formData.start_primary_vcid}
                  onChange={(e) => setFormData({ ...formData, start_primary_vcid: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  size="small"
                  label="End Primary VCID"
                  type="number"
                  value={formData.end_primary_vcid}
                  onChange={(e) => setFormData({ ...formData, end_primary_vcid: e.target.value })}
                  fullWidth
                  required
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  size="small"
                  label="Start Secondary VCID"
                  type="number"
                  value={formData.start_secondary_vcid}
                  onChange={(e) => setFormData({ ...formData, start_secondary_vcid: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  size="small"
                  label="End Secondary VCID"
                  type="number"
                  value={formData.end_secondary_vcid}
                  onChange={(e) => setFormData({ ...formData, end_secondary_vcid: e.target.value })}
                  fullWidth
                  required
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  size="small"
                  label="Start VSI ID"
                  type="number"
                  value={formData.start_vsi_id}
                  onChange={(e) => setFormData({ ...formData, start_vsi_id: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  size="small"
                  label="End VSI ID"
                  type="number"
                  value={formData.end_vsi_id}
                  onChange={(e) => setFormData({ ...formData, end_vsi_id: e.target.value })}
                  fullWidth
                  required
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpen(false)}
              size="small"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              size="small"
            >
              Add Range
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ManageVCIDRanges; 