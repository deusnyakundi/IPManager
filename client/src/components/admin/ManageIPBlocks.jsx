import React, { useState, useEffect } from 'react';
import { ipAPI, regionAPI } from '../../utils/api';
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
                Manage IP Blocks
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                alignItems: 'center',
                height: '32px'
              }}>
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
                  onClick={handleAddBlock}
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
                    <TableCell>Block</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ipBlocks.map((block) => (
                    <TableRow key={block.id}>
                      <TableCell>{block.block}</TableCell>
                      <TableCell>{block.regionname}</TableCell>
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
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ManageIPBlocks;