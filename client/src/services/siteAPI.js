import api from '../utils/api';
import { utils as XLSXUtils, write as XLSXWrite } from 'xlsx';

export const siteAPI = {
  getAllSites: (params) => api.get('/sites', { params }),
  getSiteById: (id) => api.get(`/sites/${id}`),
  createSite: (data) => {
    console.log('Creating site with data:', data);
    return api.post('/sites', data);
  },
  updateSite: (id, data) => api.put(`/sites/${id}`, data),
  deleteSite: (id) => api.delete(`/sites/${id}`),
  exportSites: async () => {
    try {
      const response = await api.get('/sites');
      
      // Format data for Excel
      const excelData = response.data.map(site => ({
        'Site Name': site.name,
        'IP Address': site.ipAddress || '',
        'Region': site.region?.name || '',
        'MSP': site.msp?.name || '',
        'IPRAN Cluster': site.ipranCluster || ''
      }));

      // Create workbook and worksheet
      const wb = XLSXUtils.book_new();
      const ws = XLSXUtils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 40 }, // Site Name
        { wch: 15 }, // IP Address
        { wch: 20 }, // Region
        { wch: 20 }, // MSP
        { wch: 20 }  // IPRAN Cluster
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSXUtils.book_append_sheet(wb, ws, 'Sites');

      // Generate Excel file
      XLSXWrite(wb, 'sites.xlsx');
      
    } catch (error) {
      console.error('Error exporting sites:', error);
      throw error;
    }
  },
  importSites: async (file) => {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSXUtils.read(data, { type: 'array' });
            
            // Get first worksheet
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Convert to JSON
            const jsonData = XLSXUtils.sheet_to_json(worksheet);

            // Format data for API - send the text values
            const formattedData = jsonData.map(row => ({
              name: row['Site Name'],
              ip: row['IP Address'],
              region: row['Region'],        // Send region name
              msp: row['MSP'],             // Send MSP name
              ipranCluster: row['IPRAN Cluster']  // Send cluster name
            }));

            // Send to backend
            const response = await api.post('/sites/import', { sites: formattedData });
            resolve(response);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('Error importing sites:', error);
      throw error;
    }
  }
}; 