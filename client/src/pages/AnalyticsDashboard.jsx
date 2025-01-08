import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  UploadFile,
  PictureAsPdf,
  TableChart,
  Slideshow,
  FilterList,
  Compare,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import FileUploadDialog from '../components/analytics/FileUploadDialog';
import AnalyticsSummary from '../components/analytics/AnalyticsSummary';
import TrendsAnalysis from '../components/analytics/TrendsAnalysis';
import RegionalAnalysis from '../components/analytics/RegionalAnalysis';
import ImpactAnalysis from '../components/analytics/ImpactAnalysis';
import FilterDialog from '../components/analytics/FilterDialog';
import ComparisonDialog from '../components/analytics/ComparisonDialog';
import ExportDialog from '../components/analytics/ExportDialog';

const AnalyticsDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [filters, setFilters] = useState({
    regions: [],
    faultTypes: [],
    dateRange: null,
    minClientsAffected: null,
    maxMTTR: null,
  });
  const { enqueueSnackbar } = useSnackbar();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analytics/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setSelectedFile(data.fileId);
      enqueueSnackbar('File uploaded successfully', { variant: 'success' });
      await fetchAnalytics(data.fileId);
    } catch (err) {
      setError(err.message);
      enqueueSnackbar('Error uploading file', { variant: 'error' });
    } finally {
      setLoading(false);
      setUploadDialogOpen(false);
    }
  };

  const fetchAnalytics = async (fileId) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        fileId,
        ...filters,
      });

      const response = await fetch(`/api/analytics/data?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err.message);
      enqueueSnackbar('Error fetching analytics data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters);
    if (selectedFile) {
      fetchAnalytics(selectedFile);
    }
    setFilterDialogOpen(false);
  };

  const handleGeneratePowerPoint = async () => {
    try {
      const response = await fetch(`/api/analytics/powerpoint?fileId=${selectedFile}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PowerPoint');
      }

      // Create a blob from the response and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'network_analysis.pptx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      enqueueSnackbar('PowerPoint generated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Error generating PowerPoint', { variant: 'error' });
    }
  };

  useEffect(() => {
    if (selectedFile) {
      fetchAnalytics(selectedFile);
    }
  }, [selectedFile]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box m={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      );
    }

    if (!selectedFile) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Typography variant="h6" gutterBottom>
            No data to display
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadFile />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Data
          </Button>
        </Box>
      );
    }

    switch (currentTab) {
      case 0:
        return <AnalyticsSummary data={analyticsData?.summary} />;
      case 1:
        return <TrendsAnalysis data={analyticsData?.trends} />;
      case 2:
        return <RegionalAnalysis data={analyticsData?.regional} />;
      case 3:
        return <ImpactAnalysis data={analyticsData?.impact} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box my={4}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Data Analytics
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<UploadFile />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload
              </Button>
              <Tooltip title="Filter">
                <IconButton
                  color="primary"
                  onClick={() => setFilterDialogOpen(true)}
                  disabled={!selectedFile}
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
              <Tooltip title="Compare">
                <IconButton
                  color="primary"
                  onClick={() => setComparisonDialogOpen(true)}
                  disabled={!selectedFile}
                >
                  <Compare />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export">
                <IconButton
                  color="primary"
                  onClick={() => setExportDialogOpen(true)}
                  disabled={!selectedFile}
                >
                  <TableChart />
                </IconButton>
              </Tooltip>
              <Tooltip title="Generate PowerPoint">
                <IconButton
                  color="primary"
                  onClick={handleGeneratePowerPoint}
                  disabled={!selectedFile}
                >
                  <Slideshow />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        <Card sx={{ mt: 2 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Summary" />
            <Tab label="Trends" />
            <Tab label="Regional" />
            <Tab label="Impact" />
          </Tabs>
          <Box p={3}>{renderContent()}</Box>
        </Card>
      </Box>

      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleFileUpload}
      />
      <FilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={handleFilterApply}
        currentFilters={filters}
      />
      <ComparisonDialog
        open={comparisonDialogOpen}
        onClose={() => setComparisonDialogOpen(false)}
        fileId={selectedFile}
      />
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        fileId={selectedFile}
      />
    </Container>
  );
};

export default AnalyticsDashboard; 