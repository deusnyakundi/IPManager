import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { formatTimeHHMMSS } from '../../utils/timeUtils';

const SummaryStats = ({ data }) => {
  // Add logging to debug MTTR value
  console.log('Summary Stats MTTR:', {
    rawValue: data?.avgMTTR,
    formatted: data?.avgMTTR ? formatTimeHHMMSS(data.avgMTTR) : 'N/A'
  });

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          No summary data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Total Incidents */}
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minHeight: '160px',
              justifyContent: 'center'
            }}
          >
            <Typography variant="h6" gutterBottom align="center">
              Total Incidents
            </Typography>
            <Typography variant="h4" color="primary">
              {data.totalIncidents.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        {/* Average MTTR */}
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minHeight: '160px',
              justifyContent: 'center'
            }}
          >
            <Typography variant="h6" gutterBottom align="center">
              Average MTTR
            </Typography>
            <Typography variant="h4" color="primary">
              {formatTimeHHMMSS(data.avgMTTR)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (HH:MM:SS)
            </Typography>
          </Paper>
        </Grid>

        {/* Total Clients Affected */}
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minHeight: '160px',
              justifyContent: 'center'
            }}
          >
            <Typography variant="h6" gutterBottom align="center">
              Total Clients Affected
            </Typography>
            <Typography variant="h4" color="primary">
              {data.totalClientsAffected.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        {/* Fault Type Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fault Type Distribution
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(data.faultTypes).map(([type, count]) => (
                <Grid item xs={12} sm={6} md={3} key={type}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.default',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minHeight: '100px',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom align="center">
                      {type}
                    </Typography>
                    <Typography variant="h5">
                      {count.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SummaryStats; 