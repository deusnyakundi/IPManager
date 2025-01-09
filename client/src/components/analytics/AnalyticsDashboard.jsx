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
  const [selectedSheet, setSelectedSheet] = useState('overall');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [generatingPpt, setGeneratingPpt] = useState(false);
  const [pptSuccess, setPptSuccess] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      fetchAnalytics();
    }
  }, [selectedFile]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching analytics for file:', selectedFile);
      const response = await api.get('/analytics/analyze', {
        params: {
          fileId: selectedFile.id,
          type: 'all'
        },
      });
      console.log('Raw analytics response:', response);
      console.log('Analytics data:', response.data);
      console.log('Sheets available:', response.data?.sheets ? Object.keys(response.data.sheets) : 'No sheets');
      setData(response.data);
    } catch (error) {
      console.error('Analytics error:', error);
      setError('Failed to fetch analytics data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSheetChange = (event) => {
    setSelectedSheet(event.target.value);
  };

  const getCurrentData = () => {
    if (!data) {
      console.log('No data available');
      return null;
    }
    const currentData = selectedSheet === 'overall' ? data.overall : data.sheets[selectedSheet];
    console.log('Current data for sheet', selectedSheet, ':', currentData);
    return currentData;
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
    const currentData = getCurrentData();
    if (!currentData) {
      console.log('No current data available for summary');
      return null;
    }
    console.log('Rendering summary with data:', currentData.summary);
    const summary = currentData.summary;
    if (!summary) {
      console.log('No summary data available');
      return (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No summary data available for this sheet
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Incidents</h3>
          <p className="text-2xl">{summary.totalIncidents || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Average MTTR (Hours)</h3>
          <p className="text-2xl">{summary.avgMTTR ? summary.avgMTTR.toFixed(2) : 'N/A'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Clients Affected</h3>
          <p className="text-2xl">{summary.totalClientsAffected || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Fault Types</h3>
          <div className="max-h-40 overflow-y-auto">
            {summary.faultTypes && Object.entries(summary.faultTypes)
              .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
              .map(([type, count]) => (
                <div key={type} className="flex justify-between items-center text-sm mb-1">
                  <span className="truncate mr-2">{type}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTrends = () => {
    const currentData = getCurrentData();
    if (!currentData || !currentData.trends) {
      console.log('No trends data available:', currentData);
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No trends data available for this selection
        </Alert>
      );
    }

    const { daily, weekly, monthly } = currentData.trends;
    console.log('Trends data:', { daily, weekly, monthly });
    
    // Sort data by date/week/month
    const sortedDaily = daily ? [...daily].sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
    const sortedWeekly = weekly ? [...weekly].sort((a, b) => a.week - b.week) : [];
    const sortedMonthly = monthly ? [...monthly].sort((a, b) => a.month.localeCompare(b.month)) : [];

    return (
      <Grid container spacing={3}>
        {/* Monthly Trends */}
        {sortedMonthly.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Monthly Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sortedMonthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="incidents"
                    stroke="#8884d8"
                    name="Incidents"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgMTTR"
                    stroke="#82ca9d"
                    name="Avg MTTR"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderRegional = () => {
    const currentData = getCurrentData();
    if (!currentData || !currentData.regional) {
      console.log('No regional data available:', currentData);
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No regional data available for this selection
        </Alert>
      );
    }

    console.log('Regional data:', currentData.regional);

    // Combine similar regions and aggregate their data
    const combinedRegions = currentData.regional.reduce((acc, curr) => {
      const region = curr.region.toLowerCase().replace(/\./g, '').trim();
      if (!acc[region]) {
        acc[region] = {
          region: curr.region,
          incidents: 0,
          avgMTTR: 0,
          clientsAffected: 0,
          mttrCount: 0
        };
      }
      acc[region].incidents += curr.incidents;
      acc[region].clientsAffected += curr.clientsAffected;
      if (curr.avgMTTR) {
        acc[region].avgMTTR += curr.avgMTTR;
        acc[region].mttrCount++;
      }
      return acc;
    }, {});

    // Convert back to array and calculate final averages
    const regionalData = Object.values(combinedRegions).map(region => ({
      ...region,
      avgMTTR: region.mttrCount ? region.avgMTTR / region.mttrCount : 0
    }));

    return (
      <Grid container spacing={3}>
        {/* Regional Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Regional Incident Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={regionalData}
                  dataKey="incidents"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ region, incidents }) => `${region}: ${incidents}`}
                >
                  {regionalData.map((entry, index) => (
                    <Cell key={entry.region} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Regional MTTR */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Regional Average MTTR
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="avgMTTR" 
                  fill="#82ca9d" 
                  name="Average MTTR (Hours)"
                  label={{ position: 'top' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderImpact = () => {
    const currentData = getCurrentData();
    if (!currentData || !currentData.impact) {
      console.log('No impact data available:', currentData);
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No impact data available for this selection
        </Alert>
      );
    }

    console.log('Impact data:', currentData.impact);
    const { highImpactIncidents, impactDistribution } = currentData.impact;

    if (!highImpactIncidents || !impactDistribution) {
      return (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Impact data is incomplete
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {/* Impact Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Impact Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={impactDistribution}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ range, count }) => `${range}: ${count}`}
                >
                  {impactDistribution.map((entry, index) => (
                    <Cell key={entry.range} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* High Impact Incidents */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 High Impact Incidents
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {highImpactIncidents.map((incident, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2">
                    #{index + 1} - Ticket: {incident.ticket_number || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Clients Affected: {incident.clients_affected || 0}
                  </Typography>
                  <Typography variant="body2">
                    Region: {incident.region || 'N/A'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
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

  const currentData = getCurrentData();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Paper sx={{ flexGrow: 1, mr: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Summary" value="summary" />
              <Tab label="Trends" value="trends" />
              <Tab label="Regional" value="regional" />
              <Tab label="Impact" value="impact" />
            </Tabs>
          </Paper>
          <FormControl sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel>Sheet</InputLabel>
            <Select
              value={selectedSheet}
              onChange={handleSheetChange}
              label="Sheet"
            >
              <MenuItem value="overall">Overall</MenuItem>
              {data?.sheets && Object.keys(data.sheets).map(sheet => (
                <MenuItem key={sheet} value={sheet}>{sheet}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
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
          {selectedSheet === 'overall' && activeTab === 'trends' && renderTrends()}
          {activeTab === 'regional' && renderRegional()}
          {activeTab === 'impact' && renderImpact()}
          {selectedSheet !== 'overall' && activeTab === 'trends' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Trend analysis is only available for overall statistics
            </Alert>
          )}
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