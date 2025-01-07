import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeSessionManager, cleanupSession, handleSecurityOperation, extendSessionIfNeeded } from '../utils/sessionManager';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const navigate = useNavigate();
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState('');

  useEffect(() => {
    const handleSessionExpired = () => {
      setDialogMessage('Your session has expired. Please log in again.');
      setDialogType('expired');
      setShowSessionDialog(true);
    };

    const handleSecurityEvent = (eventType) => {
      if (eventType === 'concurrent_session') {
        setDialogMessage('Your account has been logged in from another device.');
        setDialogType('concurrent');
        setShowSessionDialog(true);
      } else if (eventType === 'invalid_session') {
        setDialogMessage('Your session is no longer valid. Please log in again.');
        setDialogType('invalid');
        setShowSessionDialog(true);
      }
    };

    initializeSessionManager(handleSessionExpired, handleSecurityEvent);

    // Cleanup on unmount
    return () => {
      cleanupSession();
    };
  }, [navigate]);

  const handleDialogClose = () => {
    setShowSessionDialog(false);
    // Clear any stored tokens/session data
    localStorage.clear();
    sessionStorage.clear();
    // Redirect to login
    navigate('/login');
  };

  const verifySecurityOperation = async (operation) => {
    await extendSessionIfNeeded();
    return handleSecurityOperation(operation);
  };

  return (
    <SessionContext.Provider value={{ verifySecurityOperation }}>
      {children}
      <Dialog
        open={showSessionDialog}
        onClose={handleDialogClose}
        disableEscapeKeyDown
        disableBackdropClick
      >
        <DialogTitle>
          {dialogType === 'expired' ? 'Session Expired' : 
           dialogType === 'concurrent' ? 'Account Logged In Elsewhere' : 
           'Invalid Session'}
        </DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary" autoFocus>
            Log In Again
          </Button>
        </DialogActions>
      </Dialog>
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}; 