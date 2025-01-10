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
  console.log('AnalyticsSummary FULL DATA:', {
    data,
    faultCauses: data?.faultCauses,
    portFailureCauses: data?.portFailureCauses,
    totalClientsAffected: data?.totalClientsAffected,
    sampleCause: data?.faultCauses ? Object.entries(data.faultCauses)[0] : null,
    samplePortFailureCause: data?.portFailureCauses ? Object.entries(data.portFailureCauses)[0] : null
  });

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
    portFailureCauses,
    totalPortFailures
  } = data;

  // Debug log after destructuring
  console.log('After destructuring:', {
    hasFaultCauses: !!faultCauses,
    hasPortFailureCauses: !!portFailureCauses,
    faultCausesEntries: faultCauses ? Object.entries(faultCauses) : [],
    portFailureCausesEntries: portFailureCauses ? Object.entries(portFailureCauses) : []
  });

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Total Incidents */}
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Incidents"
            value={totalIncidents}
            subtitle="Across all categories"
          />
        </Grid>

        {/* Average MTTR */}
        <Grid item xs={12} md={4}>
          <StatCard
            title="Average MTTR"
            value={avgMTTR}
            subtitle="Mean time to resolve"
          />
        </Grid>

        {/* Total Clients Affected */}
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Clients Affected"
            value={totalClientsAffected.toLocaleString()}
            subtitle="Cumulative impact"
          />
        </Grid>

        {/* Fault Cause Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fault Cause Distribution
            </Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cause</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Clients Affected</TableCell>
                    <TableCell align="right">% of Total Clients</TableCell>
                    <TableCell align="right">Avg MTTR</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(faultCauses)
                    .sort(([, a], [, b]) => (b.clientsAffected || 0) - (a.clientsAffected || 0))
                    .map(([cause, stats]) => (
                      <TableRow key={cause}>
                        <TableCell>{cause}</TableCell>
                        <TableCell align="right">{stats.count}</TableCell>
                        <TableCell align="right">{stats.clientsAffected.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {((stats.clientsAffected / totalClientsAffected) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell align="right">{stats.avgMTTRFormatted}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        {/* Fault Types by Cause */}
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

        {/* Port Failures by Cause */}
        {portFailureCauses && Object.keys(portFailureCauses).length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Port Failures by Cause
              </Typography>
              <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cause</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Clients Affected</TableCell>
                      <TableCell align="right">Avg MTTR</TableCell>
                      <TableCell align="right">% of Port Failures</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(portFailureCauses)
                      .sort(([, a], [, b]) => b.count - a.count)
                      .map(([cause, stats]) => (
                        <TableRow key={cause}>
                          <TableCell>{cause}</TableCell>
                          <TableCell align="right">{stats.count}</TableCell>
                          <TableCell align="right">{stats.clientsAffected.toLocaleString()}</TableCell>
                          <TableCell align="right">{stats.avgMTTRFormatted}</TableCell>
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
      </Grid>
    </Box>
  );
};

export default AnalyticsSummary; 