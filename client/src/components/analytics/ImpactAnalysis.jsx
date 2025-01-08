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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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

const ImpactAnalysis = ({ data }) => {
  const theme = useTheme();
  const [category, setCategory] = useState('port_failures');

  if (!data) {
    return null;
  }

  const handleCategoryChange = (event, newCategory) => {
    if (newCategory !== null) {
      setCategory(newCategory);
    }
  };

  const {
    highImpactIncidents,
    clientImpactDistribution,
    mttrDistribution,
  } = data;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
  ];

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
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                High Impact Incidents
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticket Number</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell>Fault Type</TableCell>
                      <TableCell>Reported Date</TableCell>
                      <TableCell>Cleared Date</TableCell>
                      <TableCell>MTTR (hours)</TableCell>
                      <TableCell>Clients Affected</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {highImpactIncidents[category]?.map((incident) => (
                      <TableRow key={incident.ticket_number}>
                        <TableCell>{incident.ticket_number}</TableCell>
                        <TableCell>{incident.region}</TableCell>
                        <TableCell>{incident.fault_type}</TableCell>
                        <TableCell>{formatDate(incident.reported_date)}</TableCell>
                        <TableCell>{formatDate(incident.cleared_date)}</TableCell>
                        <TableCell>{parseFloat(incident.mttr).toFixed(2)}</TableCell>
                        <TableCell>{incident.clients_affected}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Client Impact Distribution
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientImpactDistribution[category]}
                      dataKey="count"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {clientImpactDistribution[category]?.map((entry, index) => (
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

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                MTTR Distribution
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mttrDistribution[category]}
                      dataKey="count"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {mttrDistribution[category]?.map((entry, index) => (
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
                Impact Metrics Comparison
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      ...clientImpactDistribution[category]?.map(item => ({
                        range: item.range,
                        'Client Impact': item.count,
                      })) || [],
                      ...mttrDistribution[category]?.map(item => ({
                        range: item.range,
                        'MTTR': item.count,
                      })) || [],
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="Client Impact"
                      fill={theme.palette.primary.main}
                    />
                    <Bar
                      dataKey="MTTR"
                      fill={theme.palette.secondary.main}
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

export default ImpactAnalysis; 