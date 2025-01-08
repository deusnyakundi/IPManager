import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { resetSessionTimeout, sessionWarningEvent, getRemainingTime } from '../../utils/sessionManager';

const UPDATE_INTERVAL = 1000; // Update countdown every second

const SessionTimeoutDialog = () => {
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Handler for session warning event
    const handleSessionWarning = () => {
      setTimeLeft(getRemainingTime());
      setOpen(true);
    };

    // Add event listener for session warning
    window.addEventListener('sessionWarning', handleSessionWarning);

    return () => {
      window.removeEventListener('sessionWarning', handleSessionWarning);
    };
  }, []);

  useEffect(() => {
    let intervalId;
    
    if (open) {
      intervalId = setInterval(() => {
        const remaining = getRemainingTime();
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          clearInterval(intervalId);
          setOpen(false);
        }
      }, UPDATE_INTERVAL);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [open]);

  const handleExtendSession = () => {
    resetSessionTimeout(navigate);
    setOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    navigate('/login', {
      state: {
        message: 'You have been logged out.',
        severity: 'info',
      },
    });
  };

  // Calculate progress percentage (from 5 minutes to 0)
  const progress = ((300000 - timeLeft) / 300000) * 100;

  // Don't render if dialog is not open
  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={() => {}} // Prevent closing by clicking outside
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>Session Timeout Warning</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Your session will expire in {Math.ceil(timeLeft / 1000)} seconds.
        </Typography>
        <Typography gutterBottom>
          Would you like to extend your session?
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            mt: 2,
            '& .MuiLinearProgress-bar': {
              transition: 'none' // Remove transition for smoother updates
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleLogout} color="error">
          Logout Now
        </Button>
        <Button onClick={handleExtendSession} variant="contained" autoFocus>
          Extend Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeoutDialog; 