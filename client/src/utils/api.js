// Frontend (Axios Interceptor)
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { getCSRFToken, isValidCSRFToken, refreshCSRFToken } from './csrf';

// Create an Axios instance with base URL and content type
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL 
    : 'http://localhost:9000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];
let lastRefreshTime = 0; // Track last refresh time
const REFRESH_COOLDOWN = 30000; // 30 seconds cooldown between refreshes

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Only refresh if token is expired
    if (decoded.exp <= currentTime) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

// Function to get access token from cookies
const getAccessToken = () => {
  try {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  } catch (error) {
    return null;
  }
};

// Function to handle token refresh
const refreshToken = async () => {
  const currentTime = Date.now();
  
  // Check if we're within the cooldown period
  if (currentTime - lastRefreshTime < REFRESH_COOLDOWN) {
    return;
  }

  try {
    const response = await api.post('/auth/refresh');
    lastRefreshTime = currentTime;
    return response.data;
  } catch (error) {
    throw error;
  } finally {
    isRefreshing = false;
  }
};

// Request Interceptor: Only handle CSRF
api.interceptors.request.use(async (config) => {
  // Skip CSRF token for safe methods and auth endpoints
  if (config.method === 'get' || config.method === 'head' || config.method === 'options' ||
      ['/auth/login', '/auth/logout', '/auth/refresh'].includes(config.url)) {
    return config;
  }

  // Don't set Content-Type for FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    let csrfToken = getCSRFToken();
    if (!csrfToken || !isValidCSRFToken(csrfToken)) {
      try {
        csrfToken = await refreshCSRFToken();
      } catch (error) {
        console.warn('Failed to refresh CSRF token:', error);
      }
    }
    if (csrfToken) {
      config.headers['X-XSRF-Token'] = csrfToken;
    }
  } catch (error) {
    console.warn('Error setting CSRF token:', error);
  }

  return config;
});

// Response Interceptor: Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const noRetryEndpoints = ['/auth/refresh', '/auth/login', '/auth/logout'];
    const noRedirectEndpoints = [...noRetryEndpoints, '/auth/me'];

    // If it's already a refresh/login request that failed, redirect
    if (error.response?.status === 401 && noRetryEndpoints.includes(originalRequest.url)) {
      if (!noRedirectEndpoints.includes(originalRequest.url) && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Handle 401 errors for other requests
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        try {
          await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      isRefreshing = true;

      try {
        await refreshToken();
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (!noRedirectEndpoints.includes(originalRequest.url) && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Add cookie security check
const validateCookieSettings = () => {
  const cookies = document.cookie.split(';');
  const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
  const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refreshToken='));

  if (!accessTokenCookie || !refreshTokenCookie) {
    console.warn('Missing authentication cookies');
    return false;
  }

  // In development, we can't check for Secure flag
  if (process.env.NODE_ENV === 'production') {
    // Check if cookies are being sent over HTTPS
    if (!window.location.protocol.includes('https')) {
      console.error('Cookies are not secure: not using HTTPS');
      return false;
    }
  }

  return true;
};

// Validate cookie settings on initialization
validateCookieSettings();

// Export API modules
export const ipAPI = {
  getIPBlocks: () => api.get('/ip/blocks'),
  createIPBlock: (data) => api.post('/ip/blocks', data),
  deleteIPBlock: (id) => api.delete(`/ip/blocks/${id}`),
};

export const ipranClusterAPI = {
  getClusters: () => api.get('/ipran-clusters'),
  createCluster: (data) => api.post('/ipran-clusters', data),
  deleteCluster: (id) => api.delete(`/ipran-clusters/${id}`),
};

export const regionAPI = {
  getRegions: () => api.get('/regions'),
  createRegion: (name) => api.post('/regions', { name }),
  deleteRegion: (id) => api.delete(`/regions/${id}`),
};

export const mspAPI = {
  getMSP: () => api.get('/msps'),
  createMSP: (name) => api.post('/msps', { name }),
  updateMSP: (id, name) => api.put(`/msps/${id}`, { name }),
  deleteMSP: (id) => api.delete(`/msps/${id}`),
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  createUser: (user) => api.post('/users', user),
  deleteUser: (id) => api.delete(`/users/${id}`),
  toggle2FA: (id, enabled) => api.post(`/users/${id}/toggle-2fa`, { enabled }),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
};

export const vlanAPI = {
  getVLANRanges: () => api.get('/vlans/ranges'),
  createVLANRange: (data) => api.post('/vlans/ranges', data),
  deleteVLANRange: (id) => api.delete(`/vlans/ranges/${id}`),
};

export const vlanRangeAPI = {
  getVLANRanges: () => api.get('/vlan-ranges/ranges'),
  createVLANRange: (data) => api.post('/vlan-ranges/ranges', data),
  deleteVLANRange: (id) => api.delete(`/vlan-ranges/ranges/${id}`),
};

export const siteAPI = {
  createSite: (data, config) => api.post('/sites/generate-ip', data, config),
  getSites: () => api.get('/sites'),
  deleteSite: (id) => api.delete(`/sites/${id}`),
  generateIP: (siteId) => api.post('/sites/generate-ip', { siteId }),
  getAllSites: (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.search) {
      queryParams.append('search', params.search);
    }

    if (params.region_ids?.length) {
      queryParams.append('region_ids', params.region_ids.join(','));
    }

    if (params.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }

    return api.get(`/sites?${queryParams.toString()}`);
  },
};

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear session data
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');

      // Redirect to login
      window.location.href = '/login?session=expired';
    }
    return Promise.reject(error);
  }
);

export default api;
