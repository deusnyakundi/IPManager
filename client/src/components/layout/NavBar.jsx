// client/src/components/layout/NavBar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  styled,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Language as RegionsIcon,
  Router as IPBlocksIcon,
  Business as SitesIcon,
  Lan as VLANIcon,
  ChevronLeft as ChevronLeftIcon,
  Add as AddIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  Lock as PasswordIcon,
  Logout as LogoutIcon,
  ViewStream as VCIDIcon,
  Build as NetworkSettingsIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 65;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open, collapsed }) => ({
    flexGrow: 1,
    padding: 0,
    paddingTop: '48px',
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    width: `calc(100% - ${collapsed ? COLLAPSED_WIDTH : open ? DRAWER_WIDTH : 0}px)`,
    minWidth: 0,
    overflow: 'auto',
  }),
);

const StyledAppBar = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open, collapsed }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    '& .MuiToolbar-root': {
      minHeight: '48px',
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
    width: `calc(100% - ${collapsed ? COLLAPSED_WIDTH : open ? DRAWER_WIDTH : 0}px)`,
    marginLeft: collapsed ? COLLAPSED_WIDTH : open ? DRAWER_WIDTH : 0,
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  minHeight: '48px',
  justifyContent: 'flex-end',
}));

const menuItems = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon />, adminOnly: false },
  { path: '/sites', label: 'Sites', icon: <SitesIcon />, adminOnly: true },
  //{ path: '/regions', label: 'Regions', icon: <RegionsIcon />, adminOnly: true },
  { path: '/ip-blocks', label: 'IP Blocks', icon: <IPBlocksIcon />, adminOnly: true },
  { path: '/vlan-ranges', label: 'VLAN Ranges', icon: <VLANIcon />, adminOnly: true },
  { path: '/vcid-ranges', label: 'VCID Ranges', icon: <VCIDIcon />, adminOnly: true },
  { path: '/generate-ip', label: 'Generate IP', icon: <AddIcon />, adminOnly: false },
  { path: '/config-generator', label: 'Configuration', icon: <SettingsIcon />, adminOnly: false },
  //{ path: '/network-settings', label: 'Network Settings', icon: <NetworkSettingsIcon />, adminOnly: true },
  { path: '/infra-manager', label: 'Infrastructure Manager', icon: <NetworkSettingsIcon />, adminOnly: true },
];

const NavBar = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications] = useState([]); // For notification badge

  console.log('Current location:', location.pathname);
  console.log('User role:', user?.role);

  // If not logged in, only render the children (which will be the Login page)
  if (!user) {
    return (
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        bgcolor: 'background.default' 
      }}>
        {children}
      </Box>
    );
  }

  const handleDrawerToggle = () => {
    if (open) {
      setCollapsed(true);
      setOpen(false);
    } else {
      setCollapsed(false);
      setOpen(true);
    }
  };

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleCloseMenu();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setOpen(false);
    setCollapsed(true);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <StyledAppBar 
        position="fixed" 
        open={open}
        collapsed={collapsed}
        sx={{ 
          '& .MuiToolbar-root': {
            minHeight: '48px', // Reduce AppBar height
            paddingLeft: 1,
            paddingRight: 1

          }
        }}
      >
        <Toolbar>
          <Typography variant="h6"  noWrap component="div" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', }}>
            IP Manager
          </Typography>

          <IconButton
            onClick={handleProfileMenu}
            size="small"
            sx={{ ml: 2 }}
            aria-controls="profile-menu"
            aria-haspopup="true"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            onClick={handleCloseMenu}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                minWidth: '200px',
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1,
                  gap: 1.5,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {user.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.role}
              </Typography>
            </Box>
            <Divider />
            
            <MenuItem onClick={() => navigate('/profile')}>
              <ProfileIcon fontSize="small" />
              My Profile
            </MenuItem>

            <MenuItem onClick={() => navigate('/settings')}>
              <SettingsIcon fontSize="small" />
              Settings
            </MenuItem>

            <MenuItem onClick={() => navigate('/notifications')}>
              <NotificationsIcon fontSize="small" />
              Notifications
              {notifications.length > 0 && (
                <Box
                  component="span"
                  sx={{
                    ml: 'auto',
                    backgroundColor: 'error.main',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                  }}
                >
                  {notifications.length}
                </Box>
              )}
            </MenuItem>

            <MenuItem onClick={() => navigate('/help')}>
              <HelpIcon fontSize="small" />
              Help & Support
            </MenuItem>

            <Divider />

            <MenuItem onClick={() => navigate('/change-password')}>
              <PasswordIcon fontSize="small" />
              Change Password
            </MenuItem>

            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutIcon fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open={true}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerToggle}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </DrawerHeader>
        <List>
          {menuItems
            .filter(item => !item.adminOnly || user?.role === 'admin')
            .map((item) => (
              <ListItem
                button
                key={item.path}
                selected={location.pathname === item.path}
                onClick={() => handleMenuItemClick(item.path)}
                sx={{
                  px: collapsed ? 2 : 3,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'common.white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  my: 0.5,
                  mx: 1,
                  borderRadius: 1,
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'initial',
                }}
              >
                <Tooltip title={collapsed ? item.label : ""} placement="right">
                  <ListItemIcon 
                    sx={{ 
                      color: location.pathname === item.path ? 'common.white' : 'inherit',
                      minWidth: collapsed ? 'auto' : 48,
                      mr: collapsed ? 0 : 2,
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </Tooltip>
                {!collapsed && <ListItemText primary={item.label} />}
              </ListItem>
            ))}
        </List>
      </Drawer>
      <Main open={open} collapsed={collapsed}>
        {children}
      </Main>
    </Box>
  );
};

export default NavBar;