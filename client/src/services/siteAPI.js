import api from '../utils/api';
import * as XLSX from 'xlsx';

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
        'IP Address': site.ip || '',
        'Region': site.region?.name || '',
        'MSP': site.msp?.name || '',
        'IPRAN Cluster': site.ipranCluster || ''
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

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
      XLSX.utils.book_append_sheet(wb, ws, 'Sites');

      // Generate Excel file
      XLSX.writeFile(wb, 'sites.xlsx');
      
    } catch (error) {
      console.error('Error exporting sites:', error);
      throw error;
    }
  },
  importSites: async (file) => {
    try {
      // First fetch all reference data and existing sites
      const [regionsResponse, mspsResponse, ipranClustersResponse, existingSitesResponse] = await Promise.all([
        api.get('/regions'),
        api.get('/msps'),
        api.get('/ipran-clusters'),
        api.get('/sites')
      ]);

      const regions = regionsResponse.data;
      const msps = mspsResponse.data;
      const ipranClusters = ipranClustersResponse.data;
      const existingSites = existingSitesResponse.data;

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Format data and translate names to IDs
            const formattedData = jsonData.map(row => {
              const region = regions.find(r => r.name.toLowerCase() === row['Region']?.toLowerCase());
              const msp = msps.find(m => m.name.toLowerCase() === row['MSP']?.toLowerCase());
              const ipranCluster = ipranClusters.find(c => c.name.toLowerCase() === row['IPRAN Cluster']?.toLowerCase());

              return {
                name: row['Site Name'],
                ip: row['IP Address'],
                region_id: region?.id,
                msp_id: msp?.id,
                ipran_cluster_id: ipranCluster?.id
              };
            });

            // Filter out entries with missing required IDs
            const validData = formattedData.filter(site => 
              site.name && site.region_id && site.msp_id && site.ipran_cluster_id
            );

            if (validData.length === 0) {
              throw new Error('No valid sites found in the import file. Please check the region, MSP, and IPRAN cluster names match exactly.');
            }

            // Process each site - create new or update existing
            const results = await Promise.all(validData.map(async (site, index) => {
              try {
                // Check if site exists by IP
                const existingSite = existingSites.find(s => s.ip === site.ip);
                
                if (existingSite) {
                  // Update existing site
                  const response = await api.put(`/sites/${existingSite.id}`, site);
                  return { success: true, data: response.data };
                } else {
                  // Create new site
                  const response = await api.post('/sites', site);
                  return { success: true, data: response.data };
                }
              } catch (error) {
                return {
                  success: false,
                  siteName: site.name,
                  rowNumber: index + 1,
                  error: error.response?.data?.error || error.response?.data?.message || 'Failed to import site'
                };
              }
            }));

            const successfulResults = results.filter(r => r.success);
            const failures = results.filter(r => !r.success);

            resolve({
              totalRows: jsonData.length,
              importedRows: successfulResults.length,
              failures: failures,
              data: successfulResults.map(r => r.data)
            });
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