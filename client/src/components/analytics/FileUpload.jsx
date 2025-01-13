import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../../utils/api';

const FileUpload = ({ onFileSelect }) => {
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedAnalyticsFile, setSelectedAnalyticsFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingFiles, setProcessingFiles] = useState(new Set());
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch upload history on component mount
  useEffect(() => {
    fetchUploadHistory();
  }, []);

  // Poll for processing files status
  useEffect(() => {
    if (processingFiles.size === 0) return;

    const interval = setInterval(async () => {
      const newProcessingFiles = new Set(processingFiles);
      
      for (const fileId of processingFiles) {
        try {
          const response = await api.get(`/analytics/upload/${fileId}/status`);
          if (response.data.status !== 'processing') {
            newProcessingFiles.delete(fileId);
            await fetchUploadHistory();
          }
        } catch (error) {
          console.error('Error checking file status:', error);
        }
      }

      setProcessingFiles(newProcessingFiles);
      if (newProcessingFiles.size === 0) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [processingFiles]);

  const fetchUploadHistory = async () => {
    try {
      const response = await api.get('/analytics/uploads');
      setUploadHistory(response.data);
    } catch (error) {
      console.error('Error fetching upload history:', error);
      setError('Failed to fetch upload history');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/excel',
        'application/x-excel',
        'application/x-msexcel'
      ];
      
      if (!validTypes.includes(file.type) && 
          !file.name.match(/\.(xlsx|xls)$/i)) {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }

      setUploadFile(file);
      setError('');
    }
  };

  const handleAnalyticsFileSelect = (file) => {
    setSelectedAnalyticsFile(file);
    onFileSelect(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      setUploadProgress(0);
      const response = await api.post('/analytics/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      setSuccess('File uploaded successfully');
      setUploadFile(null);
      setUploadProgress(0);
      setProcessingFiles(new Set([...processingFiles, response.data.fileId]));
      await fetchUploadHistory();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to upload file';
      setError(errorMessage);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/analytics/upload/${selectedAnalyticsFile.id}`);
      
      // Update the file list
      fetchUploadHistory();
      
      // Show success notification
      setNotification({
        open: true,
        message: 'File deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Delete error:', error);
      setNotification({
        open: true,
        message: error.response?.data?.error || 'Failed to delete file',
        severity: 'error'
      });
    } finally {
      setDeleteDialog(false);
    }
  };

  const handleDelete = (file) => {
    setSelectedAnalyticsFile(file);
    setDeleteDialog(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Excel File
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <input
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadIcon />}
            >
              Select File
            </Button>
          </label>
          {uploadFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {uploadFile.name}
            </Typography>
          )}
        </Box>

        {uploadProgress > 0 && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!uploadFile || uploadProgress > 0}
        >
          Upload
        </Button>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Upload History</Typography>
          <IconButton onClick={fetchUploadHistory} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Select</TableCell>
                <TableCell>File Name</TableCell>
                <TableCell>Upload Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {uploadHistory.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <Radio
                      checked={selectedAnalyticsFile?.id === file.id}
                      onChange={() => handleAnalyticsFileSelect(file)}
                      disabled={file.status !== 'completed'}
                    />
                  </TableCell>
                  <TableCell>{file.original_name}</TableCell>
                  <TableCell>
                    {new Date(file.upload_date).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={file.status}
                      color={
                        file.status === 'completed' ? 'success' :
                        file.status === 'processing' ? 'warning' :
                        file.status === 'error' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleDelete(file)}
                      size="small"
                      color="error"
                      title="Delete file"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedAnalyticsFile?.original_name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUpload; 