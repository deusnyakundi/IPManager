import React, { useState } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import FileUpload from '../components/analytics/FileUpload';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';

const Analytics = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4, height: '100vh', overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Data Analytics
        </Typography>

        <Paper sx={{ mb: 4 }}>
          <FileUpload onFileSelect={handleFileSelect} />
        </Paper>

        <AnalyticsDashboard selectedFile={selectedFile} />
      </Box>
    </Container>
  );
};

export default Analytics; 