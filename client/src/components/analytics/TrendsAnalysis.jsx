import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  LabelList
} from 'recharts';
import { formatTimeHHMMSS } from '../../utils/timeUtils';

const TrendsAnalysis = ({ data, timeframe = 'weekly' }) => {
  const trendsData = data?.[timeframe] || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1 }}>
          <Typography variant="body2">{`Period: ${label}`}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" style={{ color: entry.color }}>
              {entry.name === 'Average MTTR'
                ? `${entry.name}: ${formatTimeHHMMSS(entry.value)}`
                : `${entry.name}: ${entry.value}${entry.name.includes('SLA') ? '%' : ''}`
              }
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const CustomizedMTTRLabel = (props) => {
    const { x, y, value } = props;
    return (
      <text x={x} y={y - 10} fill="#82ca9d" textAnchor="middle" dominantBaseline="middle">
        {formatTimeHHMMSS(value)}
      </text>
    );
  };

  if (trendsData.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          No trends data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Incident Volume Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Incident Volume and MTTR Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={timeframe === 'weekly' ? 'period' : 'month'} />
                <YAxis yAxisId="left" orientation="left" label={{ value: 'Number of Incidents', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'MTTR (hours)', angle: 90, position: 'insideRight' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="totalIncidents" fill="#8884d8" name="Total Incidents" />
                <Line yAxisId="right" type="monotone" dataKey="avgMTTR" stroke="#82ca9d" name="Average MTTR">
                  <LabelList content={<CustomizedMTTRLabel />} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* SLA Performance Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              SLA Performance Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={timeframe === 'weekly' ? 'period' : 'month'} />
                <YAxis domain={[0, 100]} label={{ value: 'SLA %', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="portFailuresSLA" stroke="#8884d8" name="Port Failures SLA %" />
                <Line type="monotone" dataKey="degradationSLA" stroke="#82ca9d" name="Degradation SLA %" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Incident Type Distribution Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Incident Type Distribution Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={timeframe === 'weekly' ? 'period' : 'month'} />
                <YAxis label={{ value: 'Number of Incidents', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="byIncidentType.portFailures" stackId="a" fill="#8884d8" name="Port Failures" />
                <Bar dataKey="byIncidentType.degradation" stackId="a" fill="#82ca9d" name="Degradations" />
                <Bar dataKey="byIncidentType.multipleLOS" stackId="a" fill="#ffc658" name="Multiple LOS" />
                <Bar dataKey="byIncidentType.oltFailures" stackId="a" fill="#ff8042" name="OLT Failures" />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrendsAnalysis; 