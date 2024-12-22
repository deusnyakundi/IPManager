import React from 'react';
import { Container, Typography, Box, Tabs, Tab } from '@mui/material';
import ManageIPBlocks from '../components/admin/ManageIPBlocks';
import ManageRegions from '../components/admin/ManageRegions';
import ManageUsers from '../components/admin/ManageUsers';
import ManageVLANBlocks from '../components/admin/ManageVLANBlocks';
import ManageVCIDRanges from '../components/admin/ManageVCIDRanges';

const AdminPanel = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Panel
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="IP Blocks" />
            <Tab label="VLAN Ranges" />
            <Tab label="Regions" />
            <Tab label="Users" />
            <Tab label="VCID Ranges" />
          </Tabs>
        </Box>

        {value === 0 && <ManageIPBlocks />}
        {value === 1 && <ManageVLANBlocks />}
        {value === 2 && <ManageRegions />}
        {value === 3 && <ManageUsers />}
        {value === 4 && <ManageVCIDRanges />}
      </Box>
    </Container>
  );
};

export default AdminPanel;