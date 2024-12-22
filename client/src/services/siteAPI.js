import api from '../utils/api';

export const siteAPI = {
  getAllSites: (params) => api.get('/sites', { params }),
  getSiteById: (id) => api.get(`/sites/${id}`),
  createSite: (data) => {
    console.log('Creating site with data:', data);
    return api.post('/sites', data);
  },
  updateSite: (id, data) => api.put(`/sites/${id}`, data),
  deleteSite: (id) => api.delete(`/sites/${id}`),
  exportSites: () => api.get('/sites/export', { responseType: 'blob' }),
  importSites: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/sites/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}; 