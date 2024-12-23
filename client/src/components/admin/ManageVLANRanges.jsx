import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const ManageVLANRanges = () => {
  // ... existing state and functions ...

  return (
    <Container 
      maxWidth="xl"
      disableGutters
      sx={{ 
        height: '100%',
        minWidth: 0,
        overflow: 'auto',
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
            spacing={1}
            sx={{ 
              minHeight: '36px',
              py: 0
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
                Manage VLAN Ranges
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="Start VLAN"
                  value={newRange.start}
                  onChange={(e) => setNewRange({ ...newRange, start: e.target.value })}
                  sx={{ 
                    width: '120px',
                    '& .MuiInputBase-root': { height: '32px' }
                  }}
                />
                <TextField
                  size="small"
                  label="End VLAN"
                  value={newRange.end}
                  onChange={(e) => setNewRange({ ...newRange, end: e.target.value })}
                  sx={{ 
                    width: '120px',
                    '& .MuiInputBase-root': { height: '32px' }
                  }}
                />
                <FormControl size="small" sx={{ width: '200px' }}>
                  <InputLabel>Region</InputLabel>
                  <Select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    label="Region"
                    sx={{ height: '32px' }}
                  >
                    {regions.map((region) => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  onClick={handleAddRange}
                  size="small"
                  sx={{ height: '32px' }}
                >
                  Add Range
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ 
          mt: 1,
          borderRadius: 0,
        }}>
          <Box sx={{ p: 1 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 1,
                  '& .MuiAlert-message': {
                    color: 'error.main',
                  }
                }}
              >
                {error}
              </Alert>
            )}
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Start VLAN</TableCell>
                    <TableCell>End VLAN</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vlanRanges.map((range) => (
                    <TableRow key={range.id}>
                      <TableCell>{range.start_vlan}</TableCell>
                      <TableCell>{range.end_vlan}</TableCell>
                      <TableCell>{range.region_name}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteRange(range.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ManageVLANRanges; 