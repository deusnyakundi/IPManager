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
} from '@mui/material';
import { 
  CellTower as SiteIcon,
  Router as IpIcon,
  Refresh as RefreshIcon,
  Storage as OltIcon,
  Settings as SettingsIcon,
  Build as BuildIcon,
  CompareArrows as CompareArrowsIcon,
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
      adrian: 0,
      egypro: 0,
      huawei: 0,
      nokia: 0
    }
  });
  const [loading, setLoading] = useState(true);
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
          acc[site.region_name] = (acc[site.region_name] || 0) + Number(site.olt_count);
        }
        return acc;
      }, {});

      const mspCounts = assignments.reduce((acc, site) => {
        if (site.msp_name) {
          acc[site.msp_name] = (acc[site.msp_name] || 0) + Number(site.olt_count);
        }
        return acc;
      }, {});

      // Count total OLTs
      const totalOLTs = assignments.reduce((sum, site) => 
        sum + Number(site.olt_count), 0
      );

      // Count unique sites (base names without 02, 03, 04 suffixes)
      const uniqueSites = assignments.reduce((acc, site) => {
        const baseSiteName = site.base_name.replace(/0[2-9]$/, '');
        acc.add(baseSiteName);
        return acc;
      }, new Set()).size;

      // Count vendor types
      const vendorCounts = assignments.reduce((acc, site) => {
        const vendorTypes = site.vendor_types ? site.vendor_types.split(',') : [];
        vendorTypes.forEach(type => {
          if (type === 'adrian') acc.adrian += Number(site.olt_count);
          else if (type === 'egypro') acc.egypro += Number(site.olt_count);
          else if (type === 'huawei') acc.huawei += Number(site.olt_count);
          else if (type === 'nokia') acc.nokia += Number(site.olt_count);
        });
        return acc;
      }, { adrian: 0, egypro: 0, huawei: 0, nokia: 0 });

      console.log('Processed stats:', {
        totalOLTs,
        uniqueSites,
        regionCounts,
        mspCounts,
        vendorCounts
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
        oltByType: vendorCounts
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

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <Card sx={{ height: '100%' }}>
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

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            IP Assignment Dashboard
          </Typography>
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
        </Box>

        {loading ? (
          <LinearProgress />
        ) : (
          <>
            <Grid container spacing={3}>
              {/* Stats Cards */}
              <Grid item xs={12} sm={6}>
                <StatCard 
                  icon={IpIcon} 
                  title="Total OLTs Installed"
                  value={stats.totalAssignments}
                  color="#1976d2"
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
                      >
                        {stats.oltByRegion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
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
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Vendor Chart */}
              {stats.oltByType && Object.values(stats.oltByType).some(v => v > 0) && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, height: 400 }}>
                    <Typography variant="h6" gutterBottom>OLT Sites by Vendor</Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart 
                        data={[
                          { name: 'Adrian', value: stats.oltByType.adrian },
                          { name: 'Egypro', value: stats.oltByType.egypro },
                          { name: 'Huawei', value: stats.oltByType.huawei },
                          { name: 'Nokia', value: stats.oltByType.nokia }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#82ca9d">
                          <LabelList dataKey="value" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;