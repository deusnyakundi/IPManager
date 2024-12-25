import React, { useState } from 'react';
import { Box, Typography, Button, Tabs, Tab, Paper, Grid } from '@mui/material';
import ManageRegions from './ManageRegions';
import ManageMSPs from './ManageMSPs';
import ManageClusters from './ManageClusters';

const InfrastructureManager = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
      setActiveTab(newValue);
    };
  
    return (
      <Box 
        sx={{ 
          //height: '100%', 
          height: '100vh',  // Set full viewport height
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'auto', 
          backgroundColor: 'background.paper' 
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1, 
            borderBottom: 1, 
            borderColor: 'divider', 
            borderRadius: 0,
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              fontSize: '1.25rem', 
              lineHeight: 1, 
              color: 'text.primary',
            }}
          >
            Infrastructure Management
          </Typography>
        </Paper>
  
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center',
            overflow: 'auto',// Make the content scrollable
            paddingBottom: '56px',  // Adjust to leave space for fixed buttons
           
         }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Regions" />
            <Tab label="MSPs" />
            <Tab label="IPRAN Clusters" />
          </Tabs>
  
          <Box role="tabpanel" hidden={activeTab !== 0} sx={{ width: '100%', maxWidth: 800 }}>
            {activeTab === 0 && <ManageRegions />}
          </Box>
          <Box role="tabpanel" hidden={activeTab !== 1} sx={{ width: '100%', maxWidth: 800 }}>
            {activeTab === 1 && <ManageMSPs />}
          </Box>
          <Box role="tabpanel" hidden={activeTab !== 2} sx={{ width: '100%', maxWidth: 800 }}>
            {activeTab === 2 && <ManageClusters />}
          </Box>
        </Box>
  
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1, 
            mt: 'auto', 
            borderTop: 1, 
            borderColor: 'divider', 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            backgroundColor: 'background.paper', 
            zIndex: 1000, // Ensure buttons stay on top
           // backgroundColor: 'background.paper'
          }}
        >
          <Grid container justifyContent="flex-end" spacing={2}>
            <Grid item>
              <Button variant="contained" onClick={() => console.log('Save Changes')} size="small">
                Save Changes
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={() => console.log('Cancel')} size="small">
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };
  
export default InfrastructureManager;
