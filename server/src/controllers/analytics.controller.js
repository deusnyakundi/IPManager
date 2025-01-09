const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const pool = require('../config/db');
const PptxGenJS = require('pptxgenjs');

// Helper function to extract total clients from mixed format strings
function extractTotalClients(row) {
  // Check various possible column names for client count
  const clientColumns = [
    'Clients Affected',
    'Affected Clients',
    '__EMPTY_2',  // For sheets with empty column headers
    'Clients'
  ];
  
  let clientCount;
  for (const col of clientColumns) {
    if (row[col] !== undefined) {
      clientCount = row[col];
      break;
    }
  }
  
  if (typeof clientCount === 'number') return clientCount;
  if (!clientCount) return 0;
  
  // Extract all numbers from the string
  const numbers = clientCount.toString().match(/\d+/g);
  if (!numbers) return 0;
  
  // Sum all numbers found
  return numbers.reduce((sum, num) => sum + parseInt(num), 0);
}

// Helper function to parse DD/MM/YYYY or MM/DD/YYYY HH:MM format
function parseDateString(dateStr) {
  if (!dateStr) return null;
  
  // Handle both DD/MM/YYYY and MM/DD/YYYY formats with optional time
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(?:AM|PM)?)?$/i;
  const match = dateStr.match(dateRegex);
  
  if (match) {
    let [_, part1, part2, year, hours = '00', minutes = '00', seconds = '00'] = match;
    
    // Try to determine if it's MM/DD or DD/MM based on values
    const isMMDD = parseInt(part1) <= 12;
    const month = isMMDD ? parseInt(part1) - 1 : parseInt(part2) - 1;
    const day = isMMDD ? parseInt(part2) : parseInt(part1);
    
    // Handle 12-hour format if PM is in the string
    if (dateStr.toLowerCase().includes('pm') && hours !== '12') {
      hours = (parseInt(hours) + 12).toString();
    }
    
    return new Date(year, month, day, parseInt(hours), parseInt(minutes), parseInt(seconds));
  }
  
  return null;
}

// Helper function to convert Excel serial number to JavaScript Date
function excelDateToJSDate(excelDate) {
  if (!excelDate) return null;
  if (typeof excelDate !== 'number') return null;
  
  // Excel dates are number of days since 1900-01-01
  // But Excel incorrectly assumes 1900 was a leap year
  const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30));
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  
  // Convert Excel date serial number to milliseconds
  const timeMillis = Math.round((excelDate * MS_PER_DAY));
  return new Date(EXCEL_EPOCH.getTime() + timeMillis);
}

// Helper function to parse time duration (HH:MM:SS or decimal hours)
function parseTimeDuration(duration) {
  if (typeof duration === 'number') {
    // If it's already a decimal number (hours), return as is
    return duration;
  }
  
  if (typeof duration === 'string') {
    // Check if it's in HH:MM:SS format
    const timeRegex = /^(\d+):(\d{2}):(\d{2})$/;
    const match = duration.match(timeRegex);
    
    if (match) {
      const [_, hours, minutes, seconds] = match;
      return Number(hours) + Number(minutes)/60 + Number(seconds)/3600;
    }
  }
  
  return null;
}

// Helper function to safely convert a value to a date
function safeParseDate(value) {
  if (!value) return null;
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    return excelDateToJSDate(value);
  }
  
  // If it's a string in DD/MM/YYYY format
  if (typeof value === 'string') {
    return parseDateString(value);
  }
  
  // If it's already a Date object
  if (value instanceof Date) {
    return value;
  }
  
  return null;
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  console.log('File upload attempt:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });

  const filetypes = /xlsx|xls/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  // Updated MIME type check to handle various Excel MIME types
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/excel',
    'application/x-excel',
    'application/x-msexcel'
  ];
  
  const mimetype = validMimeTypes.includes(file.mimetype);

  console.log('Validation results:', {
    extname,
    mimetype,
    extension: path.extname(file.originalname).toLowerCase()
  });

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error(`Invalid file type. Received mimetype: ${file.mimetype}. Please upload only Excel files (.xlsx, .xls)`));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('file');

const uploadFile = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let client;
    try {
      // Begin database transaction
      client = await pool.connect();
      await client.query('BEGIN');
      
      // Insert file record with initial status
      const fileResult = await client.query(
        'INSERT INTO analytics_files (filename, original_name, upload_date, uploaded_by, status) VALUES ($1, $2, NOW(), $3, $4) RETURNING id',
        [req.file.filename, req.file.originalname, req.user.id, 'processing']
      );
      const fileId = fileResult.rows[0].id;
      
      // Send initial response
      res.json({
        message: 'File upload started',
        fileId: fileId
      });

      // Process the file asynchronously
      processExcelFile(req.file.path, fileId, client).catch(async (error) => {
        console.error('Error processing file:', error);
        try {
          await client.query(
            'UPDATE analytics_files SET status = $1, error_message = $2 WHERE id = $3',
            ['error', error.message, fileId]
          );
          await client.query('COMMIT');
        } catch (updateError) {
          console.error('Error updating file status:', updateError);
          await client.query('ROLLBACK');
        } finally {
          client.release();
        }
      });
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
        client.release();
      }
      console.error('Error initiating file upload:', error);
      return res.status(500).json({ 
        error: 'Error initiating file upload',
        details: error.message 
      });
    }
  });
};

// Add new helper functions for SLA calculations
function calculateSLA(duration, target) {
  return duration <= target ? 1 : 0;
}

function aggregateWeeklyData(incidents) {
  const weeklyData = {};
  
  incidents.forEach(incident => {
    const date = new Date(incident.reported_date);
    // Get the Monday of the week
    const monday = new Date(date);
    monday.setDate(date.getDate() - date.getDay() + 1);
    const weekKey = monday.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        period: weekKey,
        totalIncidents: 0,
        totalMTTR: 0,
        clientsAffected: 0,
        portFailuresCount: 0,
        portFailuresWithinSLA: 0,
        degradationCount: 0,
        degradationWithinSLA: 0,
        byAssignedGroup: {},
        byIncidentType: {
          portFailures: 0,
          degradation: 0,
          multipleLOS: 0,
          oltFailures: 0
        }
      };
    }
    
    const week = weeklyData[weekKey];
    week.totalIncidents++;
    week.totalMTTR += parseFloat(incident.total_duration) || 0;
    week.clientsAffected += extractTotalClients(incident);
    
    // Track by incident type
    const type = incident.fault_type?.toLowerCase();
    if (type?.includes('port')) {
      week.portFailuresCount++;
      week.portFailuresWithinSLA += calculateSLA(incident.total_duration, 4);
      week.byIncidentType.portFailures++;
    } else if (type?.includes('degrad')) {
      week.degradationCount++;
      week.degradationWithinSLA += calculateSLA(incident.total_duration, 8);
      week.byIncidentType.degradation++;
    } else if (type?.includes('los')) {
      week.byIncidentType.multipleLOS++;
    } else if (type?.includes('olt')) {
      week.byIncidentType.oltFailures++;
    }
    
    // Track by assigned group
    const group = incident.assigned_group || 'Unknown';
    if (!week.byAssignedGroup[group]) {
      week.byAssignedGroup[group] = {
        totalIncidents: 0,
        totalMTTR: 0,
        clientsAffected: 0,
        portFailuresCount: 0,
        portFailuresWithinSLA: 0,
        degradationCount: 0,
        degradationWithinSLA: 0
      };
    }
    
    const groupStats = week.byAssignedGroup[group];
    groupStats.totalIncidents++;
    groupStats.totalMTTR += parseFloat(incident.total_duration) || 0;
    groupStats.clientsAffected += extractTotalClients(incident);
    
    if (type?.includes('port')) {
      groupStats.portFailuresCount++;
      groupStats.portFailuresWithinSLA += calculateSLA(incident.total_duration, 4);
    } else if (type?.includes('degrad')) {
      groupStats.degradationCount++;
      groupStats.degradationWithinSLA += calculateSLA(incident.total_duration, 8);
    }
  });
  
  // Calculate averages and percentages
  Object.values(weeklyData).forEach(week => {
    week.avgMTTR = week.totalIncidents ? week.totalMTTR / week.totalIncidents : 0;
    week.portFailuresSLA = week.portFailuresCount ? 
      (week.portFailuresWithinSLA / week.portFailuresCount) * 100 : 0;
    week.degradationSLA = week.degradationCount ? 
      (week.degradationWithinSLA / week.degradationCount) * 100 : 0;
    
    Object.values(week.byAssignedGroup).forEach(group => {
      group.avgMTTR = group.totalIncidents ? group.totalMTTR / group.totalIncidents : 0;
      group.portFailuresSLA = group.portFailuresCount ? 
        (group.portFailuresWithinSLA / group.portFailuresCount) * 100 : 0;
      group.degradationSLA = group.degradationCount ? 
        (group.degradationWithinSLA / group.degradationCount) * 100 : 0;
    });
  });
  
  return Object.values(weeklyData).sort((a, b) => a.period.localeCompare(b.period));
}

function aggregateMonthlyData(weeklyData) {
  const monthlyData = {};
  
  weeklyData.forEach(week => {
    const monthKey = week.period.substring(0, 7); // YYYY-MM
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        period: monthKey,
        totalIncidents: 0,
        totalMTTR: 0,
        clientsAffected: 0,
        portFailuresCount: 0,
        portFailuresWithinSLA: 0,
        degradationCount: 0,
        degradationWithinSLA: 0,
        byAssignedGroup: {},
        byIncidentType: {
          portFailures: 0,
          degradation: 0,
          multipleLOS: 0,
          oltFailures: 0
        }
      };
    }
    
    const month = monthlyData[monthKey];
    month.totalIncidents += week.totalIncidents;
    month.totalMTTR += week.totalMTTR;
    month.clientsAffected += week.clientsAffected;
    month.portFailuresCount += week.portFailuresCount;
    month.portFailuresWithinSLA += week.portFailuresWithinSLA;
    month.degradationCount += week.degradationCount;
    month.degradationWithinSLA += week.degradationWithinSLA;
    
    // Aggregate incident types
    Object.entries(week.byIncidentType).forEach(([type, count]) => {
      month.byIncidentType[type] += count;
    });
    
    // Aggregate assigned group data
    Object.entries(week.byAssignedGroup).forEach(([group, stats]) => {
      if (!month.byAssignedGroup[group]) {
        month.byAssignedGroup[group] = {
          totalIncidents: 0,
          totalMTTR: 0,
          clientsAffected: 0,
          portFailuresCount: 0,
          portFailuresWithinSLA: 0,
          degradationCount: 0,
          degradationWithinSLA: 0
        };
      }
      
      const monthGroup = month.byAssignedGroup[group];
      monthGroup.totalIncidents += stats.totalIncidents;
      monthGroup.totalMTTR += stats.totalMTTR;
      monthGroup.clientsAffected += stats.clientsAffected;
      monthGroup.portFailuresCount += stats.portFailuresCount;
      monthGroup.portFailuresWithinSLA += stats.portFailuresWithinSLA;
      monthGroup.degradationCount += stats.degradationCount;
      monthGroup.degradationWithinSLA += stats.degradationWithinSLA;
    });
  });
  
  // Calculate averages and percentages
  Object.values(monthlyData).forEach(month => {
    month.avgMTTR = month.totalIncidents ? month.totalMTTR / month.totalIncidents : 0;
    month.portFailuresSLA = month.portFailuresCount ? 
      (month.portFailuresWithinSLA / month.portFailuresCount) * 100 : 0;
    month.degradationSLA = month.degradationCount ? 
      (month.degradationWithinSLA / month.degradationCount) * 100 : 0;
    
    Object.values(month.byAssignedGroup).forEach(group => {
      group.avgMTTR = group.totalIncidents ? group.totalMTTR / group.totalIncidents : 0;
      group.portFailuresSLA = group.portFailuresCount ? 
        (group.portFailuresWithinSLA / group.portFailuresCount) * 100 : 0;
      group.degradationSLA = group.degradationCount ? 
        (group.degradationWithinSLA / group.degradationCount) * 100 : 0;
    });
  });
  
  return Object.values(monthlyData).sort((a, b) => a.period.localeCompare(b.period));
}

// Update the processExcelFile function to handle assigned groups
async function processExcelFile(filePath, fileId, client) {
  try {
    console.log('Starting file processing:', { filePath, fileId });

    const workbook = xlsx.readFile(filePath, { cellDates: false, raw: true });
    console.log('Excel file read successfully. Sheets:', workbook.SheetNames);

    let totalProcessedRows = 0;
    let allIncidents = [];

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      console.log(`Processing sheet: ${sheetName}, Rows: ${data.length}`);

      // Process rows for this sheet
      for (const row of data) {
        try {
          // Try different possible column names for dates
          const reportedDate = safeParseDate(
            row['Reported Date'] || 
            row['__EMPTY_5'] || 
            row['Fault Date']
          );
          
          const clearedDate = safeParseDate(
            row['Required Resolution DateTime'] || 
            row['__EMPTY_6'] || 
            row['Resolution Date']
          );

          const mttr = parseTimeDuration(
            row['New MTTR'] || 
            row['Total Duration (hr:min:sec)'] || 
            row['__EMPTY_7']
          );

          if (!reportedDate || !clearedDate) {
            console.warn('Skipping row due to invalid dates:', row);
            continue;
          }

          // Try different possible column names for other fields
          const ticketNumber = row['Incident ID'] || row['__EMPTY_10'];
          const region = row['Region'] || row['N.East'] || row['N.West'] || row['__EMPTY_11'];
          const faultType = row['Causes'] || row['Fault Type'] || 'Unknown';
          const assignedGroup = row['Assigned Group'] || row['Assigned'] || row['Team'] || 'Unknown';

          const incident = {
            file_id: fileId,
            ticket_number: ticketNumber,
            region: region,
            fault_type: faultType,
            assigned_group: assignedGroup,
            reported_date: reportedDate,
            cleared_date: clearedDate,
            total_duration: mttr,
            clients_affected: extractTotalClients(row),
            sheet_name: sheetName.trim()
          };

          // Store in database
          await client.query(
            `INSERT INTO analytics_data (
              file_id, 
              ticket_number,
              region,
              fault_type,
              assigned_group,
              reported_date,
              cleared_date,
              mttr,
              clients_affected,
              sheet_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              incident.file_id,
              incident.ticket_number,
              incident.region,
              incident.fault_type,
              incident.assigned_group,
              incident.reported_date,
              incident.cleared_date,
              incident.total_duration,
              incident.clients_affected,
              incident.sheet_name
            ]
          );

          allIncidents.push(incident);
          
          // Update processed rows count in real-time
          await client.query(
            'UPDATE analytics_files SET processed_rows = $1 WHERE id = $2',
            [totalProcessedRows + 1, fileId]
          );
          
          totalProcessedRows++;
        } catch (rowError) {
          console.error('Error processing row:', {
            rowData: row,
            error: rowError.message
          });
          throw rowError;
        }
      }
    }

    // Process analytics data
    const processedData = {
      summary: calculateSummaryStats(allIncidents),
      trends: calculateTrends(allIncidents),
      assignedGroups: calculateAssignedGroupStats(allIncidents),
      regional: calculateRegionalStats(allIncidents),
      impact: calculateImpactStats(allIncidents)
    };

    // Save processed data to database
    await client.query(
      'UPDATE analytics_files SET processed_data = $1, status = $2 WHERE id = $3',
      [JSON.stringify(processedData), 'completed', fileId]
    );
    
    await client.query('COMMIT');
    console.log(`Successfully processed ${totalProcessedRows} rows total`);

    // Clean up uploaded file
    fs.unlinkSync(filePath);
    console.log('Temporary file cleaned up');

    return processedData;
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
}

// Add new function to calculate assigned group statistics
function calculateAssignedGroupStats(incidents) {
  const assignedGroups = {};

  incidents.forEach(incident => {
    const group = incident.assigned_group || 'Unknown';
    if (!assignedGroups[group]) {
      assignedGroups[group] = {
        totalIncidents: 0,
        totalMTTR: 0,
        clientsAffected: 0,
        portFailuresCount: 0,
        portFailuresWithinSLA: 0,
        degradationCount: 0,
        degradationWithinSLA: 0,
        incidentTypes: {
          portFailures: 0,
          degradation: 0,
          multipleLOS: 0,
          oltFailures: 0
        },
        slaBreakdown: {
          withinSLA: 0,
          outsideSLA: 0
        },
        clientsAffectedByType: {
          portFailures: 0,
          degradation: 0,
          multipleLOS: 0,
          oltFailures: 0
        }
      };
    }

    const stats = assignedGroups[group];
    const type = incident.fault_type?.toLowerCase();
    const duration = parseFloat(incident.mttr) || 0;
    const clientsAffected = parseInt(incident.clients_affected) || 0;

    // Update basic stats
    stats.totalIncidents++;
    stats.totalMTTR += duration;
    stats.clientsAffected += clientsAffected;

    // Update incident type stats and clients affected by type
    if (type?.includes('port')) {
      stats.portFailuresCount++;
      stats.portFailuresWithinSLA += calculateSLA(duration, 4);
      stats.incidentTypes.portFailures++;
      stats.clientsAffectedByType.portFailures += clientsAffected;
      stats.slaBreakdown[duration <= 4 ? 'withinSLA' : 'outsideSLA']++;
    } else if (type?.includes('degrad')) {
      stats.degradationCount++;
      stats.degradationWithinSLA += calculateSLA(duration, 8);
      stats.incidentTypes.degradation++;
      stats.clientsAffectedByType.degradation += clientsAffected;
      stats.slaBreakdown[duration <= 8 ? 'withinSLA' : 'outsideSLA']++;
    } else if (type?.includes('los')) {
      stats.incidentTypes.multipleLOS++;
      stats.clientsAffectedByType.multipleLOS += clientsAffected;
    } else if (type?.includes('olt')) {
      stats.incidentTypes.oltFailures++;
      stats.clientsAffectedByType.oltFailures += clientsAffected;
    }
  });

  // Calculate final metrics for each group
  Object.values(assignedGroups).forEach(stats => {
    // Calculate average MTTR
    stats.avgMTTR = stats.totalIncidents ? stats.totalMTTR / stats.totalIncidents : 0;

    // Calculate SLA percentages
    stats.portFailuresSLA = stats.portFailuresCount ? 
      (stats.portFailuresWithinSLA / stats.portFailuresCount) * 100 : 0;
    stats.degradationSLA = stats.degradationCount ? 
      (stats.degradationWithinSLA / stats.degradationCount) * 100 : 0;

    // Calculate overall SLA performance
    const totalSLAIncidents = stats.slaBreakdown.withinSLA + stats.slaBreakdown.outsideSLA;
    stats.overallSLAPerformance = totalSLAIncidents > 0 ? 
      (stats.slaBreakdown.withinSLA / totalSLAIncidents) * 100 : 0;

    // Calculate percentages for incident types
    const totalIncidentsByType = Object.values(stats.incidentTypes).reduce((sum, count) => sum + count, 0);
    if (totalIncidentsByType > 0) {
      Object.keys(stats.incidentTypes).forEach(type => {
        stats.incidentTypes[`${type}Percentage`] = 
          (stats.incidentTypes[type] / totalIncidentsByType) * 100;
      });
    }
  });

  console.log('Calculated assigned groups stats:', {
    groups: Object.keys(assignedGroups),
    sampleGroup: Object.values(assignedGroups)[0]
  });

  return assignedGroups;
}

const getAnalyticsData = async (req, res) => {
  const { fileId } = req.query;
  
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM analytics_data WHERE file_id = $1',
      [fileId]
    );
    
    // Get file info to check if it's a partial month
    const fileInfo = await client.query(
      'SELECT upload_date FROM analytics_files WHERE id = $1',
      [fileId]
    );

    const uploadDate = new Date(fileInfo.rows[0].upload_date);
    const currentMonth = uploadDate.getMonth();
    const currentYear = uploadDate.getFullYear();

    // Process the data
    const allIncidents = result.rows;
    
    // Calculate trends with partial month indication
    const trends = calculateTrends(allIncidents);
    
    // Mark current month as partial if we're still in it
    const today = new Date();
    if (trends.monthly.length > 0) {
      const lastMonth = trends.monthly[trends.monthly.length - 1];
      if (lastMonth.month === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}` &&
          currentMonth === today.getMonth() && 
          currentYear === today.getFullYear()) {
        lastMonth.isPartialData = true;
      }
    }

    // Calculate assigned groups stats
    const assignedGroups = calculateAssignedGroupStats(allIncidents);
    
    // Process and format the data for the frontend
    const data = {
      overall: {
        summary: calculateSummaryStats(allIncidents),
        trends: trends,
        regional: calculateRegionalStats(allIncidents),
        impact: calculateImpactStats(allIncidents),
        assignedGroups: assignedGroups
      },
      sheets: {}
    };

    // Process per-sheet data
    const sheets = [...new Set(allIncidents.map(incident => incident.sheet_name))];
    sheets.forEach(sheet => {
      const sheetIncidents = allIncidents.filter(incident => incident.sheet_name === sheet);
      data.sheets[sheet] = {
        summary: calculateSummaryStats(sheetIncidents),
        trends: calculateTrends(sheetIncidents),
        regional: calculateRegionalStats(sheetIncidents),
        impact: calculateImpactStats(sheetIncidents),
        assignedGroups: calculateAssignedGroupStats(sheetIncidents)
      };
    });

    console.log('Processed data structure:', {
      hasOverallAssignedGroups: !!data.overall.assignedGroups,
      overallAssignedGroupsKeys: Object.keys(data.overall.assignedGroups || {}),
      sheetNames: Object.keys(data.sheets),
      sheetsWithAssignedGroups: Object.keys(data.sheets).filter(sheet => !!data.sheets[sheet].assignedGroups),
      sampleAssignedGroup: data.overall.assignedGroups ? Object.values(data.overall.assignedGroups)[0] : null
    });
    
    res.json(data);
    client.release();
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Error fetching analytics data' });
  }
};

const getUploadHistory = async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT af.*, u.username as uploaded_by_username
       FROM analytics_files af
       LEFT JOIN users u ON af.uploaded_by = u.id
       ORDER BY af.upload_date DESC`
    );
    
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error('Error fetching upload history:', error);
    res.status(500).json({ error: 'Error fetching upload history' });
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
  const weekly = {};
  const monthly = {};

  data.forEach(incident => {
    const date = new Date(incident.reported_date);
    
    // Get week number
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1); // Start of week (Monday)
    const weekKey = weekStart.toISOString().split('T')[0];
    const weekNumber = getWeekNumber(date);
    
    // Get month
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Initialize week data
    if (!weekly[weekKey]) {
      weekly[weekKey] = {
        week: weekNumber,
        period: weekKey,
        incidents: 0,
        mttr: 0,
        clientsAffected: 0,
        portFailuresCount: 0,
        portFailuresWithinSLA: 0,
        degradationCount: 0,
        degradationWithinSLA: 0,
        clientsAffectedByType: {
          portFailures: 0,
          degradation: 0,
          multipleLOS: 0,
          oltFailures: 0
        },
        byAssignedGroup: {}
      };
    }
    
    // Initialize month data
    if (!monthly[monthKey]) {
      monthly[monthKey] = {
        month: monthKey,
        incidents: 0,
        mttr: 0,
        clientsAffected: 0,
        portFailuresCount: 0,
        portFailuresWithinSLA: 0,
        degradationCount: 0,
        degradationWithinSLA: 0,
        clientsAffectedByType: {
          portFailures: 0,
          degradation: 0,
          multipleLOS: 0,
          oltFailures: 0
        },
        byAssignedGroup: {}
      };
    }

    const weekData = weekly[weekKey];
    const monthData = monthly[monthKey];
    const duration = parseFloat(incident.mttr) || 0;
    const clientsAffected = parseInt(incident.clients_affected) || 0;
    const type = incident.fault_type?.toLowerCase();
    const group = incident.assigned_group || 'Unknown';

    // Update weekly stats
    weekData.incidents++;
    weekData.mttr += duration;
    weekData.clientsAffected += clientsAffected;

    // Initialize assigned group for week if not exists
    if (!weekData.byAssignedGroup[group]) {
      weekData.byAssignedGroup[group] = {
        totalIncidents: 0,
        mttr: 0,
        clientsAffected: 0
      };
    }
    weekData.byAssignedGroup[group].totalIncidents++;
    weekData.byAssignedGroup[group].mttr += duration;
    weekData.byAssignedGroup[group].clientsAffected += clientsAffected;

    // Update monthly stats
    monthData.incidents++;
    monthData.mttr += duration;
    monthData.clientsAffected += clientsAffected;

    // Initialize assigned group for month if not exists
    if (!monthData.byAssignedGroup[group]) {
      monthData.byAssignedGroup[group] = {
        totalIncidents: 0,
        mttr: 0,
        clientsAffected: 0
      };
    }
    monthData.byAssignedGroup[group].totalIncidents++;
    monthData.byAssignedGroup[group].mttr += duration;
    monthData.byAssignedGroup[group].clientsAffected += clientsAffected;

    // Update fault type specific stats
    if (type?.includes('port')) {
      weekData.portFailuresCount++;
      weekData.portFailuresWithinSLA += calculateSLA(duration, 4);
      weekData.clientsAffectedByType.portFailures += clientsAffected;
      
      monthData.portFailuresCount++;
      monthData.portFailuresWithinSLA += calculateSLA(duration, 4);
      monthData.clientsAffectedByType.portFailures += clientsAffected;
    } else if (type?.includes('degrad')) {
      weekData.degradationCount++;
      weekData.degradationWithinSLA += calculateSLA(duration, 8);
      weekData.clientsAffectedByType.degradation += clientsAffected;
      
      monthData.degradationCount++;
      monthData.degradationWithinSLA += calculateSLA(duration, 8);
      monthData.clientsAffectedByType.degradation += clientsAffected;
    } else if (type?.includes('los')) {
      weekData.clientsAffectedByType.multipleLOS += clientsAffected;
      monthData.clientsAffectedByType.multipleLOS += clientsAffected;
    } else if (type?.includes('olt')) {
      weekData.clientsAffectedByType.oltFailures += clientsAffected;
      monthData.clientsAffectedByType.oltFailures += clientsAffected;
    }
  });

  // Calculate averages and SLA percentages
  Object.values(weekly).forEach(week => {
    week.avgMTTR = week.incidents ? week.mttr / week.incidents : 0;
    week.portFailuresSLA = week.portFailuresCount ? 
      (week.portFailuresWithinSLA / week.portFailuresCount) * 100 : 0;
    week.degradationSLA = week.degradationCount ? 
      (week.degradationWithinSLA / week.degradationCount) * 100 : 0;
    
    Object.values(week.byAssignedGroup).forEach(group => {
      group.avgMTTR = group.totalIncidents ? group.mttr / group.totalIncidents : 0;
    });
  });

  Object.values(monthly).forEach(month => {
    month.avgMTTR = month.incidents ? month.mttr / month.incidents : 0;
    month.portFailuresSLA = month.portFailuresCount ? 
      (month.portFailuresWithinSLA / month.portFailuresCount) * 100 : 0;
    month.degradationSLA = month.degradationCount ? 
      (month.degradationWithinSLA / month.degradationCount) * 100 : 0;
    
    Object.values(month.byAssignedGroup).forEach(group => {
      group.avgMTTR = group.totalIncidents ? group.mttr / group.totalIncidents : 0;
    });
  });

  return {
    weekly: Object.values(weekly).sort((a, b) => a.period.localeCompare(b.period)),
    monthly: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month))
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

const getFileStatus = async (req, res) => {
  const { id } = req.params;
  let client;
  
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT id, status, processed_rows, error_message FROM analytics_files WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching file status:', error);
    res.status(500).json({ error: 'Error fetching file status' });
  } finally {
    if (client) {
      client.release();
    }
  }
};

function calculateSheetStats(data, sheetName) {
  const sheetData = data.filter(row => row.sheet_name.trim().toLowerCase() === sheetName.toLowerCase());
  
  if (sheetData.length === 0) return null;

  const totalIncidents = sheetData.length;
  const avgMTTR = sheetData.reduce((acc, curr) => acc + (parseFloat(curr.mttr) || 0), 0) / totalIncidents;
  const totalClientsAffected = sheetData.reduce((acc, curr) => acc + parseInt(curr.clients_affected), 0);

  // Calculate fault types
  const faultTypes = {};
  sheetData.forEach(incident => {
    faultTypes[incident.fault_type] = (faultTypes[incident.fault_type] || 0) + 1;
  });

  // Calculate trends for this sheet
  const daily = {};
  const weekly = {};
  const monthly = {};

  sheetData.forEach(incident => {
    const date = new Date(incident.reported_date);
    const dayKey = date.toISOString().split('T')[0];
    const weekKey = getWeekNumber(date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Daily trends
    if (!daily[dayKey]) daily[dayKey] = { count: 0, mttr: 0, clients: 0 };
    daily[dayKey].count++;
    daily[dayKey].mttr += parseFloat(incident.mttr) || 0;
    daily[dayKey].clients += parseInt(incident.clients_affected);

    // Weekly trends
    if (!weekly[weekKey]) weekly[weekKey] = { count: 0, mttr: 0, clients: 0 };
    weekly[weekKey].count++;
    weekly[weekKey].mttr += parseFloat(incident.mttr) || 0;
    weekly[weekKey].clients += parseInt(incident.clients_affected);

    // Monthly trends
    if (!monthly[monthKey]) monthly[monthKey] = { count: 0, mttr: 0, clients: 0 };
    monthly[monthKey].count++;
    monthly[monthKey].mttr += parseFloat(incident.mttr) || 0;
    monthly[monthKey].clients += parseInt(incident.clients_affected);
  });

  // Calculate regional distribution for this sheet
  const regions = {};
  sheetData.forEach(incident => {
    if (!regions[incident.region]) {
      regions[incident.region] = {
        incidents: 0,
        mttr: 0,
        clients: 0
      };
    }
    regions[incident.region].incidents++;
    regions[incident.region].mttr += parseFloat(incident.mttr) || 0;
    regions[incident.region].clients += parseInt(incident.clients_affected);
  });

  const regionalStats = Object.entries(regions).map(([region, stats]) => ({
    region,
    incidents: stats.incidents,
    avgMTTR: stats.mttr / stats.incidents,
    clientsAffected: stats.clients
  }));

  // Calculate impact distribution for this sheet
  const impactRanges = {
    '1-10': 0,
    '11-50': 0,
    '51-100': 0,
    '101-500': 0,
    '500+': 0
  };

  sheetData.forEach(incident => {
    const clients = parseInt(incident.clients_affected);
    if (clients <= 10) impactRanges['1-10']++;
    else if (clients <= 50) impactRanges['11-50']++;
    else if (clients <= 100) impactRanges['51-100']++;
    else if (clients <= 500) impactRanges['101-500']++;
    else impactRanges['500+']++;
  });

  // Get top 10 high-impact incidents for this sheet
  const highImpactIncidents = [...sheetData]
    .sort((a, b) => parseInt(b.clients_affected) - parseInt(a.clients_affected))
    .slice(0, 10);

  return {
    summary: {
      totalIncidents,
      avgMTTR,
      totalClientsAffected,
      faultTypes
    },
    trends: {
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
    },
    regional: regionalStats,
    impact: {
      highImpactIncidents,
      impactDistribution: Object.entries(impactRanges).map(([range, count]) => ({
        range,
        count
      }))
    }
  };
}

const analyzeData = async (req, res) => {
  const { fileId, type } = req.query;
  
  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  let client;
  try {
    client = await pool.connect();
    console.log('Analyzing data for fileId:', fileId);
    
    // First check if the file exists and is processed
    const fileStatus = await client.query(
      'SELECT status FROM analytics_files WHERE id = $1',
      [fileId]
    );

    if (fileStatus.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (fileStatus.rows[0].status !== 'completed') {
      return res.status(400).json({ error: 'File processing not completed' });
    }

    // Get the data for analysis
    const result = await client.query(
      'SELECT * FROM analytics_data WHERE file_id = $1',
      [fileId]
    );

    console.log(`Found ${result.rows.length} rows of data to analyze`);

    // Get unique sheet names
    const sheets = [...new Set(result.rows.map(row => row.sheet_name.trim()))];
    console.log('Found sheets:', sheets);

    // Calculate overall stats
    const overallStats = {
      summary: calculateSummaryStats(result.rows),
      trends: calculateTrends(result.rows),
      regional: calculateRegionalStats(result.rows),
      impact: calculateImpactStats(result.rows)
    };

    console.log('Calculated overall stats:', {
      hasSummary: !!overallStats.summary,
      hasTrends: !!overallStats.trends,
      hasRegional: !!overallStats.regional,
      hasImpact: !!overallStats.impact
    });

    // Calculate per-sheet stats
    const sheetStats = {};
    sheets.forEach(sheet => {
      const sheetData = calculateSheetStats(result.rows, sheet);
      if (sheetData) {
        sheetStats[sheet] = sheetData;
        console.log(`Calculated stats for sheet ${sheet}:`, {
          hasSummary: !!sheetData.summary,
          hasRegional: !!sheetData.regional,
          hasImpact: !!sheetData.impact
        });
      }
    });

    // Combine overall and sheet-specific stats
    const response = {
      overall: overallStats,
      sheets: sheetStats
    };

    console.log('Sending response with sheets:', Object.keys(sheetStats));
    res.json(response);
  } catch (error) {
    console.error('Error analyzing data:', error);
    res.status(500).json({ error: 'Error analyzing data: ' + error.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const generatePowerPoint = async (req, res) => {
  const { fileId } = req.query;
  
  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  let client;
  try {
    client = await pool.connect();
    
    // Get all the analytics data
    const result = await client.query(
      'SELECT * FROM analytics_data WHERE file_id = $1',
      [fileId]
    );

    // Get file info
    const fileInfo = await client.query(
      'SELECT original_name FROM analytics_files WHERE id = $1',
      [fileId]
    );

    if (fileInfo.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Calculate all analytics
    const data = {
      summary: calculateSummaryStats(result.rows),
      trends: calculateTrends(result.rows),
      regional: calculateRegionalStats(result.rows),
      impact: calculateImpactStats(result.rows)
    };

    // Create PowerPoint presentation
    const pptx = new PptxGenJS();

    // Add title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText("Network Analysis Report", {
      x: 1,
      y: 1,
      w: 8,
      h: 1,
      fontSize: 24,
      bold: true,
      align: "center"
    });
    titleSlide.addText(`Based on: ${fileInfo.rows[0].original_name}`, {
      x: 1,
      y: 2,
      w: 8,
      h: 0.5,
      fontSize: 14,
      align: "center"
    });

    // Add summary slide
    const summarySlide = pptx.addSlide();
    summarySlide.addText("Summary Statistics", {
      x: 0,
      y: 0,
      w: 10,
      h: 0.5,
      fontSize: 18,
      bold: true
    });

    // Add summary stats
    const summaryData = [
      ["Total Incidents", data.summary.totalIncidents],
      ["Average MTTR (Hours)", data.summary.avgMTTR.toFixed(2)],
      ["Total Clients Affected", data.summary.totalClientsAffected]
    ];

    summarySlide.addTable(summaryData, {
      x: 0.5,
      y: 1,
      w: 9,
      h: 2,
      fontSize: 14
    });

    // Add fault types chart
    const faultTypeData = Object.entries(data.summary.faultTypes).map(([type, count]) => ({
      name: type,
      value: count
    }));

    summarySlide.addChart(pptx.ChartType.pie, faultTypeData, {
      x: 1,
      y: 3.5,
      w: 8,
      h: 3,
      title: "Fault Type Distribution"
    });

    // Add regional analysis slide
    const regionalSlide = pptx.addSlide();
    regionalSlide.addText("Regional Analysis", {
      x: 0,
      y: 0,
      w: 10,
      h: 0.5,
      fontSize: 18,
      bold: true
    });

    // Add regional chart
    regionalSlide.addChart(pptx.ChartType.bar, data.regional, {
      x: 0.5,
      y: 1,
      w: 9,
      h: 4,
      title: "Incidents by Region",
      showValue: true,
      dataLabelPosition: "outEnd"
    });

    // Save the presentation
    const buffer = await pptx.write('nodebuffer');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', 'attachment; filename=network_analysis.pptx');
    
    // Send the file
    res.send(buffer);

  } catch (error) {
    console.error('Error generating PowerPoint:', error);
    res.status(500).json({ error: 'Error generating PowerPoint presentation' });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  uploadFile,
  getAnalyticsData,
  getUploadHistory,
  getFileStatus,
  analyzeData,
  generatePowerPoint
}; 