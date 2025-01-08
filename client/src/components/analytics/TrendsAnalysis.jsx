import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TrendsAnalysis = ({ data }) => {
  const theme = useTheme();
  const [timeframe, setTimeframe] = useState('monthly');
  const [category, setCategory] = useState('port_failures');

  if (!data) {
    return null;
  }

  const handleTimeframeChange = (event, newTimeframe) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };

  const handleCategoryChange = (event, newCategory) => {
    if (newCategory !== null) {
      setCategory(newCategory);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    switch (timeframe) {
      case 'daily':
        return d.toLocaleDateString();
      case 'weekly':
        return `Week ${d.getWeek()}`;
      case 'monthly':
        return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      default:
        return date;
    }
  };

  const trendsData = data[timeframe]?.[category]?.map((item) => ({
    ...item,
    period: formatDate(item.period),
    incident_count: parseInt(item.incident_count),
    avg_mttr: parseFloat(item.avg_mttr).toFixed(2),
    clients_affected: parseInt(item.clients_affected),
  })) || [];

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <ToggleButtonGroup
          value={timeframe}
          exclusive
          onChange={handleTimeframeChange}
          size="small"
        >
          <ToggleButton value="daily">Daily</ToggleButton>
          <ToggleButton value="weekly">Weekly</ToggleButton>
          <ToggleButton value="monthly">Monthly</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={category}
          exclusive
          onChange={handleCategoryChange}
          size="small"
        >
          <ToggleButton value="port_failures">Port Failures</ToggleButton>
          <ToggleButton value="degradations">Degradations</ToggleButton>
          <ToggleButton value="multiple_los">Multiple LOS</ToggleButton>
          <ToggleButton value="olt_failures">OLT Failures</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Incident Count Over Time
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="incident_count"
                      stroke={theme.palette.primary.main}
                      name="Incidents"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average MTTR Trend
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avg_mttr"
                      stroke={theme.palette.secondary.main}
                      name="MTTR (hours)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clients Affected Trend
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="clients_affected"
                      stroke={theme.palette.error.main}
                      name="Affected Clients"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper function to get week number
Date.prototype.getWeek = function() {
  const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

export default TrendsAnalysis; 