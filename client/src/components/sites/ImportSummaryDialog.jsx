import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Alert,
  Divider
} from '@mui/material';

const ImportSummaryDialog = ({ open, onClose, summary }) => {
  if (!summary) return null;

  const { totalRows, importedRows, failures = [] } = summary;
  const successCount = importedRows;
  const failureCount = failures.length;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Import Summary</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Overview</Typography>
          <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
            <Typography>Total rows processed: {totalRows}</Typography>
            <Typography color="success.main">Successfully imported: {successCount}</Typography>
            <Typography color="error.main">Failed imports: {failureCount}</Typography>
          </Paper>
        </Box>

        {failures.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Failed Imports</Typography>
            <List>
              {failures.map((failure, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          Row {failure.rowNumber || index + 1}: {failure.siteName || 'Unknown Site'}
                        </Typography>
                      }
                      secondary={
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {failure.error}
                        </Alert>
                      }
                    />
                  </ListItem>
                  {index < failures.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportSummaryDialog; 