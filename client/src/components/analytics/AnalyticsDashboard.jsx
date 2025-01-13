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
  ToggleButtonGroup,
  ToggleButton,
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
import AssignedGroupAnalysis from './AssignedGroupAnalysis';
import EnhancedTrends from './EnhancedTrends';
import AnalyticsSummary from './AnalyticsSummary';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalyticsDashboard = ({ selectedFile }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedSheet, setSelectedSheet] = useState('overall');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [generatingPpt, setGeneratingPpt] = useState(false);
  const [pptSuccess, setPptSuccess] = useState(false);
  const [timeframe, setTimeframe] = useState('weekly');

  useEffect(() => {
    if (selectedFile) {
      fetchAnalytics();
    }
  }, [selectedFile]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/analytics/data', {
        params: {
          fileId: selectedFile.id,
          type: 'all'
        },
      });
     
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

  const handleTimeframeChange = (event, newTimeframe) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };

  const getCurrentData = () => {
    if (!data) {
      console.log('No data available');
      return null;
    }
    const currentData = selectedSheet === 'overall' ? data.overall : data.sheets[selectedSheet];
 
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
    
      return null;
    }
   
    const summary = currentData.summary;
    if (!summary) {
     
      return (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No summary data available for this sheet
        </Alert>
      );
    }

    return (
      <Box sx={{ width: '100%'}}>
        {/* Main Metrics in Tabs */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom right, #2196f3, #1976d2)',
                color: 'white'
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'light' }}>
                Total Incidents
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {summary.totalIncidents || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom right, #4caf50, #388e3c)',
                color: 'white'
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'light' }}>
                Average MTTR
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {summary.avgMTTRFormatted || 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, opacity: 0.8 }}>
                (HH:MM:SS)
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom right, #ff9800, #f57c00)',
                color: 'white'
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'light' }}>
                Total Clients Affected
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {summary.totalClientsAffected.toLocaleString() || 0}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Fault Types Table */}
        <Paper elevation={3} sx={{ mt: 3, width: '100%', mb: 4 }}>
          <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            Fault Types Distribution
          </Typography>
          <Box sx={{ p: 2 }}>
            <Grid container sx={{ 
              borderBottom: 2, 
              borderColor: 'primary.main', 
              pb: 1, 
              mb: 1,
              fontWeight: 'bold'
            }}>
              <Grid item xs={8}>
                <Typography variant="subtitle1">Fault Type</Typography>
              </Grid>
              <Grid item xs={2} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1">Count</Typography>
              </Grid>
              <Grid item xs={2} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1">%</Typography>
              </Grid>
            </Grid>
            {summary.faultTypes && Object.entries(summary.faultTypes)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count], index) => {
                const percentage = ((count / summary.totalIncidents) * 100).toFixed(1);
                return (
                  <Grid 
                    container 
                    key={type} 
                    sx={{ 
                      py: 1,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <Grid item xs={8}>
                      <Typography>{type}</Typography>
                    </Grid>
                    <Grid item xs={2} sx={{ textAlign: 'center' }}>
                      <Typography>{count}</Typography>
                    </Grid>
                    <Grid item xs={2} sx={{ textAlign: 'center' }}>
                      <Typography>{percentage}%</Typography>
                    </Grid>
                  </Grid>
                );
              })}
          </Box>
        </Paper>

        {/* Detailed Analytics Summary */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Detailed Fault Analysis
          </Typography>
          <AnalyticsSummary data={summary} />
        </Box>
      </Box>
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
    <Box sx={{ width: '100%', p: 3 }}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : data ? (
        <>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <FormControl size="small">
                  <InputLabel>Sheet</InputLabel>
                  <Select value={selectedSheet} onChange={handleSheetChange} label="Sheet">
                    <MenuItem value="overall">Overall</MenuItem>
                    {data.sheets && Object.keys(data.sheets).map(sheet => (
                      <MenuItem key={sheet} value={sheet}>{sheet}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item>
                <ToggleButtonGroup
                  value={timeframe}
                  exclusive
                  onChange={handleTimeframeChange}
                  size="small"
                >
                  <ToggleButton value="weekly">Weekly</ToggleButton>
                  <ToggleButton value="monthly">Monthly</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<PptIcon />}
                  onClick={handleGeneratePowerPoint}
                  disabled={generatingPpt}
                >
                  {generatingPpt ? 'Generating...' : 'Generate PowerPoint'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Summary" value="summary" />
            <Tab label="Trends" value="trends" />
            <Tab label="Assigned Groups" value="assigned" />
            <Tab label="Regional" value="regional" />
            <Tab label="Impact" value="impact" />
          </Tabs>

          {activeTab === 'summary' && renderSummary()}
          {activeTab === 'trends' && (
            <>
              {renderTrends()}
              <Box sx={{ mt: 4 }}>
                <EnhancedTrends data={getCurrentData()} timeframe={timeframe} />
              </Box>
            </>
          )}
          {activeTab === 'assigned' && (
            <AssignedGroupAnalysis 
              data={getCurrentData()}
              timeframe={timeframe}
            />
          )}
          {activeTab === 'regional' && renderRegional()}
          {activeTab === 'impact' && renderImpact()}
        </>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select a file to view analytics
        </Alert>
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