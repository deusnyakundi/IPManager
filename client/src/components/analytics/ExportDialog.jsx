import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormLabel,
  RadioGroup,
  Radio,
  CircularProgress,
  Typography,
} from '@mui/material';

const ExportDialog = ({ open, onClose, fileId }) => {
  const [format, setFormat] = useState('excel');
  const [options, setOptions] = useState({
    summary: true,
    trends: true,
    regional: true,
    impact: true,
    rawData: false,
  });
  const [loading, setLoading] = useState(false);

  const handleFormatChange = (event) => {
    setFormat(event.target.value);
  };

  const handleOptionChange = (event) => {
    setOptions({
      ...options,
      [event.target.name]: event.target.checked,
    });
  };

  const handleExport = async () => {
    if (!fileId) return;

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        fileId,
        format,
        options: JSON.stringify(options),
      });

      const response = await fetch(`/api/analytics/export?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?([^"]*)"?/);
      const filename = filenameMatch ? filenameMatch[1] : 'network_analysis';

      // Create a blob from the response and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Analytics Data</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Export Format</FormLabel>
            <RadioGroup
              value={format}
              onChange={handleFormatChange}
              row
            >
              <FormControlLabel
                value="excel"
                control={<Radio />}
                label="Excel"
              />
              <FormControlLabel
                value="csv"
                control={<Radio />}
                label="CSV"
              />
              <FormControlLabel
                value="pdf"
                control={<Radio />}
                label="PDF"
              />
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset">
            <FormLabel component="legend">Data to Include</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.summary}
                    onChange={handleOptionChange}
                    name="summary"
                  />
                }
                label="Summary Analysis"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.trends}
                    onChange={handleOptionChange}
                    name="trends"
                  />
                }
                label="Trends Analysis"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.regional}
                    onChange={handleOptionChange}
                    name="regional"
                  />
                }
                label="Regional Analysis"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.impact}
                    onChange={handleOptionChange}
                    name="impact"
                  />
                }
                label="Impact Analysis"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.rawData}
                    onChange={handleOptionChange}
                    name="rawData"
                  />
                }
                label="Raw Data"
              />
            </FormGroup>
          </FormControl>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>Preparing export...</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={loading || !Object.values(options).some(Boolean)}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog; 