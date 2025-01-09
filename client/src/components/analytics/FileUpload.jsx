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
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../../utils/api';

const FileUpload = ({ onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingFiles, setProcessingFiles] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [selectedUploadedFile, setSelectedUploadedFile] = useState(null);

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

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

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
      setSelectedFile(null);
      setUploadProgress(0);
      setProcessingFiles(new Set([...processingFiles, response.data.fileId]));
      await fetchUploadHistory();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to upload file';
      setError(errorMessage);
      // Log detailed error information
      if (error.response) {
        console.log('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      }
    }
  };

  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    try {
      await api.delete(`/analytics/upload/${fileToDelete.id}`);
      setSuccess('File deleted successfully');
      if (selectedUploadedFile?.id === fileToDelete.id) {
        setSelectedUploadedFile(null);
        onFileSelect(null);
      }
      await fetchUploadHistory();
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete file');
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleFileSelection = (file) => {
    setSelectedUploadedFile(file);
    onFileSelect(file);
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
          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {selectedFile.name}
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
          disabled={!selectedFile || uploadProgress > 0}
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

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">Select</TableCell>
                <TableCell>Filename</TableCell>
                <TableCell>Uploaded By</TableCell>
                <TableCell>Upload Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {uploadHistory.map((file) => (
                <TableRow 
                  key={file.id}
                  selected={selectedUploadedFile?.id === file.id}
                  hover
                  onClick={() => file.status === 'completed' && handleFileSelection(file)}
                  sx={{ cursor: file.status === 'completed' ? 'pointer' : 'default' }}
                >
                  <TableCell padding="checkbox">
                    <Radio
                      checked={selectedUploadedFile?.id === file.id}
                      disabled={file.status !== 'completed'}
                    />
                  </TableCell>
                  <TableCell>{file.filename}</TableCell>
                  <TableCell>{file.uploaded_by_user}</TableCell>
                  <TableCell>{formatDate(file.upload_date)}</TableCell>
                  <TableCell>
                    {processingFiles.has(file.id) ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Processing
                        <LinearProgress
                          sx={{ width: 50, ml: 1 }}
                          size={20}
                        />
                      </Box>
                    ) : (
                      file.status
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(file);
                      }}
                      disabled={processingFiles.has(file.id)}
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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {fileToDelete?.filename}?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUpload; 