import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Container,
  Paper,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { siteAPI } from '../../services/siteAPI';
import SearchableSiteSelect from '../common/SearchableSiteSelect';
import api from '../../utils/api';
import SearchIcon from '@mui/icons-material/Search';
import IPAssignments from '../ip/IPAssignments';

const SiteSubmission = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedIP, setGeneratedIP] = useState('');
  const [vlan, setVlan] = useState('');
  const [primaryVCID, setPrimaryVCID] = useState('');
  const [secondaryVCID, setSecondaryVCID] = useState('');
  const [vsiId, setVsiId] = useState('');
  const [howToDialog, setHowToDialog] = useState(false);
  const [assignmentsDialog, setAssignmentsDialog] = useState(false);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const response = await siteAPI.getAllSites();
      console.log('Fetched sites:', response.data);
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setError('Failed to fetch sites.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSite) {
      setError('Please select a site');
      return;
    }
    
    try {
      const response = await api.post('/sites/generate-ip', { 
        siteId: selectedSite.id,
        ipran_cluster_id: selectedSite.ipranClusterId
      });

      setGeneratedIP(response.data.ip);
      setVlan(response.data.vlan);
      setPrimaryVCID(response.data.primary_vcid);
      setSecondaryVCID(response.data.secondary_vcid);
      setVsiId(response.data.vsi_id);
      setError('');
    } catch (error) {
      console.error('Error generating IP:', error);
      // Show the error message from the server
      setError(error.response?.data?.message || 'Failed to generate IP');
      
      // Clear any previously generated values
      setGeneratedIP('');
      setVlan('');
      setPrimaryVCID('');
      setSecondaryVCID('');
      setVsiId('');
    }
  };

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
                  p: 0,
                  color: 'text.primary',
                }}
              >
                Generate IP Address
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setHowToDialog(true)}
                  sx={{ height: '32px' }}
                >
                  How to
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setAssignmentsDialog(true)}
                  sx={{ height: '32px' }}
                >
                  IP Assignments
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ 
          mt: 1,
          borderRadius: 0,
        }}>
          <Box sx={{ p: 2 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  mb: 2,
                  width: '100%',
                  '& .MuiAlert-message': {
                    color: 'error.main',
                  }
                }}
              >
                {error}
              </Alert>
            )}
            
            <Box sx={{ maxWidth: '800px' }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                alignItems: 'center'
              }}>
                <Box sx={{ 
                  flex: 1,
                  minWidth: '600px',
                }}>
                  <SearchableSiteSelect
                    sites={sites}
                    value={selectedSite}
                    onChange={setSelectedSite}
                    loading={loading}
                    required
                    placeholder="Search for a site..."
                    loadingText="Loading sites..."
                    noOptionsText="No sites found"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Start typing site name..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <SearchIcon 
                                sx={{ 
                                  color: 'text.secondary',
                                  ml: 0.5,
                                  mr: 0.5,
                                  fontSize: '1.2rem'
                                }} 
                              />
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    sx={{ 
                      '& .MuiInputBase-root': {
                        height: '32px',
                        minHeight: '32px',
                        backgroundColor: 'background.paper',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'background.paper',
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '2px 14px',
                      },
                      '& .MuiAutocomplete-input': {
                        padding: '0 !important',
                      },
                      '& .MuiAutocomplete-endAdornment': {
                        top: 'calc(50% - 12px)',
                      },
                      '& .MuiInputLabel-root': {
                        transform: 'translate(14px, 8px) scale(1)',
                      },
                      '& .MuiInputLabel-shrink': {
                        transform: 'translate(14px, -6px) scale(0.75)',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'divider',
                      },
                      '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'action.active',
                      }
                    }}
                  />
                </Box>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  disabled={!selectedSite || loading}
                  size="small"
                  sx={{ 
                    height: '32px',
                    minHeight: '32px'
                  }}
                >
                  Generate IP
                </Button>
              </Box>

              {generatedIP && (
                <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Generated Values
                  </Typography>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'auto 1fr',
                    gap: 2,
                    '& > *': { py: 0.5 }
                  }}>
                    <Typography color="text.secondary">IP Address:</Typography>
                    <Typography>{generatedIP}</Typography>
                    
                    <Typography color="text.secondary">VLAN:</Typography>
                    <Typography>{vlan}</Typography>
                    
                    <Typography color="text.secondary">Primary VCID:</Typography>
                    <Typography>{primaryVCID}</Typography>
                    
                    <Typography color="text.secondary">Secondary VCID:</Typography>
                    <Typography>{secondaryVCID}</Typography>
                    
                    <Typography color="text.secondary">VSI ID:</Typography>
                    <Typography>{vsiId}</Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* How To Dialog */}
      <Dialog
        open={howToDialog}
        onClose={() => setHowToDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>How to Load Configuration Files</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Configuration instructions will go here...
            </Typography>
            {/* Add copy code button and content later */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHowToDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* IP Assignments Dialog */}
      <Dialog
        open={assignmentsDialog}
        onClose={() => setAssignmentsDialog(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>IP Assignments</DialogTitle>
        <DialogContent>
          <IPAssignments />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SiteSubmission;