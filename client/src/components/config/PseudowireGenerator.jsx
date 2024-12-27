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
import { Download as DownloadIcon } from '@mui/icons-material';

const PseudowireGenerator = () => {
  const [selectedSites, setSelectedSites] = useState({
    oltSite: null,
    sourceNE: null,
    primaryBNG: null,
    secondaryBNG: null,
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
      primaryBNG,
      secondaryBNG,
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
    const secondarySwitchConfig = secondarySwitch ? `mpls switch-l2vc ${sourceNE.ipAddress} ${oltSite.secondary_vcid} tunnel-policy IPRAN between ${secondarySink.ipAddress} ${oltSite.secondary_vcid} tunnel-policy IPRAN encapsulation vlan` : null;

    // Primary Sink Config (updated)
    const primarySinkConfig = `vsi ${oltSite.site_name}
pwsignal ldp
  vsi-id ${oltSite.vsi_id}
  mac-withdraw enable
  peer ${primarySwitch ? primarySwitch.ipAddress : sourceNE.ipAddress} negotiation-vc-id ${oltSite.primary_vcid} tnl-policy IPRAN upe
  peer ${primarySwitch ? primarySwitch.ipAddress : sourceNE.ipAddress} negotiation-vc-id ${oltSite.primary_vcid} pw Track
   track hub-pw
  peer ${primaryBNG.ipAddress}`;

    // Secondary Sink Config (updated)
    const secondarySinkConfig = `vsi ${oltSite.site_name}
pwsignal ldp
  vsi-id ${oltSite.vsi_id}
  mac-withdraw enable
  peer ${secondarySwitch ? secondarySwitch.ipAddress : sourceNE.ipAddress} negotiation-vc-id ${oltSite.secondary_vcid} tnl-policy IPRAN upe
  peer ${secondarySwitch ? secondarySwitch.ipAddress : sourceNE.ipAddress} negotiation-vc-id ${oltSite.secondary_vcid} pw Track
   track hub-pw
  peer ${primaryBNG.ipAddress}
  peer ${secondaryBNG.ipAddress}`;

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
    <Container 
      maxWidth="xl"
      disableGutters
      sx={{ 
        height: '100%',
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
                Pseudowire Configuration Generator
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Content Paper */}
        <Paper sx={{ 
          mt: 1,
          borderRadius: 0,
          p: 2
        }}>
          {/* Form Grid */}
          <Grid container spacing={2}>
            {/* First row - OLT and Source NE */}
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

            {/* Second row - Switching Nodes */}
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

            {/* Third row - Sink Nodes */}
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

            {/* Fourth row - BNG Nodes */}
            <Grid item xs={12} md={6}>
              <SearchableSiteSelect
                label="Primary BNG *"
                onSelect={(site) => handleSiteSelect('primaryBNG', site)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SearchableSiteSelect
                label="Secondary BNG *"
                onSelect={(site) => handleSiteSelect('secondaryBNG', site)}
              />
            </Grid>

            {/* Button row */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={generateConfig}
                disabled={!selectedSites.oltSite || !selectedSites.sourceNE || 
                         !selectedSites.primaryBNG || !selectedSites.secondaryBNG ||
                         !selectedSites.primarySink || !selectedSites.secondarySink}
                fullWidth
              >
                Generate Config
              </Button>
            </Grid>
          </Grid>

          {/* Generated Configs with updated styling */}
          {generatedConfig && (
            <Box sx={{ mt: 3 }}>
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
            </Box>
          )}
        </Paper>
      </Box>

      <Snackbar
        open={showCopySuccess}
        autoHideDuration={3000}
        onClose={() => setShowCopySuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Configuration copied to clipboard!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PseudowireGenerator; 