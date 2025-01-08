import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { CloudUpload } from '@mui/icons-material';

const FileUploadDialog = ({ open, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Data File</DialogTitle>
      <DialogContent>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          {file ? (
            <Typography variant="body1">{file.name}</Typography>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Drag and drop a file here, or click to select
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supported formats: .xlsx, .xls
              </Typography>
            </>
          )}
        </Box>
        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!file || uploading}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadDialog; 