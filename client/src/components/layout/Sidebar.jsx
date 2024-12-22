// client/src/components/Layout/Sidebar.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  styled
} from '@mui/material';
import {
  Language as RegionsIcon,
  Router as IPBlocksIcon,
  Business as SitesIcon,
  Settings as VLANIcon,
  Dashboard as DashboardIcon,
  ViewStream as VCIDIcon,
  Description as ConfigIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const StyledDrawer = styled(Drawer)({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    backgroundColor: '#1a1a1a',
    color: 'white',
  },
});

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/regions', label: 'Regions', icon: <RegionsIcon /> },
  { path: '/ip-blocks', label: 'IP Blocks', icon: <IPBlocksIcon /> },
  { path: '/sites', label: 'Sites', icon: <SitesIcon /> },
  { path: '/vlan-ranges', label: 'VLAN Ranges', icon: <VLANIcon /> },
  { path: '/vcid-ranges', label: 'VCID Ranges', icon: <VCIDIcon /> },
  { path: '/config-generator', label: 'Configuration', icon: <ConfigIcon /> },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <StyledDrawer variant="permanent" anchor="left">
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ color: '#2196f3' }}>
          IP Manager
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#2196f3',
                '&:hover': {
                  backgroundColor: '#1976d2',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              my: 0.5,
              mx: 1,
              borderRadius: 1,
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </StyledDrawer>
  );
};

export default Sidebar;