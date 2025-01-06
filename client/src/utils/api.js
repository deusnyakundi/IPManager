// Frontend (Axios Interceptor)
import axios from 'axios';

// Create an Axios instance with base URL and content type
const api = axios.create({
  baseURL: 'http://localhost:9000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for sending and receiving cookies
});

let isRefreshing = false;
let failedQueue = [];

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

// Request Interceptor: Add Authorization header if needed
api.interceptors.request.use(
  (config) => {
    // Don't retry these endpoints
    const noRetryEndpoints = ['/auth/refresh', '/auth/login', '/auth/logout'];
    if (!noRetryEndpoints.includes(config.url)) {
      config._retry = false; // Reset retry flag for each new request
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry these endpoints
    const noRetryEndpoints = ['/auth/refresh', '/auth/login', '/auth/logout'];
    const noRedirectEndpoints = [...noRetryEndpoints, '/auth/me'];

    // If the error is 401 and it's a refresh token request or login
    if (error.response?.status === 401 && noRetryEndpoints.includes(originalRequest.url)) {
      // Only redirect to login if not already there and not a /me request
      if (!noRedirectEndpoints.includes(originalRequest.url) && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Handle token refresh for other 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          // Wait for the refresh to complete
          await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        await api.post('/auth/refresh');
        
        // Process any queued requests
        processQueue(null);
        
        // Reset the retry flag
        originalRequest._retry = false;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Only redirect to login if not already there and not a /me request
        if (!noRedirectEndpoints.includes(originalRequest.url) && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

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

export default api;
