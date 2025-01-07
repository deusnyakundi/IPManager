import { refreshTokens, verifySession } from '../services/auth.service';
import api from './api';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];
let sessionTimeoutId = null;
let activityListenersAdded = false;
let lastActivityTime = Date.now();
let sessionCheckIntervalId = null;

// Callbacks storage
let onSessionExpiredCallback = () => {};
let onSecurityEventCallback = () => {};

export const initializeSessionManager = (onSessionExpired, onSecurityEvent) => {
  onSessionExpiredCallback = onSessionExpired;
  onSecurityEventCallback = onSecurityEvent;
  
  if (!activityListenersAdded) {
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, resetSessionTimer);
    });
    activityListenersAdded = true;
  }
  
  resetSessionTimer();
  startConcurrentSessionCheck();
};

export const resetSessionTimer = () => {
  lastActivityTime = Date.now();
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
  }
  sessionTimeoutId = setTimeout(handleSessionTimeout, SESSION_TIMEOUT);
};

const handleSessionTimeout = () => {
  cleanupSession();
  onSessionExpiredCallback();
};

export const cleanupSession = () => {
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
  
  if (sessionCheckIntervalId) {
    clearInterval(sessionCheckIntervalId);
    sessionCheckIntervalId = null;
  }
  
  if (activityListenersAdded) {
    ACTIVITY_EVENTS.forEach(event => {
      window.removeEventListener(event, resetSessionTimer);
    });
    activityListenersAdded = false;
  }
};

// Store the current session ID
let currentSessionId = null;

export const setSessionId = (sessionId) => {
  currentSessionId = sessionId;
  localStorage.setItem('sessionId', sessionId);
};

export const getSessionId = () => {
  return currentSessionId || localStorage.getItem('sessionId');
};

// Check for concurrent sessions every minute using the verify endpoint
const startConcurrentSessionCheck = () => {
  // Clear any existing interval
  if (sessionCheckIntervalId) {
    clearInterval(sessionCheckIntervalId);
  }

  sessionCheckIntervalId = setInterval(async () => {
    try {
      // Use the existing verify endpoint
      await verifySession();
    } catch (error) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        cleanupSession();
        onSecurityEventCallback('invalid_session');
      } else if (error.response?.data?.error === 'concurrent_session') {
        cleanupSession();
        onSecurityEventCallback('concurrent_session');
      }
      // Don't log network errors as they're expected when offline
      if (error.response) {
        console.error('Session check failed:', error);
      }
    }
  }, 60000); // Check every minute
};

// Function to handle security-sensitive operations
export const handleSecurityOperation = async (operation) => {
  try {
    // Use the existing verify endpoint
    await verifySession();
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      cleanupSession();
      onSecurityEventCallback('invalid_session');
    }
    return false;
  }
};

// Function to check if the session is active
export const isSessionActive = () => {
  return Date.now() - lastActivityTime < SESSION_TIMEOUT;
};

// Function to extend session if needed
export const extendSessionIfNeeded = async () => {
  if (Date.now() - lastActivityTime > SESSION_TIMEOUT / 2) {
    try {
      await refreshTokens();
      resetSessionTimer();
    } catch (error) {
      console.error('Failed to extend session:', error);
      handleSessionTimeout();
    }
  }
}; 