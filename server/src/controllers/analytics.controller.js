const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const pool = require('../config/db');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Excel files only!');
    }
  }
}).single('file');

const uploadFile = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error uploading file' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Read the Excel file
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      // Begin database transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Insert file record
        const fileResult = await client.query(
          'INSERT INTO analytics_files (filename, original_name, upload_date, uploaded_by) VALUES ($1, $2, NOW(), $3) RETURNING id',
          [req.file.filename, req.file.originalname, req.user.id]
        );
        const fileId = fileResult.rows[0].id;

        // Process and insert data
        for (const row of data) {
          await client.query(
            `INSERT INTO analytics_data (
              file_id, 
              ticket_number,
              region,
              fault_type,
              reported_date,
              cleared_date,
              mttr,
              clients_affected
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              fileId,
              row.ticket_number,
              row.region,
              row.fault_type,
              new Date(row.reported_date),
              new Date(row.cleared_date),
              row.mttr,
              row.clients_affected
            ]
          );
        }

        await client.query('COMMIT');

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          message: 'File uploaded and processed successfully',
          fileId: fileId
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error processing file:', error);
      return res.status(500).json({ error: 'Error processing file' });
    }
  });
};

const getAnalyticsData = async (req, res) => {
  const { fileId } = req.query;
  
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM analytics_data WHERE file_id = $1',
      [fileId]
    );
    
    // Process and format the data for the frontend
    const data = {
      summary: calculateSummaryStats(result.rows),
      trends: calculateTrends(result.rows),
      regional: calculateRegionalStats(result.rows),
      impact: calculateImpactStats(result.rows)
    };
    
    res.json(data);
    client.release();
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Error fetching analytics data' });
  }
};

// Helper functions for data processing
function calculateSummaryStats(data) {
  const totalIncidents = data.length;
  const avgMTTR = data.reduce((acc, curr) => acc + parseFloat(curr.mttr), 0) / totalIncidents;
  const totalClientsAffected = data.reduce((acc, curr) => acc + parseInt(curr.clients_affected), 0);

  const faultTypes = {};
  data.forEach(incident => {
    faultTypes[incident.fault_type] = (faultTypes[incident.fault_type] || 0) + 1;
  });

  return {
    totalIncidents,
    avgMTTR,
    totalClientsAffected,
    faultTypes
  };
}

function calculateTrends(data) {
  const daily = {};
  const weekly = {};
  const monthly = {};

  data.forEach(incident => {
    const date = new Date(incident.reported_date);
    const dayKey = date.toISOString().split('T')[0];
    const weekKey = getWeekNumber(date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Daily trends
    if (!daily[dayKey]) daily[dayKey] = { count: 0, mttr: 0, clients: 0 };
    daily[dayKey].count++;
    daily[dayKey].mttr += parseFloat(incident.mttr);
    daily[dayKey].clients += parseInt(incident.clients_affected);

    // Weekly trends
    if (!weekly[weekKey]) weekly[weekKey] = { count: 0, mttr: 0, clients: 0 };
    weekly[weekKey].count++;
    weekly[weekKey].mttr += parseFloat(incident.mttr);
    weekly[weekKey].clients += parseInt(incident.clients_affected);

    // Monthly trends
    if (!monthly[monthKey]) monthly[monthKey] = { count: 0, mttr: 0, clients: 0 };
    monthly[monthKey].count++;
    monthly[monthKey].mttr += parseFloat(incident.mttr);
    monthly[monthKey].clients += parseInt(incident.clients_affected);
  });

  return {
    daily: Object.entries(daily).map(([date, stats]) => ({
      date,
      incidents: stats.count,
      avgMTTR: stats.mttr / stats.count,
      clientsAffected: stats.clients
    })),
    weekly: Object.entries(weekly).map(([week, stats]) => ({
      week,
      incidents: stats.count,
      avgMTTR: stats.mttr / stats.count,
      clientsAffected: stats.clients
    })),
    monthly: Object.entries(monthly).map(([month, stats]) => ({
      month,
      incidents: stats.count,
      avgMTTR: stats.mttr / stats.count,
      clientsAffected: stats.clients
    }))
  };
}

function calculateRegionalStats(data) {
  const regions = {};
  data.forEach(incident => {
    if (!regions[incident.region]) {
      regions[incident.region] = {
        incidents: 0,
        mttr: 0,
        clients: 0
      };
    }
    regions[incident.region].incidents++;
    regions[incident.region].mttr += parseFloat(incident.mttr);
    regions[incident.region].clients += parseInt(incident.clients_affected);
  });

  return Object.entries(regions).map(([region, stats]) => ({
    region,
    incidents: stats.incidents,
    avgMTTR: stats.mttr / stats.incidents,
    clientsAffected: stats.clients
  }));
}

function calculateImpactStats(data) {
  // Sort incidents by clients affected
  const sortedByImpact = [...data].sort((a, b) => 
    parseInt(b.clients_affected) - parseInt(a.clients_affected)
  );

  // Get top 10 high-impact incidents
  const highImpactIncidents = sortedByImpact.slice(0, 10);

  // Calculate impact distribution
  const impactRanges = {
    '1-10': 0,
    '11-50': 0,
    '51-100': 0,
    '101-500': 0,
    '500+': 0
  };

  data.forEach(incident => {
    const clients = parseInt(incident.clients_affected);
    if (clients <= 10) impactRanges['1-10']++;
    else if (clients <= 50) impactRanges['11-50']++;
    else if (clients <= 100) impactRanges['51-100']++;
    else if (clients <= 500) impactRanges['101-500']++;
    else impactRanges['500+']++;
  });

  return {
    highImpactIncidents,
    impactDistribution: Object.entries(impactRanges).map(([range, count]) => ({
      range,
      count
    }))
  };
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = {
  uploadFile,
  getAnalyticsData
}; 