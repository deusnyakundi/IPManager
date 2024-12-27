import React from 'react';
import { Button } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';

const SiteImportButton = ({ onImport }) => {
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImport(file);
    }
  };

  return (
    <>
      <input
        accept=".xlsx, .xls"  // Only accept Excel files
        style={{ display: 'none' }}
        id="raised-button-file"
        type="file"
        onChange={handleFileSelect}
      />
      <label htmlFor="raised-button-file">
        <Button
          variant="contained"
          component="span"
          startIcon={<UploadIcon />}
          size="small"
        >
          Import Sites
        </Button>
      </label>
    </>
  );
};

export default SiteImportButton; 