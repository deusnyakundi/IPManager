import React, { useState } from 'react';
import {
  Box,
  IconButton,
  InputBase,
  Paper,
  Slide,
  styled
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  height: '32px',
}));

const SearchPaper = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  right: 0,
  display: 'flex',
  alignItems: 'center',
  height: '32px',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  height: '32px',
  '& .MuiInputBase-input': {
    padding: theme.spacing(0, 1),
    height: '32px',
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

const ExpandingSearch = ({ onSearch }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    } else if (searchTerm) {
      onSearch(searchTerm);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setSearchTerm('');
    onSearch('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchTerm) {
      onSearch(searchTerm);
    }
  };

  return (
    <SearchContainer>
      {!isExpanded && (
        <IconButton
          size="small"
          onClick={handleSearchClick}
          sx={{ 
            height: '32px',
            width: '32px',
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          <SearchIcon fontSize="small" />
        </IconButton>
      )}
      <Slide direction="left" in={isExpanded} mountOnEnter unmountOnExit>
        <SearchPaper elevation={0}>
          <StyledInputBase
            autoFocus
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <IconButton
            size="small"
            onClick={handleSearchClick}
            sx={{ 
              height: '32px',
              width: '32px',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ 
              height: '32px',
              width: '32px',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </SearchPaper>
      </Slide>
    </SearchContainer>
  );
};

export default ExpandingSearch; 