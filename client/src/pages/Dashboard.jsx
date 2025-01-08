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
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  console.log('Dashboard component rendering');
  
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

  const fetchDashboardData = async () => {
    console.log('Fetching dashboard data...');
    try {
      setLoading(true);
      const response = await api.get('/config/assignments');
      console.log('API Response:', response.data);
      const assignments = response.data;

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
        const baseSiteName = site.base_name.replace(/(OLT.*)/, 'OLT').trim(); // Correct regex
        acc.add(baseSiteName);
        acc.add(baseSiteName);
        return acc;
      }, new Set()).size;
      console.log("Unique Sites Set:", uniqueSites);

      // Count vendor types
      const vendorCounts = assignments.reduce((acc, site) => {
        const vendorTypes = site.vendor_types ? site.vendor_types.split(',') : [];
        vendorTypes.forEach(type => {
          if (type === 'huawei') acc.adrian += Number(site.olt_count);
          else if (type === 'nokia') acc.nokia += Number(site.olt_count);
        });
        return acc;
      }, {  huawei: 0, nokia: 0 });

      console.log('Processed stats:', {
        totalOLTs,
        uniqueSites,
        regionCounts,
        mspCounts,
        vendorCounts,
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
        oltByType: vendorCounts,
        sitesPerRegion: sitesPerRegionCount,
        detailedData: assignments
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered');
    fetchDashboardData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

  const StatCard = ({ icon: Icon, title, value, color, onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          backgroundColor: 'action.hover'
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon sx={{ color: color, mr: 1 }} />
          <Typography color="textSecondary" variant="h6">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  const DetailDialog = () => (
    <Dialog 
      open={detailDialog.open} 
      onClose={() => setDetailDialog(prev => ({ ...prev, open: false }))}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{detailDialog.title}</DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Site Name</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>MSP</TableCell>
                <TableCell>OLT Count</TableCell>
                <TableCell>Vendor Types</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detailDialog.data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.base_name}</TableCell>
                  <TableCell>{row.region_name}</TableCell>
                  <TableCell>{row.msp_name}</TableCell>
                  <TableCell>{row.olt_count}</TableCell>
                  <TableCell>{row.vendor_types}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailDialog(prev => ({ ...prev, open: false }))}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container 
      maxWidth="xl"
      disableGutters
      sx={{ 
        height: '100vh',
        minWidth: 0,
        overflow: 'auto',
        backgroundColor: 'background.paper', 
      }}
    >
      <Box sx={{ 
        mb: 0.5,
        minWidth: 'min-content',
      }}>
        {/* Header Paper */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1, 
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            borderRadius: 0,
          }}
        >
          <Grid 
            container 
            justifyContent="space-between" 
            alignItems="center" 
            spacing={0}
            sx={{ 
              minHeight: '32px',
              py: 0,
              m: 0,
              '& .MuiGrid-item': { 
                p: 0,
                m: 0
              }
            }}
          >
            <Grid item>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  m: 0,
                  color: 'text.primary',
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
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
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
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      }
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh Data">
                  <IconButton onClick={fetchDashboardData}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Content */}
        {loading ? (
          <LinearProgress />
        ) : (
          <Paper sx={{ 
            mt: 1,
            borderRadius: 0,
            p: 2
          }}>
            <Grid container spacing={3}>
              {/* Stats Cards */}
              <Grid item xs={12} sm={6}>
                <StatCard 
                  icon={IpIcon} 
                  title="Total OLTs Installed"
                  value={stats.totalAssignments}
                  color="#1976d2"
                  onClick={() => handleChartClick({ name: 'All' }, 'all')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StatCard 
                  icon={OltIcon} 
                  title="OLT Sites" 
                  value={stats.oltSites}
                  color="#2e7d32"
                />
              </Grid>

              {/* OLT Distribution Charts */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: 400 }}>
                  <Typography variant="h6" gutterBottom>OLT Sites by Region</Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={stats.oltByRegion}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label
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
                <Paper sx={{ p: 2, height: 400 }}>
                  <Typography variant="h6" gutterBottom>Sites per Region</Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={stats.sitesPerRegion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar 
                        dataKey="value" 
                        fill="#82ca9d"
                        onClick={(data) => handleChartClick(data, 'region')}
                      >
                        <LabelList dataKey="value" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: 400 }}>
                  <Typography variant="h6" gutterBottom>OLT Sites by MSP</Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={stats.oltByMSP}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar 
                        dataKey="value" 
                        fill="#8884d8"
                        onClick={(data) => handleChartClick(data, 'msp')}
                      >
                        <LabelList dataKey="value" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Vendor Chart */}
              {stats.oltByType && Object.values(stats.oltByType).some(v => v > 0) && (
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: 400 }}>
                    <Typography variant="h6" gutterBottom>OLT Sites by Vendor</Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart 
                        data={[

                          { name: 'Huawei', value: stats.oltByType.huawei },
                          { name: 'Nokia', value: stats.oltByType.nokia }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar 
                          dataKey="value" 
                          fill="#82ca9d"
                          onClick={(data) => handleChartClick(data, 'vendor')}
                        >
                          <LabelList dataKey="value" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}
      </Box>
      <DetailDialog />
    </Container>
  );
};

export default Dashboard;