import axios from 'axios';

// Token helper function
let token = null; // Store the token globally in this module

export const setAuthToken = (newToken) => {
  token = newToken;
};

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://localhost:9000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Authorization header dynamically
api.interceptors.request.use(
  (config) => {
    // Skip adding Authorization header for login requests
    if (config.url !== '/auth/login' && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 and token refresh
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const originalRequest = error.config;
   // Check if the response status is 401 and the server indicates the token should be refreshed
    if (
      error.response?.status === 401 &&
      error.response?.data?.shouldRefresh &&
      !originalRequest._retry // Avoid infinite retry loops
    ) {
      originalRequest._retry = true; // Mark request as retried

      try {
        // Make a request to refresh the token
        const refreshResponse = await api.post('/auth/refresh', { refreshToken: token });
        const { accessToken } = refreshResponse.data;

        // Update token globally
        setAuthToken(accessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);

        // Logout or redirect to login on failure
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
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
