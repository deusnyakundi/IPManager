import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import AuthContext to access token and refreshToken logic

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://localhost:9000/api', // Replace with your backend's base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Authorization header if access token exists in memory
api.interceptors.request.use(
  (config) => {
    // Skip adding Authorization header for login requests
    if (config.url === '/auth/login') {
      return config;
    }

    const { token } = useAuth(); // Retrieve token from AuthContext
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token expiration and refresh logic
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 && // Unauthorized error
      error.response?.data?.shouldRefresh && // Backend indicates token should be refreshed
      !originalRequest._retry // Avoid infinite retry loops
    ) {
      originalRequest._retry = true; // Mark request as retried

      try {
        const { refreshToken } = useAuth(); // Access refreshToken logic from AuthContext
        await refreshToken(); // Attempt to refresh token

        const { token } = useAuth(); // Retrieve updated token
        originalRequest.headers.Authorization = `Bearer ${token}`; // Update request with new token

        return api(originalRequest); // Retry the original request
      } catch (refreshError) {
        // If token refresh fails, redirect to login and clear session
        console.error('Token refresh failed:', refreshError);
        const { logout } = useAuth(); // Access logout function from AuthContext
        logout();
        window.location.href = '/login'; // Redirect to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error); // Reject other errors
  }
);

// Exporting API modules for specific backend functionalities
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
