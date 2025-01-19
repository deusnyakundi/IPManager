import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Card, 
  CardContent,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import { 
  CellTower as SiteIcon,
  Router as IpIcon,
  Refresh as RefreshIcon,
  Storage as OltIcon,
  Settings as SettingsIcon,
  Build as BuildIcon,
  CompareArrows as CompareArrowsIcon,
  LocationOn as LocationIcon,
  Business as MspIcon,
  Memory as VendorIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LabelList,
  AreaChart,
  Area,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import IPBlockUtilization from '../components/IPBlockUtilization';

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    oltSites: 0,
    oltByRegion: [],
    oltByMSP: [],
    oltByType: {
      huawei: 0,
      nokia: 0
    },
    sitesPerRegion: [],
    detailedData: []
  });
  const [loading, setLoading] = useState(true);
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    title: '',
    data: [],
    type: ''
  });
  const navigate = useNavigate();

  // Custom color palette
  const CHART_COLORS = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
    gradients: [
      `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
      `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.secondary.light} 90%)`,
      `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.light} 90%)`,
    ]
  };

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const fetchDashboardData = async () => {
    console.log('Fetching dashboard data...');
    try {
      setLoading(true);
      
      // Fetch IP assignments for vendor stats
      const ipAssignmentsResponse = await api.get('/ip/assignments');
      const vendorStats = ipAssignmentsResponse.data.stats;

      const configResponse = await api.get('/config/assignments');
      console.log('API Response:', configResponse.data);
      const assignments = configResponse.data;

      // Calculate statistics
      const regionCounts = assignments.reduce((acc, site) => {
        if (site.region_name) {
          acc[site.region_name] = (acc[site.region_name] || 0) + Number(site.site_count);
        }
        return acc;
      }, {});

      // Calculate sites per region
      const sitesPerRegion = assignments.reduce((acc, site) => {
        if (site.region_name) {
          if (!acc[site.region_name]) {
            acc[site.region_name] = new Set();
          }
          acc[site.region_name].add(site.base_name.replace(/0[2-9]$/, ''));
        }
        return acc;
      }, {});

      const sitesPerRegionCount = Object.entries(sitesPerRegion).map(([name, sites]) => ({
        name,
        value: sites.size
      }));

      const mspCounts = assignments.reduce((acc, site) => {
        if (site.msp_name) {
          acc[site.msp_name] = (acc[site.msp_name] || 0) + Number(site.site_count);
        }
        return acc;
      }, {});

      // Count total OLTs
      const totalOLTs = assignments.reduce((sum, site) => 
        sum + Number(site.olt_count), 0
      );

      // Count unique sites (base names without 02, 03, 04 suffixes)
      const uniqueSites = assignments.reduce((acc, site) => {
        const baseSiteName = site.base_name.replace(/(OLT.*)/, 'OLT').trim();
        acc.add(baseSiteName);
        return acc;
      }, new Set()).size;

      console.log("Unique Sites Set:", uniqueSites);

      console.log('Processed stats:', {
        totalOLTs,
        uniqueSites,
        regionCounts,
        mspCounts,
        vendorStats,
        sitesPerRegionCount
      });

      setStats({
        totalAssignments: totalOLTs,
        oltSites: uniqueSites,
        oltByRegion: Object.entries(regionCounts)
          .map(([name, value]) => ({ name, value }))
          .filter(item => item.name !== 'null'),
        oltByMSP: Object.entries(mspCounts)
          .map(([name, value]) => ({ name, value }))
          .filter(item => item.name !== 'null'),
        oltByType: {
          huawei: vendorStats.huawei || 0,
          nokia: vendorStats.nokia || 0
        },
        sitesPerRegion: sitesPerRegionCount,
        detailedData: assignments
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setNotification({
        open: true,
        message: 'Failed to fetch dashboard data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered');
    fetchDashboardData();
  }, []);

  const handleChartClick = (data, type) => {
    let filteredData = [];
    let title = '';

    switch (type) {
      case 'region':
        title = `OLT Sites in ${data.name}`;
        filteredData = stats.detailedData.filter(
          item => item.region_name === data.name
        );
        break;
      case 'msp':
        title = `OLT Sites managed by ${data.name}`;
        filteredData = stats.detailedData.filter(
          item => item.msp_name === data.name
        );
        break;
      case 'vendor':
        title = `${data.name} OLT Sites`;
        filteredData = stats.detailedData.filter(
          item => item.vendor_types?.includes(data.name.toLowerCase())
        );
        break;
      default:
        return;
    }

    setDetailDialog({
      open: true,
      title,
      data: filteredData,
      type
    });
  };

  const StatCard = ({ icon: Icon, title, value, color, onClick, trend }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          transition: 'all 0.3s ease-in-out'
        } : {},
        background: color,
        color: theme.palette.getContrastText(color),
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -15,
          right: -15,
          opacity: 0.2,
          transform: 'rotate(30deg)',
        }}
      >
        <Icon sx={{ fontSize: 100 }} />
      </Box>
      <CardContent>
        <Typography color="inherit" variant="subtitle2" sx={{ mb: 1, opacity: 0.72 }}>
          {title}
        </Typography>
        <Typography variant="h3" color="inherit">
          {value.toLocaleString()}
        </Typography>
        {trend && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
            <Typography variant="caption">
              {trend}% increase from last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const DetailDialog = () => (
    <Dialog 
      open={detailDialog.open} 
      onClose={() => setDetailDialog(prev => ({ ...prev, open: false }))}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.05)} 100%)`,
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        background: CHART_COLORS.gradients[0],
        color: 'white'
      }}>
        {detailDialog.title}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <TableContainer component={Paper} sx={{ borderRadius: 1, boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableCell>Site Name</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>MSP</TableCell>
                <TableCell align="center">OLT Count</TableCell>
                <TableCell>Vendor Types</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detailDialog.data.map((row, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
                  }}
                >
                  <TableCell>{row.base_name}</TableCell>
                  <TableCell>{row.region_name}</TableCell>
                  <TableCell>{row.msp_name}</TableCell>
                  <TableCell align="center">{row.olt_count}</TableCell>
                  <TableCell>{row.vendor_types}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={() => setDetailDialog(prev => ({ ...prev, open: false }))}
          variant="contained"
          sx={{ borderRadius: 2 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container 
      maxWidth="xl"
      sx={{ 
        height: '100vh',
        py: 3,
        backgroundColor: alpha(theme.palette.background.default, 0.98),
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                background: CHART_COLORS.gradients[0],
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              IP Assignment Dashboard
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Pseudowire Generator">
                <IconButton 
                  onClick={() => navigate('/pseudowire-generator')}
                  sx={{ 
                    background: CHART_COLORS.gradients[1],
                    color: 'white',
                    '&:hover': {
                      background: CHART_COLORS.gradients[2],
                    }
                  }}
                >
                  <CompareArrowsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Config Generator">
                <IconButton 
                  onClick={() => navigate('/config-generator')}
                  sx={{ 
                    background: CHART_COLORS.gradients[0],
                    color: 'white',
                    '&:hover': {
                      background: CHART_COLORS.gradients[1],
                    }
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={fetchDashboardData}
                  sx={{ 
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <LinearProgress sx={{ mb: 3 }} />
      ) : (
        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              icon={IpIcon} 
              title="Total OLTs Installed"
              value={stats.totalAssignments}
              color={CHART_COLORS.primary}
              onClick={() => handleChartClick({ name: 'All' }, 'all')}
              trend={12}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              icon={OltIcon} 
              title="OLT Sites" 
              value={stats.oltSites}
              color={CHART_COLORS.secondary}
              trend={8}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              icon={VendorIcon} 
              title="Huawei OLTs" 
              value={stats.oltByType.huawei}
              color={CHART_COLORS.success}
              trend={15}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              icon={VendorIcon} 
              title="Nokia OLTs" 
              value={stats.oltByType.nokia}
              color={CHART_COLORS.warning}
              trend={5}
            />
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Paper 
              sx={{ 
                p: 3, 
                height: 400,
                backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.05)} 100%)`,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                OLT Sites by Region
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={stats.oltByRegion}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, value, percent }) => 
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    onClick={(data) => handleChartClick(data, 'region')}
                  >
                    {stats.oltByRegion.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper 
              sx={{ 
                p: 3, 
                height: 400,
                backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.dark, 0.05)} 100%)`,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                Sites per Region
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={stats.sitesPerRegion}>
                  <defs>
                    <linearGradient id="colorSites" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fill: theme.palette.text.primary }}
                  />
                  <YAxis 
                    tick={{ fill: theme.palette.text.primary }}
                    domain={[0, dataMax => Math.ceil(dataMax * 1.2)]}
                    allowDataOverflow={false}
                    tickCount={10}
                    type="number"
                    allowDecimals={false}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={CHART_COLORS.primary}
                    fillOpacity={1}
                    fill="url(#colorSites)"
                    onClick={(data) => handleChartClick(data, 'region')}
                  >
                    <LabelList dataKey="value" position="top" />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper 
              sx={{ 
                p: 3, 
                height: 400,
                backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.dark, 0.05)} 100%)`,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                OLT Sites by MSP
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart 
                  data={stats.oltByMSP}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                    tick={{ fill: theme.palette.text.primary }}
                  />
                  <YAxis tick={{ fill: theme.palette.text.primary }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill={CHART_COLORS.success}
                    onClick={(data) => handleChartClick(data, 'msp')}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList dataKey="value" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {stats.oltByType && Object.values(stats.oltByType).some(v => v > 0) && (
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 3, 
                  height: 400,
                  backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.dark, 0.05)} 100%)`,
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                  OLT Sites by Vendor
                </Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart 
                    data={[
                      { name: 'Huawei', value: stats.oltByType.huawei },
                      { name: 'Nokia', value: stats.oltByType.nokia }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                    <XAxis dataKey="name" tick={{ fill: theme.palette.text.primary }} />
                    <YAxis 
                      tick={{ fill: theme.palette.text.primary }}
                      domain={[0, dataMax => Math.max(20, Math.ceil(dataMax * 1.2))]}
                      allowDecimals={false}
                      type="number"
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      onClick={(data) => handleChartClick(data, 'vendor')}
                      radius={[4, 4, 0, 0]}
                    >
                      {[
                        { name: 'Huawei', fill: CHART_COLORS.warning },
                        { name: 'Nokia', fill: CHART_COLORS.error }
                      ].map((entry, index) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="value" position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {/* IP Block Utilization Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <IPBlockUtilization />
          </Grid>
        </Grid>
      )}
      <DetailDialog />
    </Container>
  );
};

export default Dashboard;