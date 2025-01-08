import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Snackbar,
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PictureAsPdf as PptIcon } from '@mui/icons-material';
import api from '../../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalyticsDashboard = ({ selectedFile }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [generatingPpt, setGeneratingPpt] = useState(false);
  const [pptSuccess, setPptSuccess] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      fetchAnalytics(activeTab);
    }
  }, [selectedFile, activeTab]);

  const fetchAnalytics = async (type) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/analytics/analyze', {
        params: {
          fileId: selectedFile.id,
          type,
        },
      });
      setData(response.data);
    } catch (error) {
      console.error('Analytics error:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGeneratePowerPoint = async () => {
    setGeneratingPpt(true);
    try {
      const response = await api.get('/analytics/powerpoint', {
        params: {
          fileId: selectedFile.id,
        },
        responseType: 'blob',
      });

      // Create a blob from the response data
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });

      // Create a link element and trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'network_analysis.pptx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setPptSuccess(true);
    } catch (error) {
      console.error('PowerPoint generation error:', error);
      setError('Failed to generate PowerPoint presentation');
    } finally {
      setGeneratingPpt(false);
    }
  };

  const renderSummary = () => {
    if (!data) return null;

    return (
      <Grid container spacing={3}>
        {/* Total Incidents Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Incidents by Type
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(data.totalIncidents).map(([key, value]) => ({
                name: key.replace('_', ' ').toUpperCase(),
                value,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Average MTTR Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Average MTTR by Type
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(data.avgMTTR).map(([key, value]) => ({
                name: key.replace('_', ' ').toUpperCase(),
                value: parseFloat(value).toFixed(2),
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Clients Affected Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Clients Affected by Type
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(data.totalClientsAffected).map(([key, value]) => ({
                    name: key.replace('_', ' ').toUpperCase(),
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(data.totalClientsAffected).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Fault Types */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Fault Types
            </Typography>
            {Object.entries(data.topFaultTypes).map(([category, types]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {category.replace('_', ' ').toUpperCase()}:
                </Typography>
                <ul>
                  {types.map((type, index) => (
                    <li key={index}>{type}</li>
                  ))}
                </ul>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderTrends = () => {
    if (!data) return null;

    return (
      <Grid container spacing={3}>
        {Object.entries(data.monthly).map(([category, trends]) => (
          <Grid item xs={12} key={category}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {category.replace('_', ' ').toUpperCase()} Monthly Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="incident_count"
                    stroke="#8884d8"
                    name="Incidents"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avg_mttr"
                    stroke="#82ca9d"
                    name="Avg MTTR"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderRegional = () => {
    if (!data) return null;

    return (
      <Grid container spacing={3}>
        {Object.entries(data.incidentsByRegion).map(([category, regions]) => (
          <Grid item xs={12} key={category}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {category.replace('_', ' ').toUpperCase()} by Region
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="incident_count" fill="#8884d8" name="Incidents" />
                  <Bar dataKey="avg_mttr" fill="#82ca9d" name="Avg MTTR" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderImpact = () => {
    if (!data) return null;

    return (
      <Grid container spacing={3}>
        {/* Client Impact Distribution */}
        {Object.entries(data.clientImpactDistribution).map(([category, distribution]) => (
          <Grid item xs={12} md={6} key={`${category}-clients`}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {category.replace('_', ' ').toUpperCase()} Client Impact Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        ))}

        {/* MTTR Distribution */}
        {Object.entries(data.mttrDistribution).map(([category, distribution]) => (
          <Grid item xs={12} md={6} key={`${category}-mttr`}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {category.replace('_', ' ').toUpperCase()} MTTR Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  if (!selectedFile) {
    return (
      <Alert severity="info">
        Please select a file to view analytics
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Paper sx={{ flexGrow: 1, mr: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Summary" value="summary" />
            <Tab label="Trends" value="trends" />
            <Tab label="Regional" value="regional" />
            <Tab label="Impact" value="impact" />
          </Tabs>
        </Paper>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PptIcon />}
          onClick={handleGeneratePowerPoint}
          disabled={generatingPpt || !data}
        >
          {generatingPpt ? 'Generating...' : 'Generate PowerPoint'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 'summary' && renderSummary()}
          {activeTab === 'trends' && renderTrends()}
          {activeTab === 'regional' && renderRegional()}
          {activeTab === 'impact' && renderImpact()}
        </>
      )}

      <Snackbar
        open={pptSuccess}
        autoHideDuration={6000}
        onClose={() => setPptSuccess(false)}
        message="PowerPoint presentation generated successfully"
      />
    </Box>
  );
};

export default AnalyticsDashboard; 