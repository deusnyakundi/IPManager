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
  InputLabel
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import api from '../../utils/api';

const OLT_MODELS = [
  { id: 'MA5800X7', name: 'MA5800-X7' },
  { id: 'MA5800X2', name: 'MA5800-X2' }
];

const ConfigurationGenerator = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedOLT, setSelectedOLT] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      console.log('Fetching assignments...');
      const response = await api.get('/config/assignments');
      console.log('Assignments response:', response.data);
      setAssignments(response.data);
    } catch (error) {
      console.error('Full error:', error);
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Configuration Generator
      </Typography>

      <FormControl sx={{ mb: 3, minWidth: 200 }}>
        <InputLabel>OLT Model</InputLabel>
        <Select
          value={selectedOLT}
          onChange={(e) => setSelectedOLT(e.target.value)}
          label="OLT Model"
        >
          {OLT_MODELS.map(model => (
            <MenuItem key={model.id} value={model.id}>
              {model.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TableContainer component={Paper}>
        <Table>
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
  );
};

export default ConfigurationGenerator; 