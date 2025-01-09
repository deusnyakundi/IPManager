import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
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

const StatCard = ({ title, value, subtitle }) => (
  <Card>
    <CardContent>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const AnalyticsSummary = ({ data }) => {
  const theme = useTheme();

  if (!data) {
    return null;
  }

  const {
    totalIncidents,
    avgMTTR,
    totalClientsAffected,
    faultTypes,
    faultCauses,
    faultTypesByCause,
    portFailureCategories,
    totalPortFailures
  } = data;

  const incidentsData = Object.entries(totalIncidents).map(([key, value]) => ({
    name: key.replace('_', ' ').toUpperCase(),
    value,
  }));

  const mttrData = Object.entries(avgMTTR).map(([key, value]) => ({
    name: key.replace('_', ' ').toUpperCase(),
    value: parseFloat(value).toFixed(2),
  }));

  const totalIncidentsCount = Object.values(totalIncidents).reduce(
    (acc, curr) => acc + curr,
    0
  );

  const totalClientsCount = Object.values(totalClientsAffected).reduce(
    (acc, curr) => acc + curr,
    0
  );

  const avgMTTRTotal =
    Object.values(avgMTTR).reduce((acc, curr) => acc + parseFloat(curr), 0) /
    Object.keys(avgMTTR).length;

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
  ];

  return (
    <Box>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Incidents"
            value={totalIncidentsCount}
            subtitle="Across all categories"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Average MTTR"
            value={`${avgMTTRTotal.toFixed(2)}h`}
            subtitle="Mean time to resolve"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Clients Affected"
            value={totalClientsCount}
            subtitle="Cumulative impact"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {portFailureCategories && Object.keys(portFailureCategories).length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Port Failures by Category
              </Typography>
              <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Avg MTTR</TableCell>
                      <TableCell align="right">Clients Affected</TableCell>
                      <TableCell align="right">% of Port Failures</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(portFailureCategories)
                      .sort(([, a], [, b]) => b.count - a.count)
                      .map(([category, stats]) => (
                        <TableRow key={category}>
                          <TableCell>{category}</TableCell>
                          <TableCell align="right">{stats.count}</TableCell>
                          <TableCell align="right">
                            {(stats.mttr / stats.count).toFixed(2)}h
                          </TableCell>
                          <TableCell align="right">{stats.clientsAffected}</TableCell>
                          <TableCell align="right">
                            {((stats.count / totalPortFailures) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Incidents by Type
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average MTTR by Type
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mttrData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill={theme.palette.secondary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribution by Category
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incidentsData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label
                    >
                      {incidentsData.map((entry, index) => (
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
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fault Types Distribution
            </Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(faultTypes)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <TableRow key={type}>
                        <TableCell>{type}</TableCell>
                        <TableCell align="right">{count}</TableCell>
                        <TableCell align="right">
                          {((count / totalIncidents) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fault Causes Distribution
            </Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cause</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(faultCauses)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cause, count]) => (
                      <TableRow key={cause}>
                        <TableCell>{cause}</TableCell>
                        <TableCell align="right">{count}</TableCell>
                        <TableCell align="right">
                          {((count / totalIncidents) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fault Types by Cause
            </Typography>
            <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fault Type</TableCell>
                    <TableCell>Cause</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">% of Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(faultTypesByCause).map(([type, causes]) => (
                    Object.entries(causes)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cause, count]) => (
                        <TableRow key={`${type}-${cause}`}>
                          <TableCell>{type}</TableCell>
                          <TableCell>{cause}</TableCell>
                          <TableCell align="right">{count}</TableCell>
                          <TableCell align="right">
                            {((count / faultTypes[type]) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsSummary; 