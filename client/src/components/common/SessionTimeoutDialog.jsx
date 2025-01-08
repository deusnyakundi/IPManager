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
const WARNING_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const SessionTimeoutDialog = () => {
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Handler for session warning event
    const handleSessionWarning = () => {
      setTimeLeft(WARNING_DURATION);
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
        setTimeLeft((prevTime) => {
          const newTime = Math.max(0, prevTime - UPDATE_INTERVAL);
          if (newTime <= 0) {
            clearInterval(intervalId);
            setOpen(false);
          }
          return newTime;
        });
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
  const progress = ((WARNING_DURATION - timeLeft) / WARNING_DURATION) * 100;

  // Format time remaining in minutes and seconds
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.ceil((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
          Your session will expire in {formatTimeRemaining()}.
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