import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Grid
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchableSiteSelect from '../common/SearchableSiteSelect';
import api from '../../utils/api';

const PseudowireGenerator = () => {
  const [selectedSites, setSelectedSites] = useState({
    oltSite: null,
    sourceNE: null,
    primarySwitch: null,
    secondarySwitch: null,
    primarySink: null,
    secondarySink: null
  });
  
  const [generatedConfig, setGeneratedConfig] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleSiteSelect = (type, site) => {
    console.log(`Selected ${type}:`, site);
    setSelectedSites(prev => ({
      ...prev,
      [type]: site
    }));
  };

  const generateConfig = () => {
    const {
      oltSite,
      sourceNE,
      primarySwitch,
      secondarySwitch,
      primarySink,
      secondarySink
    } = selectedSites;

    // Add debug logs
    console.log('Selected Sites:', {
      oltSite,
      sourceNE,
      primarySwitch,
      secondarySwitch,
      primarySink,
      secondarySink
    });

    if (!oltSite || !sourceNE || !primarySink || !secondarySink) {
      alert('Please fill in all required fields');
      return;
    }

    // Source NE Config
    const sourceConfig = `vlan-type dot1q ${oltSite.management_vlan}
description FOR_${oltSite.site_name}
statistic enable
mpls l2vc ${primarySwitch ? primarySwitch.ipAddress : primarySink.ipAddress} ${oltSite.primary_vcid} tunnel-policy IPRAN
mpls l2vc ${secondarySwitch ? secondarySwitch.ipAddress : secondarySink.ipAddress} ${oltSite.secondary_vcid} tunnel-policy IPRAN secondary
mpls l2vpn reroute delay 300 resume 10`;

    // Primary Switch Config (updated)
    const primarySwitchConfig = primarySwitch ? `mpls switch-l2vc ${sourceNE.ipAddress} ${oltSite.primary_vcid} tunnel-policy IPRAN between ${primarySink.ipAddress} ${oltSite.primary_vcid} tunnel-policy IPRAN encapsulation vlan` : null;

    // Secondary Switch Config (updated)
    const secondarySwitchConfig = secondarySwitch ? `mpls switch-l2vc ${sourceNE.ipAddress} ${oltSite.secondary_vcid} tunnel-policy IPRAN between ${secondarySink.ipAddress} ${oltSite.primary_vcid} tunnel-policy IPRAN encapsulation vlan` : null;

    // Primary Sink Config
    const primarySinkConfig = `vlan-type dot1q ${oltSite.management_vlan}
description FOR_${oltSite.site_name}
statistic enable`;

    // Secondary Sink Config
    const secondarySinkConfig = `vlan-type dot1q ${oltSite.management_vlan}
description FOR_${oltSite.site_name}
statistic enable`;

    setGeneratedConfig({
      source: sourceConfig,
      primarySwitch: primarySwitchConfig,
      secondarySwitch: secondarySwitchConfig,
      primarySink: primarySinkConfig,
      secondarySink: secondarySinkConfig
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedConfig);
    setShowCopySuccess(true);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Pseudowire Configuration Generator
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            {/* First row */}
            <Grid item xs={12} md={6}>
              <SearchableSiteSelect
                label="OLT Site *"
                onSelect={(site) => handleSiteSelect('oltSite', site)}
                filterOLTs={true}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SearchableSiteSelect
                label="Source NE *"
                onSelect={(site) => handleSiteSelect('sourceNE', site)}
              />
            </Grid>

            {/* Second row */}
            <Grid item xs={12} md={6}>
              <SearchableSiteSelect
                label="Primary Switching Node"
                onSelect={(site) => handleSiteSelect('primarySwitch', site)}
                optional
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SearchableSiteSelect
                label="Secondary Switching Node"
                onSelect={(site) => handleSiteSelect('secondarySwitch', site)}
                optional
              />
            </Grid>

            {/* Third row */}
            <Grid item xs={12} md={6}>
              <SearchableSiteSelect
                label="Primary Sink *"
                onSelect={(site) => handleSiteSelect('primarySink', site)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SearchableSiteSelect
                label="Secondary Sink *"
                onSelect={(site) => handleSiteSelect('secondarySink', site)}
              />
            </Grid>

            {/* Button row */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={generateConfig}
                disabled={!selectedSites.oltSite || !selectedSites.sourceNE || !selectedSites.primarySink || !selectedSites.secondarySink}
                fullWidth
              >
                Generate Config
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {generatedConfig && (
          <>
            {/* Source Config */}
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Source Configuration</Typography>
                <Tooltip title="Copy to clipboard">
                  <IconButton onClick={() => {
                    navigator.clipboard.writeText(generatedConfig.source);
                    setShowCopySuccess(true);
                  }}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '1rem', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                color: '#2e7d32',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.9rem'
              }}>
                {generatedConfig.source}
              </pre>
            </Paper>

            {/* Primary Switch Config */}
            {generatedConfig.primarySwitch && (
              <Paper sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Primary Switch Configuration</Typography>
                  <Tooltip title="Copy to clipboard">
                    <IconButton onClick={() => {
                      navigator.clipboard.writeText(generatedConfig.primarySwitch);
                      setShowCopySuccess(true);
                    }}>
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  color: '#2e7d32',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.9rem'
                }}>
                  {generatedConfig.primarySwitch}
                </pre>
              </Paper>
            )}

            {/* Secondary Switch Config */}
            {generatedConfig.secondarySwitch && (
              <Paper sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Secondary Switch Configuration</Typography>
                  <Tooltip title="Copy to clipboard">
                    <IconButton onClick={() => {
                      navigator.clipboard.writeText(generatedConfig.secondarySwitch);
                      setShowCopySuccess(true);
                    }}>
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  color: '#2e7d32',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.9rem'
                }}>
                  {generatedConfig.secondarySwitch}
                </pre>
              </Paper>
            )}

            {/* Primary Sink Config */}
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Primary Sink Configuration</Typography>
                <Tooltip title="Copy to clipboard">
                  <IconButton onClick={() => {
                    navigator.clipboard.writeText(generatedConfig.primarySink);
                    setShowCopySuccess(true);
                  }}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '1rem', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                color: '#2e7d32',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.9rem'
              }}>
                {generatedConfig.primarySink}
              </pre>
            </Paper>

            {/* Secondary Sink Config */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Secondary Sink Configuration</Typography>
                <Tooltip title="Copy to clipboard">
                  <IconButton onClick={() => {
                    navigator.clipboard.writeText(generatedConfig.secondarySink);
                    setShowCopySuccess(true);
                  }}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '1rem', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                color: '#2e7d32',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.9rem'
              }}>
                {generatedConfig.secondarySink}
              </pre>
            </Paper>
          </>
        )}

        <Snackbar
          open={showCopySuccess}
          autoHideDuration={3000}
          onClose={() => setShowCopySuccess(false)}
        >
          <Alert severity="success" sx={{ width: '100%' }}>
            Configuration copied to clipboard!
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default PseudowireGenerator; 