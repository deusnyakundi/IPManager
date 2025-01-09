import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  LabelList
} from 'recharts';
import { formatTimeHHMMSS } from '../../utils/timeUtils';

const AssignedGroupAnalysis = ({ data, timeframe }) => {
  const formattedData = useMemo(() => {
    if (!data?.assignedGroups) {
      return [];
    }

    return Object.entries(data.assignedGroups).map(([group, stats]) => ({
      name: group,
      // Port Failures
      portFailuresCount: stats.portFailures.count,
      portFailuresMTTR: stats.portFailures.avgMTTR,
      portFailuresMTTRFormatted: stats.portFailures.avgMTTRFormatted,
      portFailuresSLA: stats.portFailures.slaPercentage,
      portFailuresClients: stats.portFailures.clientsAffected,
      // Degradation
      degradationCount: stats.degradation.count,
      degradationMTTR: stats.degradation.avgMTTR,
      degradationMTTRFormatted: stats.degradation.avgMTTRFormatted,
      degradationSLA: stats.degradation.slaPercentage,
      degradationClients: stats.degradation.clientsAffected,
      // Multiple LOS
      multipleLOSCount: stats.multipleLOS.count,
      multipleLOSMTTR: stats.multipleLOS.avgMTTR,
      multipleLOSMTTRFormatted: stats.multipleLOS.avgMTTRFormatted,
      multipleLOSClients: stats.multipleLOS.clientsAffected,
      // OLT Failures
      oltFailuresCount: stats.oltFailures.count,
      oltFailuresMTTR: stats.oltFailures.avgMTTR,
      oltFailuresMTTRFormatted: stats.oltFailures.avgMTTRFormatted,
      oltFailuresClients: stats.oltFailures.clientsAffected
    }));
  }, [data]);

  const CustomizedLabel = (props) => {
    const { x, y, width, value } = props;
    return (
      <text x={x + width / 2} y={y - 10} fill="#666" textAnchor="middle" dominantBaseline="middle">
        {value}
      </text>
    );
  };

  const CustomizedMTTRLabel = (props) => {
    const { x, y, value } = props;
    if (!value) return null;
    
    // Use the formatted MTTR value if available
    const formattedValue = typeof value === 'string' ? value : formatTimeHHMMSS(value);
    
    return (
      <text x={x} y={y} dy={-10} fill="#82ca9d" textAnchor="middle">
        {formattedValue}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <Paper sx={{ p: 1 }}>
        <Typography variant="subtitle2">{label}</Typography>
        {payload.map((entry, index) => {
          let value = entry.value;
          let unit = '';

          // Format based on data key
          if (entry.dataKey.includes('MTTR')) {
            // Use formatted MTTR if available, otherwise format the value
            value = entry.payload[entry.dataKey + 'Formatted'] || formatTimeHHMMSS(value);
          } else if (entry.dataKey.includes('SLA')) {
            value = `${value.toFixed(1)}%`;
          } else if (entry.dataKey.includes('Count')) {
            value = value.toLocaleString();
          } else if (entry.dataKey.includes('Clients')) {
            value = value.toLocaleString();
            unit = ' clients';
          }

          return (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {value}{unit}
            </Typography>
          );
        })}
      </Paper>
    );
  };

  if (formattedData.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          No assigned groups data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Port Failures Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Port Failures by Assigned Group
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" label={{ value: 'Number of Tickets', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'SLA %', angle: 90, position: 'insideRight' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="portFailuresCount" fill="#8884d8" name="Number of Tickets">
                  <LabelList content={<CustomizedLabel />} />
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="portFailuresSLA" stroke="#ff7300" name="SLA %" />
                <Line yAxisId="right" type="monotone" dataKey="portFailuresMTTR" stroke="#82ca9d" name="MTTR (hours)">
                  <LabelList content={<CustomizedMTTRLabel />} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Degradation Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Degradation by Assigned Group
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" label={{ value: 'Number of Tickets', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'SLA %', angle: 90, position: 'insideRight' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="degradationCount" fill="#8884d8" name="Number of Tickets">
                  <LabelList content={<CustomizedLabel />} />
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="degradationSLA" stroke="#ff7300" name="SLA %" />
                <Line yAxisId="right" type="monotone" dataKey="degradationMTTR" stroke="#82ca9d" name="MTTR (hours)">
                  <LabelList content={<CustomizedMTTRLabel />} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Multiple LOS Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Multiple LOS by Assigned Group
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" label={{ value: 'Number of Tickets', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'MTTR (hours)', angle: 90, position: 'insideRight' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="multipleLOSCount" fill="#8884d8" name="Number of Tickets">
                  <LabelList content={<CustomizedLabel />} />
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="multipleLOSMTTR" stroke="#82ca9d" name="MTTR (hours)">
                  <LabelList content={<CustomizedMTTRLabel />} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* OLT Failures Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              OLT Failures by Assigned Group
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" label={{ value: 'Number of Tickets', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'MTTR (hours)', angle: 90, position: 'insideRight' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="oltFailuresCount" fill="#8884d8" name="Number of Tickets">
                  <LabelList content={<CustomizedLabel />} />
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="oltFailuresMTTR" stroke="#82ca9d" name="MTTR (hours)">
                  <LabelList content={<CustomizedMTTRLabel />} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssignedGroupAnalysis; 