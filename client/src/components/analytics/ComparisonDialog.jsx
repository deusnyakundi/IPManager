import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  Autocomplete,
  TextField,
  Chip,
} from '@mui/material';
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
} from 'recharts';

const ComparisonDialog = ({ open, onClose, fileId }) => {
  const theme = useTheme();
  const [comparisonType, setComparisonType] = useState('time');
  const [timeRange, setTimeRange] = useState('last_month');
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [metric, setMetric] = useState('incidents');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  const regions = [
    'Central',
    'Eastern',
    'Western',
    'Northern',
    'Southern',
    'Coastal',
  ];

  const handleCompare = async () => {
    if (!fileId) return;

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        fileId,
        type: comparisonType,
        ...(comparisonType === 'time' ? { timeRange } : { regions: selectedRegions }),
        metric,
      });

      const response = await fetch(`/api/analytics/comparison?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }

      const data = await response.json();
      setComparisonData(data);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTimeComparison = () => {
    if (!comparisonData?.timeComparison) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Time Period Comparison
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData.timeComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke={theme.palette.primary.main}
                      name="Current Period"
                    />
                    <Line
                      type="monotone"
                      dataKey="previous"
                      stroke={theme.palette.secondary.main}
                      name="Previous Period"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderRegionalComparison = () => {
    if (!comparisonData?.regionalComparison) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Regional Comparison
              </Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData.regionalComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="value"
                      fill={theme.palette.primary.main}
                      name={metric === 'incidents' ? 'Incidents' :
                        metric === 'mttr' ? 'MTTR (hours)' : 'Clients Affected'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Compare Analytics</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Comparison Type</InputLabel>
            <Select
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value)}
              label="Comparison Type"
            >
              <MenuItem value="time">Time Period</MenuItem>
              <MenuItem value="regional">Regional</MenuItem>
            </Select>
          </FormControl>

          {comparisonType === 'time' ? (
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="last_month">Last Month</MenuItem>
                <MenuItem value="last_quarter">Last Quarter</MenuItem>
                <MenuItem value="last_year">Last Year</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Autocomplete
              multiple
              value={selectedRegions}
              onChange={(event, newValue) => {
                setSelectedRegions(newValue);
              }}
              options={regions}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Regions"
                  placeholder="Choose regions to compare"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          )}

          <FormControl fullWidth>
            <InputLabel>Metric</InputLabel>
            <Select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              label="Metric"
            >
              <MenuItem value="incidents">Number of Incidents</MenuItem>
              <MenuItem value="mttr">MTTR</MenuItem>
              <MenuItem value="clients">Clients Affected</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleCompare}
            disabled={loading || !fileId}
          >
            Compare
          </Button>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Loading comparison data...</Typography>
            </Box>
          ) : (
            comparisonData && (
              <Box sx={{ mt: 2 }}>
                {comparisonType === 'time'
                  ? renderTimeComparison()
                  : renderRegionalComparison()}
              </Box>
            )
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComparisonDialog; 