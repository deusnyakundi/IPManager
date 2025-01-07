import api from './api';

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY_KEY = 'csrf_token_expiry';
const TOKEN_LIFETIME = 30 * 60 * 1000; // 30 minutes

export const getCSRFToken = () => {
  const token = localStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = localStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) {
    return null;
  }

  // Check if token has expired
  if (Date.now() > parseInt(expiry, 10)) {
    localStorage.removeItem(CSRF_TOKEN_KEY);
    localStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
    return null;
  }

  return token;
};

export const isValidCSRFToken = (token) => {
  if (!token) return false;
  
  const expiry = localStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
  if (!expiry) return false;

  return Date.now() <= parseInt(expiry, 10);
};

export const refreshCSRFToken = async () => {
  try {
    // Instead of making a separate call, we'll use the auth verify endpoint
    // which should return a new CSRF token in its response headers
    const response = await api.get('/auth/verify');
    
    // Get token from response header
    const token = response.headers['x-csrf-token'];
    
    if (!token) {
      console.warn('No CSRF token in response headers');
      return null;
    }

    // Store token with expiry
    const expiry = Date.now() + TOKEN_LIFETIME;
    localStorage.setItem(CSRF_TOKEN_KEY, token);
    localStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, expiry.toString());

    return token;
  } catch (error) {
    // If verify endpoint fails due to auth issues, clear tokens
    if (error.response?.status === 401) {
      localStorage.removeItem(CSRF_TOKEN_KEY);
      localStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
    }
    throw error;
  }
};

// Function to clear CSRF tokens (useful for logout)
export const clearCSRFToken = () => {
  localStorage.removeItem(CSRF_TOKEN_KEY);
  localStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
}; 