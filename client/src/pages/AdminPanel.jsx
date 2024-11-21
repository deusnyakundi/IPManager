import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ManageIPBlocks from '../components/admin/ManageIPBlocks';
import ManageRegions from '../components/admin/ManageRegions';
import ManageUsers from '../components/admin/ManageUsers';
import ManageVLANBlocks from '../components/admin/ManageVLANBlocks';

const AdminPanel = () => {
  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Panel
        </Typography>
        <ManageIPBlocks />
        <ManageRegions />
        <ManageUsers />
        <ManageVLANBlocks />
      </Box>
    </Container>
  );
};

export default AdminPanel;