import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import api from '../utils/api';

const IPBlockUtilization = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [utilizationData, setUtilizationData] = useState([]);

  useEffect(() => {
    fetchUtilizationData();
  }, []);

  const fetchUtilizationData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ip/blocks/utilization');
      setUtilizationData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching IP block utilization:', err);
      setError('Failed to fetch IP block utilization data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        IP Block Utilization
      </Typography>
      <Grid container spacing={2}>
        {utilizationData.map((block) => (
          <Grid item xs={12} key={block.id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {block.block} {block.cluster_name && `(${block.cluster_name})`}
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box flexGrow={1}>
                    <Tooltip 
                      title={`${block.used_subnets} out of ${block.total_subnets} subnets used`}
                      arrow
                    >
                      <LinearProgress 
                        variant="determinate" 
                        value={block.utilization_percentage} 
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: block.utilization_percentage > 80 ? 'error.main' :
                                          block.utilization_percentage > 60 ? 'warning.main' :
                                          'success.main',
                            borderRadius: 5,
                          }
                        }}
                      />
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" color="text.secondary" minWidth={60}>
                    {block.utilization_percentage}%
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {block.used_subnets} / {block.total_subnets} subnets used
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default IPBlockUtilization; 