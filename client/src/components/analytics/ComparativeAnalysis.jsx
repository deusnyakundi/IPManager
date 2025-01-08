import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
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
} from 'recharts';
import { CompareArrows as CompareIcon } from '@mui/icons-material';
import api from '../../utils/api';

const ComparisonTypes = {
  TIME: 'time',
  REGION: 'region',
};

const TimeRanges = {
  LAST_MONTH: 'last_month',
  LAST_QUARTER: 'last_quarter',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom',
};

const ComparisonMetrics = {
  INCIDENTS: 'incidents',
  MTTR: 'mttr',
  CLIENTS_AFFECTED: 'clients_affected',
};

const ComparisonViews = {
  CHART: 'chart',
  TABLE: 'table',
  SUMMARY: 'summary',
};

const ComparativeAnalysis = ({ selectedFile }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparisonType, setComparisonType] = useState(ComparisonTypes.TIME);
  const [timeRange, setTimeRange] = useState(TimeRanges.LAST_MONTH);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [metric, setMetric] = useState(ComparisonMetrics.INCIDENTS);
  const [view, setView] = useState(ComparisonViews.CHART);
  const [comparisonData, setComparisonData] = useState(null);
  const [availableRegions, setAvailableRegions] = useState([]);

  useEffect(() => {
    if (selectedFile) {
      fetchAvailableRegions();
    }
  }, [selectedFile]);

  const fetchAvailableRegions = async () => {
    try {
      const response = await api.get('/analytics/regions', {
        params: { fileId: selectedFile.id },
      });
      setAvailableRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchComparisonData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/analytics/compare', {
        params: {
          fileId: selectedFile.id,
          type: comparisonType,
          timeRange,
          regions: selectedRegions,
          metric,
        },
      });
      setComparisonData(response.data);
    } catch (error) {
      console.error('Comparison error:', error);
      setError('Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  const renderTimeComparison = () => {
    if (!comparisonData?.timeComparison) return null;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={comparisonData.timeComparison}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#8884d8"
            name="Current Period"
          />
          <Line
            type="monotone"
            dataKey="previous"
            stroke="#82ca9d"
            name="Previous Period"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderRegionalComparison = () => {
    if (!comparisonData?.regionalComparison) return null;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={comparisonData.regionalComparison}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="region" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedRegions.map((region, index) => (
            <Bar
              key={region}
              dataKey={region}
              fill={`#${Math.floor(Math.random()*16777215).toString(16)}`}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderSummary = () => {
    if (!comparisonData?.summary) return null;

    return (
      <Grid container spacing={3}>
        {Object.entries(comparisonData.summary).map(([key, value]) => (
          <Grid item xs={12} md={4} key={key}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {key.replace('_', ' ').toUpperCase()}
              </Typography>
              <Typography variant="h4">
                {typeof value === 'number' ? value.toFixed(2) : value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Comparative Analysis
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Comparison Type</InputLabel>
              <Select
                value={comparisonType}
                onChange={(e) => setComparisonType(e.target.value)}
              >
                <MenuItem value={ComparisonTypes.TIME}>Time Period</MenuItem>
                <MenuItem value={ComparisonTypes.REGION}>Regional</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {comparisonType === ComparisonTypes.TIME && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value={TimeRanges.LAST_MONTH}>Last Month</MenuItem>
                  <MenuItem value={TimeRanges.LAST_QUARTER}>Last Quarter</MenuItem>
                  <MenuItem value={TimeRanges.LAST_YEAR}>Last Year</MenuItem>
                  <MenuItem value={TimeRanges.CUSTOM}>Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {comparisonType === ComparisonTypes.REGION && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Regions</InputLabel>
                <Select
                  multiple
                  value={selectedRegions}
                  onChange={(e) => setSelectedRegions(e.target.value)}
                >
                  {availableRegions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Metric</InputLabel>
              <Select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
              >
                <MenuItem value={ComparisonMetrics.INCIDENTS}>Incidents</MenuItem>
                <MenuItem value={ComparisonMetrics.MTTR}>MTTR</MenuItem>
                <MenuItem value={ComparisonMetrics.CLIENTS_AFFECTED}>
                  Clients Affected
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={fetchComparisonData}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CompareIcon />}
            >
              {loading ? 'Comparing...' : 'Compare'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {comparisonData && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={view}
              onChange={(e, newValue) => setView(newValue)}
              centered
            >
              <Tab label="Chart" value={ComparisonViews.CHART} />
              <Tab label="Summary" value={ComparisonViews.SUMMARY} />
            </Tabs>
          </Box>

          {view === ComparisonViews.CHART && (
            comparisonType === ComparisonTypes.TIME
              ? renderTimeComparison()
              : renderRegionalComparison()
          )}
          {view === ComparisonViews.SUMMARY && renderSummary()}
        </>
      )}
    </Paper>
  );
};

export default ComparativeAnalysis; 