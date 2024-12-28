import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
  styled
} from '@mui/material';
import {
  Info as InfoIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import api from '../../utils/api';

// Styled components
const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2),
  minWidth: '320px',
  maxWidth: '400px',
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const FormSection = styled(Box)(({ theme }) => ({
  '& > *:not(:last-child)': {
    marginBottom: theme.spacing(2),
  },
}));

const SiteForm = ({ site, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    region_id: '',
    msp_id: '',
    ipran_cluster_id: ''
  });
  const [regions, setRegions] = useState([]);
  const [msps, setMsps] = useState([]);
  const [ipran_clusters, setIPRANClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        ipAddress: site.ipAddress || '',
        region_id: site.region_id || '',
        msp_id: site.msp_id || '',
        ipran_cluster_id: site.ipran_cluster_id || ''
      });
    }
    fetchRegions();
    fetchMsps();
    fetchIPRANClusters();
  }, [site]);

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions');
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
      setSubmitError('Failed to load regions. Please try again.');
    }
  };


  const fetchMsps = async () => {
    try {
      const response = await api.get('/msps');
      setMsps(response.data);
    } catch (error) {
      console.error('Error fetching MSPs:', error);
      setSubmitError('Failed to load MSPs. Please try again.');
    }
  };

  const fetchIPRANClusters = async () => {
    try {
      const response = await api.get('/ipran-clusters');
      setIPRANClusters(response.data);
    } catch (error) {
      console.error('Error fetching IPRAN Clusters:', error);
      setSubmitError('Failed to load IPRAN Clusters. Please try again.');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Site name is required';
    }
    if (!formData.region_id) {
      newErrors.region_id = 'Region is required';
    }
    if (formData.ipAddress && !/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ipAddress)) {
      newErrors.ipAddress = 'Invalid IP address format';
    }
    if (!formData.msp_id) {
      newErrors.msp_id = 'MSP is required';
    }
    if (!formData.ipran_cluster_id) {
      newErrors.ipran_cluster_id = 'IPRAN Cluster is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name,
        region_id: formData.region_id,
        msp_id: formData.msp_id,
        ipran_cluster_id: formData.ipran_cluster_id,
        ip: formData.ipAddress
      });
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create site';
      setSubmitError(errorMessage);
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ 
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        {site ? 'Edit Site' : 'Add New Site'}
      </DialogTitle>

      <StyledDialogContent>
        {submitError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              width: '100%',
              '& .MuiAlert-message': {
                color: 'error.main',
              }
            }}
          >
            {submitError}
          </Alert>
        )}

        <FormSection>
          <TextField
            name="name"
            label="Site Name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            required
            fullWidth
            size="small"
          />
          
          <TextField
            select
            name="region_id"
            label="Region"
            value={formData.region_id}
            onChange={handleChange}
            error={!!errors.region_id}
            helperText={errors.region_id}
            required
            fullWidth
            size="small"
            InputProps={{
              startAdornment: formData.region_id ? (
                <InputAdornment position="start">
                  <LocationIcon fontSize="small" />
                </InputAdornment>
              ) : null
            }}
          >
            {regions.map((region) => (
              <MenuItem key={region.id} value={region.id}>
                {region.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            name="ipAddress"
            label="IP Address"
            value={formData.ipAddress}
            onChange={handleChange}
            error={!!errors.ipAddress}
            helperText={errors.ipAddress}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: formData.ipAddress ? (
                <InputAdornment position="start">
                  <Tooltip title="Format: xxx.xxx.xxx.xxx (optional)">
                    <InfoIcon fontSize="small" color="action" />
                  </Tooltip>
                </InputAdornment>
              ) : null
            }}
          />

         <TextField
            select
            name="msp_id"
            label="MSP"
            value={formData.msp_id}
            onChange={handleChange}
            error={!!errors.msp_id}
            helperText={errors.msp_id}
            required
            fullWidth
            size="small"
            InputProps={{
              startAdornment: formData.msp_id ? (
                <InputAdornment position="start">
                  <LocationIcon fontSize="small" />
                </InputAdornment>
              ) : null
            }}
          >
            {msps.map((msp) => (
              <MenuItem key={msp.id} value={msp.id}>
                {msp.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            name="ipran_cluster_id"
            label="IPRAN Cluster"
            value={formData.ipran_cluster_id}
            onChange={handleChange}
            error={!!errors.ipran_cluster_id}
            helperText={errors.ipran_cluster_id}
            required
            fullWidth
            size="small"
            InputProps={{
              startAdornment: formData.ipran_cluster_id ? (
                <InputAdornment position="start">
                  <LocationIcon fontSize="small" />
                </InputAdornment>
              ) : null
            }}
          >
            {ipran_clusters.map((ipran_cluster) => (
              <MenuItem key={ipran_cluster.id} value={ipran_cluster.id}>
                {ipran_cluster.name}
              </MenuItem>
            ))}
          </TextField>
        </FormSection>
      </StyledDialogContent>

      <StyledDialogActions>
        <Button 
          onClick={onClose}
          disabled={loading}
          size="small"
          sx={{ minWidth: '80px' }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          size="small"
          sx={{ minWidth: '80px' }}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {site ? 'Update' : 'Create'}
        </Button>
      </StyledDialogActions>
    </Box>
  );
};

export default SiteForm; 