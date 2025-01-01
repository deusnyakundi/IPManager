// Frontend (Axios Interceptor)
import axios from 'axios';

let accessToken = null; // Store access token in memory (not ideal for long-term storage)

// Function to update the access token
export const setAuthToken = (newToken) => {
  accessToken = newToken;
};

// Create an Axios instance with base URL and content type
const api = axios.create({
  baseURL: 'http://localhost:9000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for sending and receiving cookies
});

// Request Interceptor: Add Authorization header dynamically
api.interceptors.request.use(
  (config) => {
    // Only add the Authorization header if it's not a login request AND we have a token
    if (config.url !== '/auth/login' && accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config; // Return the modified config
  },
  (error) => Promise.reject(error) // Reject the promise if there's an error
);

// Response Interceptor: Handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is a 401 Unauthorized and if the request hasn't been retried already
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark the request as retried

      // Implement retry limit to prevent infinite loops
      let retryCount = originalRequest._retryCount || 0;
      if (retryCount >= 3) {
        console.error("Too many retries. Logging out.");
        window.location.href = '/login'; // Redirect to login
        return Promise.reject(error); // Reject the promise
      }
      originalRequest._retryCount = retryCount + 1; // Increment the retry count

      try {
        // Make a request to refresh the token. No need to send the refresh token in the body if using cookies
        const refreshResponse = await axios.post('/auth/refresh');
        const { accessToken: newAccessToken } = refreshResponse.data;

        // Update the access token
        setAuthToken(newAccessToken);

        // Retry the original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest); // Retry the request
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        window.location.href = '/login'; // Redirect to login on refresh failure
        return Promise.reject(refreshError); // Reject the refresh error
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
