import { useNavigate } from 'react-router-dom';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
const CHECK_INTERVAL = 60 * 1000; // Check every minute
let timeoutId = null;
let warningTimeoutId = null;
let activityTimeoutId = null;
let checkIntervalId = null;

// Create a custom event name constant
const SESSION_WARNING_EVENT = 'sessionWarning';

const updateLastActivity = () => {
  localStorage.setItem('lastActivity', new Date().getTime().toString());
};

const getTimeUntilTimeout = () => {
  const lastActivity = localStorage.getItem('lastActivity');
  if (!lastActivity) return 0;
  
  const currentTime = new Date().getTime();
  const timeSinceLastActivity = currentTime - parseInt(lastActivity);
  return SESSION_TIMEOUT - timeSinceLastActivity;
};

const dispatchWarning = () => {
  // Create and dispatch the warning event
  const event = new CustomEvent(SESSION_WARNING_EVENT);
  window.dispatchEvent(event);
};

export const initializeSessionTimeout = (navigate) => {
  // Clear any existing timeouts and intervals
  clearTimeout(timeoutId);
  clearTimeout(warningTimeoutId);
  clearTimeout(activityTimeoutId);
  clearInterval(checkIntervalId);

  // Update last activity
  updateLastActivity();

  // Calculate time until warning and timeout
  const timeUntilTimeout = getTimeUntilTimeout();
  const timeUntilWarning = timeUntilTimeout - WARNING_TIME;

  // Set warning timeout
  if (timeUntilWarning > 0) {
    warningTimeoutId = setTimeout(() => {
      dispatchWarning();
    }, timeUntilWarning);
  }

  // Set session timeout
  timeoutId = setTimeout(() => {
    handleSessionTimeout(navigate);
  }, timeUntilTimeout);

  // Start periodic checks
  checkIntervalId = setInterval(() => {
    const remainingTime = getTimeUntilTimeout();
    if (remainingTime <= 0) {
      handleSessionTimeout(navigate);
    } else if (remainingTime <= WARNING_TIME && !warningTimeoutId) {
      // If we're within warning period but warning hasn't been shown
      dispatchWarning();
    }
  }, CHECK_INTERVAL);
};

export const resetSessionTimeout = (navigate) => {
  // Clear existing timeouts and intervals
  clearTimeout(timeoutId);
  clearTimeout(warningTimeoutId);
  clearTimeout(activityTimeoutId);
  clearInterval(checkIntervalId);

  // Update last activity
  updateLastActivity();

  // Set new timeouts
  initializeSessionTimeout(navigate);
};

const handleSessionTimeout = (navigate) => {
  // Clear all timeouts and intervals
  clearTimeout(timeoutId);
  clearTimeout(warningTimeoutId);
  clearTimeout(activityTimeoutId);
  clearInterval(checkIntervalId);

  // Clear session data
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('lastActivity');

  // Redirect to login with message
  navigate('/login', { 
    state: { 
      message: 'Your session has expired. Please log in again.',
      severity: 'warning'
    } 
  });
};

export const checkSessionTimeout = () => {
  const lastActivity = localStorage.getItem('lastActivity');
  const token = localStorage.getItem('token');
  
  if (token && lastActivity) {
    const currentTime = new Date().getTime();
    const timeSinceLastActivity = currentTime - parseInt(lastActivity);
    
    return timeSinceLastActivity > SESSION_TIMEOUT;
  }
  
  return false;
};

export const getRemainingTime = () => {
  const lastActivity = localStorage.getItem('lastActivity');
  if (!lastActivity) return 0;
  
  const currentTime = new Date().getTime();
  const timeSinceLastActivity = currentTime - parseInt(lastActivity);
  return Math.max(0, SESSION_TIMEOUT - timeSinceLastActivity);
};

export const useSessionTimeout = () => {
  const navigate = useNavigate();

  const setupActivityListeners = () => {
    const resetTimeout = () => {
      // Debounce the reset to prevent excessive calls
      clearTimeout(activityTimeoutId);
      activityTimeoutId = setTimeout(() => {
        // Only reset if there's an active session
        if (localStorage.getItem('token')) {
          resetSessionTimeout(navigate);
        }
      }, 1000); // Wait 1 second after last activity
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keypress', resetTimeout);
    window.addEventListener('click', resetTimeout);
    window.addEventListener('scroll', resetTimeout);

    // Check for existing session timeout
    if (checkSessionTimeout()) {
      handleSessionTimeout(navigate);
    } else {
      // Initialize the first timeout only if there's an active session
      if (localStorage.getItem('token')) {
        initializeSessionTimeout(navigate);
      }
    }

    // Cleanup function
    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
      window.removeEventListener('click', resetTimeout);
      window.removeEventListener('scroll', resetTimeout);
      clearTimeout(timeoutId);
      clearTimeout(warningTimeoutId);
      clearTimeout(activityTimeoutId);
      clearInterval(checkIntervalId);
    };
  };

  return { setupActivityListeners };
};

// Export the event name for components to listen to
export const SESSION_WARNING_EVENT_NAME = SESSION_WARNING_EVENT; 