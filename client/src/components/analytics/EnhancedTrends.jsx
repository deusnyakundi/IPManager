import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip as MuiTooltip,
  IconButton,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from 'recharts';

const EnhancedTrends = ({ data, timeframe }) => {
  const theme = useTheme();
  const [selectedView, setSelectedView] = useState('incidents');

  if (!data || !data.trends) {
    return null;
  }

  // Extract trends data based on timeframe
  const trendsData = timeframe === 'weekly' ? 
    (data.trends.weekly || []) : 
    (data.trends.monthly || []);

  // Format data for time-based charts
  const formattedData = trendsData.map(item => ({
    period: timeframe === 'weekly' ? `Week ${item.week}` : item.month,
    'Total Incidents': item.incidents || 0,
    'Avg MTTR': item.avgMTTRFormatted || '00:00:00',
    'Avg MTTR Raw': item.avgMTTR || 0,
    'Port Failures SLA (%)': item.portFailuresSLA || 0,
    'Degradation SLA (%)': item.degradationSLA || 0,
    'Clients Affected': item.clientsAffected || 0,
    'Port Failures Clients': item.clientsAffectedByType?.portFailures || 0,
    'Degradation Clients': item.clientsAffectedByType?.degradation || 0,
    'Multiple LOS Clients': item.clientsAffectedByType?.multipleLOS || 0,
    'OLT Failures Clients': item.clientsAffectedByType?.oltFailures || 0,
    isPartialData: item.isPartialData || false,
    ...Object.entries(item.byAssignedGroup || {}).reduce((acc, [group, stats]) => ({
      ...acc,
      [`${group} Incidents`]: stats.totalIncidents || 0,
      [`${group} MTTR`]: stats.avgMTTRFormatted || '00:00:00',
      [`${group} MTTR Raw`]: stats.avgMTTR || 0,
    }), {}),
  }));

  // Custom tooltip formatter for MTTR values and percentages
  const formatTooltipValue = (value, name) => {
    if (name === 'Avg MTTR' || name.endsWith('MTTR')) {
      return value;
    }
    if (name.includes('SLA')) {
      return `${value.toFixed(1)}%`;
    }
    return value;
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setSelectedView(newView);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" gutterBottom>
          Enhanced Trends Analysis - {timeframe === 'weekly' ? 'Weekly' : 'Monthly'} View
          <MuiTooltip title="Partial data periods are indicated with an asterisk (*)">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </MuiTooltip>
        </Typography>
        <ToggleButtonGroup
          value={selectedView}
          exclusive
          onChange={handleViewChange}
          size="small"
        >
          <ToggleButton value="incidents">Incidents</ToggleButton>
          <ToggleButton value="sla">SLA</ToggleButton>
          <ToggleButton value="clients">Clients</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {selectedView === 'incidents' && (
          <>
            {/* Incident and MTTR Trends */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Incident and MTTR Trends
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="period" 
                          tickFormatter={(value) => {
                            const isPartial = formattedData.find(d => d.period === value)?.isPartialData;
                            return isPartial ? `${value}*` : value;
                          }}
                        />
                        <YAxis yAxisId="left" />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right"
                          tickFormatter={(value) => {
                            // Format the tick values in HH:mm:ss
                            const hours = Math.floor(value);
                            const minutes = Math.floor((value - hours) * 60);
                            const seconds = Math.floor(((value - hours) * 60 - minutes) * 60);
                            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                          }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'Avg MTTR') {
                              return [value, name];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Total Incidents"
                          stroke={theme.palette.primary.main}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Avg MTTR"
                          stroke={theme.palette.secondary.main}
                          name="Avg MTTR"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Assigned Group Performance */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assigned Group Performance
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="period"
                          tickFormatter={(value) => {
                            const isPartial = formattedData.find(d => d.period === value)?.isPartialData;
                            return isPartial ? `${value}*` : value;
                          }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {['Adrian', 'Egypro', 'Fireside', 'Soliton', 'Kinde'].map((group, index) => (
                          <Line
                            key={group}
                            type="monotone"
                            dataKey={`${group} Incidents`}
                            stroke={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {selectedView === 'sla' && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  SLA Performance Trends
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period"
                        tickFormatter={(value) => {
                          const isPartial = formattedData.find(d => d.period === value)?.isPartialData;
                          return isPartial ? `${value}*` : value;
                        }}
                      />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={formatTooltipValue} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Port Failures SLA (%)"
                        stroke={theme.palette.primary.main}
                        name="Port Failures SLA"
                      />
                      <Line
                        type="monotone"
                        dataKey="Degradation SLA (%)"
                        stroke={theme.palette.secondary.main}
                        name="Degradation SLA"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {selectedView === 'clients' && (
          <>
            {/* Total Clients Affected Trend */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Clients Affected Trend
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="period"
                          tickFormatter={(value) => {
                            const isPartial = formattedData.find(d => d.period === value)?.isPartialData;
                            return isPartial ? `${value}*` : value;
                          }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="Clients Affected"
                          fill={theme.palette.error.light}
                          stroke={theme.palette.error.main}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Clients Affected by Fault Type */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Clients Affected by Fault Type
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="period"
                          tickFormatter={(value) => {
                            const isPartial = formattedData.find(d => d.period === value)?.isPartialData;
                            return isPartial ? `${value}*` : value;
                          }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Port Failures Clients" stackId="a" fill="#8884d8" />
                        <Bar dataKey="Degradation Clients" stackId="a" fill="#82ca9d" />
                        <Bar dataKey="Multiple LOS Clients" stackId="a" fill="#ffc658" />
                        <Bar dataKey="OLT Failures Clients" stackId="a" fill="#ff8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default EnhancedTrends; 