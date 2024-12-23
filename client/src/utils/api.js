import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:9000/api',
  headers: {
    'Content-Type': 'application/json',
    withCredentials: true
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && error.response?.data?.shouldRefresh && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const ipAPI = {
    getIPBlocks: () => api.get('/ip/blocks'),
    createIPBlock: (data) => api.post('/ip/blocks', data),
    deleteIPBlock: (id) => api.delete(`/ip/blocks/${id}`),
  };

export const regionAPI = {
  getRegions: () => api.get('/regions'),
  createRegion: (name) => api.post('/regions', { name }),
  deleteRegion: (id) => api.delete(`/regions/${id}`),
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  createUser: (user) => api.post('/users', user),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Define the VLAN API functions
export const vlanAPI = {
  getVLANs: () => api.get('/vlans'),
  createVLAN: (data) => api.post('/vlans', data),
  deleteVLAN: (id) => api.delete(`/vlans/${id}`),
};

export const vlanRangeAPI = {
  getVLANRanges: () => api.get('/vlan-ranges'),
  createVLANRange: (data) => api.post('/vlan-ranges', data),
  deleteVLANRange: (id) => api.delete(`/vlan-ranges/${id}`),
};

// Define the Site API functions
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