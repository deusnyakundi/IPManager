import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Container,
  Grid,
  TextField
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import api from '../../utils/api';
import SearchIcon from '@mui/icons-material/Search';

const OLT_MODELS = [
  { id: 'MA5800X7', name: 'MA5800-X7' },
  { id: 'MA5800X2', name: 'MA5800-X2' }
];

const ConfigurationGenerator = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedOLT, setSelectedOLT] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAssignments();
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/config/all-assignments', {
        params: { search: searchTerm }
      });
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleGenerateConfig = async (assignment) => {
    if (!selectedOLT) {
      alert('Please select an OLT model');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/config/generate', {
        assignmentId: assignment.id,
        oltModel: selectedOLT
      }, { responseType: 'blob' });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${assignment.site_name}_${selectedOLT}.cfg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating configuration:', error);
    } finally {
      setLoading(false);
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
              m: 0,
              '& .MuiGrid-item': { 
                p: 0,
                m: 0
              }
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
                Configuration Generator
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
                  variant="outlined"
                  placeholder="Search sites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1.2rem' }} />,
                    sx: { 
                      height: '32px',
                      minHeight: '32px',
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-input': {
                        padding: '2px 14px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                    }
                  }}
                />
                <FormControl sx={{ width: 200 }} size="small">
                  <InputLabel size="small">OLT Model</InputLabel>
                  <Select
                    value={selectedOLT}
                    onChange={(e) => setSelectedOLT(e.target.value)}
                    label="OLT Model"
                    sx={{ 
                      height: '32px',
                      minHeight: '32px',
                      '& .MuiOutlinedInput-input': {
                        padding: '2px 14px',
                      }
                    }}
                  >
                    {OLT_MODELS.map(model => (
                      <MenuItem key={model.id} value={model.id}>
                        {model.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                    <TableCell>Site Name</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>VLAN</TableCell>
                    <TableCell>Primary VCID</TableCell>
                    <TableCell>Secondary VCID</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.site_name}</TableCell>
                      <TableCell>{assignment.assigned_ip}</TableCell>
                      <TableCell>{assignment.management_vlan}</TableCell>
                      <TableCell>{assignment.primary_vcid}</TableCell>
                      <TableCell>{assignment.secondary_vcid}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleGenerateConfig(assignment)}
                          disabled={!selectedOLT || loading}
                          size="small"
                          sx={{ 
                            height: '32px',
                            minHeight: '32px'
                          }}
                        >
                          Generate Config
                        </Button>
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

export default ConfigurationGenerator; 