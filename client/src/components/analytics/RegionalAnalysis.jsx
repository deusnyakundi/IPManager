import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const RegionalAnalysis = ({ data }) => {
  const theme = useTheme();
  const [category, setCategory] = useState('port_failures');
  const [metric, setMetric] = useState('incidents');

  if (!data) {
    return null;
  }

  const handleCategoryChange = (event, newCategory) => {
    if (newCategory !== null) {
      setCategory(newCategory);
    }
  };

  const handleMetricChange = (event, newMetric) => {
    if (newMetric !== null) {
      setMetric(newMetric);
    }
  };

  const {
    incidentsByRegion,
    mttrByRegion,
    clientsAffectedByRegion,
  } = data;

  const getMetricData = () => {
    switch (metric) {
      case 'incidents':
        return incidentsByRegion[category]?.map(region => ({
          name: region.region,
          value: parseInt(region.incident_count),
        })) || [];
      case 'mttr':
        return mttrByRegion[category]?.map(region => ({
          name: region.region,
          value: parseFloat(region.mttr).toFixed(2),
        })) || [];
      case 'clients':
        return clientsAffectedByRegion[category]?.map(region => ({
          name: region.region,
          value: parseInt(region.clients),
        })) || [];
      default:
        return [];
    }
  };

  const metricData = getMetricData();
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
  ];

  const getMetricLabel = () => {
    switch (metric) {
      case 'incidents':
        return 'Number of Incidents';
      case 'mttr':
        return 'Average MTTR (hours)';
      case 'clients':
        return 'Clients Affected';
      default:
        return '';
    }
  };

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
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

        <ToggleButtonGroup
          value={metric}
          exclusive
          onChange={handleMetricChange}
          size="small"
        >
          <ToggleButton value="incidents">Incidents</ToggleButton>
          <ToggleButton value="mttr">MTTR</ToggleButton>
          <ToggleButton value="clients">Clients</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Regional Distribution - {getMetricLabel()}
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metricData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="value"
                      fill={theme.palette.primary.main}
                      name={getMetricLabel()}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribution by Region
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metricData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label
                    >
                      {metricData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Regional Comparison
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="value"
                      fill={theme.palette.primary.main}
                      name={getMetricLabel()}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RegionalAnalysis; 