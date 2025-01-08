import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Checkbox,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Description as ExcelIcon,
  PictureAsPdf as PdfIcon,
  Slideshow as PptIcon,
  Save as CsvIcon,
} from '@mui/icons-material';
import api from '../../utils/api';

const ExportOptions = ({ selectedFile, data, onExport }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState(null);
  const [exportOptions, setExportOptions] = useState({
    summary: true,
    trends: true,
    regional: true,
    impact: true,
    rawData: false,
  });
  const [exporting, setExporting] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportTypeSelect = (type) => {
    setExportType(type);
    setExportDialogOpen(true);
    handleClose();
  };

  const handleExportOptionChange = (option) => {
    setExportOptions({
      ...exportOptions,
      [option]: !exportOptions[option],
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let response;
      const options = {
        responseType: 'blob',
        params: {
          fileId: selectedFile.id,
          options: exportOptions,
        },
      };

      switch (exportType) {
        case 'excel':
          response = await api.get('/analytics/export/excel', options);
          downloadFile(response.data, 'network_analysis.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          break;
        case 'pdf':
          response = await api.get('/analytics/export/pdf', options);
          downloadFile(response.data, 'network_analysis.pdf', 'application/pdf');
          break;
        case 'ppt':
          response = await api.get('/analytics/powerpoint', options);
          downloadFile(response.data, 'network_analysis.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
          break;
        case 'csv':
          response = await api.get('/analytics/export/csv', options);
          downloadFile(response.data, 'network_analysis.csv', 'text/csv');
          break;
      }

      onExport?.();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
      setExportDialogOpen(false);
    }
  };

  const downloadFile = (data, filename, type) => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleClick}
        disabled={!data}
      >
        Export
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleExportTypeSelect('excel')}>
          <ListItemIcon>
            <ExcelIcon />
          </ListItemIcon>
          <ListItemText primary="Export to Excel" />
        </MenuItem>
        <MenuItem onClick={() => handleExportTypeSelect('pdf')}>
          <ListItemIcon>
            <PdfIcon />
          </ListItemIcon>
          <ListItemText primary="Export to PDF" />
        </MenuItem>
        <MenuItem onClick={() => handleExportTypeSelect('ppt')}>
          <ListItemIcon>
            <PptIcon />
          </ListItemIcon>
          <ListItemText primary="Export to PowerPoint" />
        </MenuItem>
        <MenuItem onClick={() => handleExportTypeSelect('csv')}>
          <ListItemIcon>
            <CsvIcon />
          </ListItemIcon>
          <ListItemText primary="Export to CSV" />
        </MenuItem>
      </Menu>

      <Dialog
        open={exportDialogOpen}
        onClose={() => !exporting && setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Export Options
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Select the sections to include in the export:
          </Typography>
          <FormControl component="fieldset">
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.summary}
                  onChange={() => handleExportOptionChange('summary')}
                />
              }
              label="Summary Analysis"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.trends}
                  onChange={() => handleExportOptionChange('trends')}
                />
              }
              label="Trends Analysis"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.regional}
                  onChange={() => handleExportOptionChange('regional')}
                />
              }
              label="Regional Analysis"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.impact}
                  onChange={() => handleExportOptionChange('impact')}
                />
              }
              label="Impact Analysis"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.rawData}
                  onChange={() => handleExportOptionChange('rawData')}
                />
              }
              label="Raw Data"
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setExportDialogOpen(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exporting}
            startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExportOptions; 