import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  styled
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1),
  height: '32px',
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.background.default,
    fontWeight: 600,
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // Set a consistent height for table rows
  '& > .MuiTableCell-root': {
    height: '32px',
    padding: theme.spacing(1),
  }
}));

const ImportResultsDialog = ({ open, onClose, results }) => {
  const [showErrors, setShowErrors] = useState(false);

  if (!results) return null;

  const { imported, failed, errors } = results;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        Import Results
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SuccessIcon color="success" />
              <Typography>
                Successfully imported: <strong>{imported}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="error" />
              <Typography>
                Failed to import: <strong>{failed}</strong>
              </Typography>
            </Box>
          </Box>
          {failed > 0 && (
            <Button
              size="small"
              onClick={() => setShowErrors(!showErrors)}
              endIcon={showErrors ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mb: 1 }}
            >
              {showErrors ? 'Hide Errors' : 'Show Errors'}
            </Button>
          )}
        </Box>

        <Collapse in={showErrors}>
          {errors && errors.length > 0 && (
            <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Site Name</StyledTableCell>
                    <StyledTableCell>Error Message</StyledTableCell>
                    <StyledTableCell>IP Address</StyledTableCell>
                    <StyledTableCell>Region</StyledTableCell>
                    <StyledTableCell>MSP</StyledTableCell>
                    <StyledTableCell>IPRAN Cluster</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors.map((error, index) => (
                    <StyledTableRow key={index}>
                      <StyledTableCell>{error.site}</StyledTableCell>
                      <StyledTableCell sx={{ color: 'error.main' }}>{error.error}</StyledTableCell>
                      <StyledTableCell>{error.details.providedIP || '-'}</StyledTableCell>
                      <StyledTableCell>{error.details.providedRegion || '-'}</StyledTableCell>
                      <StyledTableCell>{error.details.providedMSP || '-'}</StyledTableCell>
                      <StyledTableCell>{error.details.providedCluster || '-'}</StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Collapse>
      </DialogContent>
    </Dialog>
  );
};

export default ImportResultsDialog; 