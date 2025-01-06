import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Box,
  styled
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  NetworkCheck as NetworkIcon 
} from '@mui/icons-material';

// Styled components for enhanced table design
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
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  // Set a consistent height for table rows
  '& > .MuiTableCell-root': {
    height: '32px',
    padding: theme.spacing(1),
  }
}));

const SitesList = ({ 
  sites = [], 
  loading, 
  onEdit, 
  onDelete,
  onGenerateIP,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  totalRows 
}) => {
  const renderTableContent = () => {
    if (loading) {
      return [...Array(5)].map((_, index) => (
        <StyledTableRow key={`loading-${index}`}>
          {[...Array(6)].map((_, cellIndex) => (
            <StyledTableCell key={`loading-cell-${cellIndex}`}>
              <Skeleton animation="wave" />
            </StyledTableCell>
          ))}
        </StyledTableRow>
      ));
    }

    if (!sites.length) {
      return (
        <TableRow>
          <TableCell colSpan={6} align="center">
            <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <NetworkIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                No Sites Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add a new site to get started
              </Typography>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    return sites.map((site) => (
      <StyledTableRow key={site.id}>
        <StyledTableCell>{site.name}</StyledTableCell>
        <StyledTableCell>
          {site.region ? (
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              {site.region.name}
            </Typography>
          ) : '-'}
        </StyledTableCell>
        <StyledTableCell>
          {site.ipAddress ? (
            <Tooltip title="IP Address" arrow>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {site.ipAddress}
              </Typography>
            </Tooltip>
          ) : '-'}
        </StyledTableCell>
        <StyledTableCell>
          {site.msp ? (
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              {site.msp.name}
            </Typography>
          ) : '-'}
        </StyledTableCell>
        <StyledTableCell>
          {site.ipranCluster ? (
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              {site.ipranCluster}
            </Typography>
          ) : '-'}
        </StyledTableCell>
        <StyledTableCell>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Edit Site">
              <IconButton 
                size="small" 
                onClick={() => onEdit?.(site)}
                sx={{ 
                  padding: 0.5,
                  '&:hover': { color: 'primary.main' } 
                }}
              >
                <EditIcon sx={{ fontSize: '1.25rem' }} />
              </IconButton>
            </Tooltip>
            {!site.ipAddress && (
              <Tooltip title="Generate IP">
                <IconButton 
                  size="small" 
                  onClick={() => onGenerateIP?.(site)}
                  sx={{ 
                    padding: 0.5,
                    '&:hover': { color: 'success.main' } 
                  }}
                >
                  <NetworkIcon sx={{ fontSize: '1.25rem' }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete Site">
              <IconButton 
                size="small" 
                onClick={() => onDelete?.(site)}
                sx={{ 
                  padding: 0.5,
                  '&:hover': { color: 'error.main' } 
                }}
              >
                <DeleteIcon sx={{ fontSize: '1.25rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </StyledTableCell>
      </StyledTableRow>
    ));
  };

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <StyledTableCell>Site Name</StyledTableCell>
            <StyledTableCell>Region</StyledTableCell>
            <StyledTableCell>IP Address</StyledTableCell>
            <StyledTableCell>MSP</StyledTableCell>
            <StyledTableCell>IPRAN Cluster</StyledTableCell>
            <StyledTableCell align="left" sx={{ width: '120px' }}>Actions</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {renderTableContent()}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SitesList; 