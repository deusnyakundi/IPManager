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
  Chip,
  styled
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  NetworkCheck as NetworkIcon 
} from '@mui/icons-material';

// Styled components for enhanced table design
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  borderRadius: '16px',
  fontWeight: 'medium',
  ...(status === 'active' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
  }),
  ...(status === 'inactive' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  }),
}));

const SitesList = ({ 
  sites = [], 
  loading, 
  onEdit, 
  onDelete,
  onGenerateIP 
}) => {
  const renderTableContent = () => {
    if (loading) {
      return [...Array(5)].map((_, index) => (
        <StyledTableRow key={`loading-${index}`}>
          {[...Array(5)].map((_, cellIndex) => (
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
          <TableCell colSpan={5} align="center">
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
            <Chip 
              label={site.region.name}
              size="small"
              sx={{ 
                backgroundColor: 'primary.light',
                color: 'primary.dark',
              }}
            />
          ) : '-'}
        </StyledTableCell>
        <StyledTableCell>
          {site.ipAddress ? (
            <Tooltip title="IP Address" arrow>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {site.ipAddress}
              </Typography>
            </Tooltip>
          ) : '-'}
        </StyledTableCell>
        <StyledTableCell>
          <StatusChip 
            label={site.ipAddress ? 'Active' : 'Pending'}
            status={site.ipAddress ? 'active' : 'inactive'}
            size="small"
          />
        </StyledTableCell>
        <StyledTableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit Site">
              <IconButton 
                size="small" 
                onClick={() => onEdit(site)}
                sx={{ '&:hover': { color: 'primary.main' } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {!site.ipAddress && (
              <Tooltip title="Generate IP">
                <IconButton 
                  size="small" 
                  onClick={() => onGenerateIP(site)}
                  sx={{ '&:hover': { color: 'success.main' } }}
                >
                  <NetworkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete Site">
              <IconButton 
                size="small" 
                onClick={() => onDelete(site)}
                sx={{ '&:hover': { color: 'error.main' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </StyledTableCell>
      </StyledTableRow>
    ));
  };

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        boxShadow: 2,
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'background.default' }}>
            <StyledTableCell>Site Name</StyledTableCell>
            <StyledTableCell>Region</StyledTableCell>
            <StyledTableCell>IP Address</StyledTableCell>
            <StyledTableCell>Status</StyledTableCell>
            <StyledTableCell>Actions</StyledTableCell>
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