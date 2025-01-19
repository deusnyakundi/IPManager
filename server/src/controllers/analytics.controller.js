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

// Helper function to calculate duration between two dates in hours
function calculateDurationInHours(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMillis = end - start;
  const hours = diffMillis / (1000 * 60 * 60);
  return Number(hours.toFixed(6));
}

// Helper function to parse time duration (HH:MM:SS or decimal hours)
function parseTimeDuration(duration) {
  if (!duration) return 0;

  // If it's already a number, return it with precision
  if (typeof duration === 'number') {
    return Number(duration.toFixed(6));
  }
  
  if (typeof duration === 'string') {
    // Remove whitespace and convert to lowercase
    duration = duration.trim().toLowerCase();

    // Check if it's in HH:MM:SS format
    const timeRegex = /^(\d+):(\d{2}):(\d{2})$/;
    const match = duration.match(timeRegex);
    
    if (match) {
      const [_, hours, minutes, seconds] = match;
      // Convert to total hours with precision
      const totalHours = (
        Number(hours) + 
        Number(minutes) / 60 + 
        Number(seconds) / 3600
      );
      console.log('Parsed HH:MM:SS format:', {
        original: duration,
        hours,
        minutes,
        seconds,
        totalHours: totalHours.toFixed(6)
      });
      return Number(totalHours.toFixed(6));
    }

    // If it's a numeric string, parse it with precision
    const numericValue = parseFloat(duration);
    if (!isNaN(numericValue)) {
      console.log('Parsed numeric string:', {
        original: duration,
        parsed: numericValue.toFixed(6)
      });
      return Number(numericValue.toFixed(6));
    }
  }
  
  console.warn('Could not parse duration:', duration);
  return 0;
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
        [req.file.filename, req.file.originalname, req.user.userId, 'processing']
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

function getWeekNumber(date) {
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0); // Normalize time to midnight
  
  // Get the first day of the year
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);
  
  // Get the first Monday of the year
  const firstMonday = new Date(startOfYear);
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1);
  }
  
  // Get the Monday of the current week
  const currentMonday = new Date(currentDate);
  const day = currentMonday.getDay();
  const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1); // Adjust when it's Sunday
  currentMonday.setDate(diff);
  currentMonday.setHours(0, 0, 0, 0);
  
  // Calculate the difference in weeks
  const weekNumber = Math.floor(
    (currentMonday.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)
  ) + 1;
  
  return weekNumber;
}

function aggregateWeeklyData(incidents) {
  const weeklyData = {};
  
  incidents.forEach(incident => {
    const date = new Date(incident.reported_date);
    const weekNumber = getWeekNumber(date);
    const year = date.getFullYear();
    const weekKey = `${year}-W${weekNumber}`;
    
    // Get the Monday of this week for the period
    const monday = new Date(date);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        week: weekNumber,
        period: monday.toISOString().split('T')[0],
        incidents: 0,
        mttr: 0,
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
        },
        clientsAffectedByType: {
          portFailures: 0,
          degradation: 0,
          multipleLOS: 0,
          oltFailures: 0
        }
      };
    }
    
    const week = weeklyData[weekKey];
    week.incidents++;
    week.mttr += parseTimeDuration(incident.mttr);
    const clientsAffected = extractTotalClients(incident);
    week.clientsAffected += clientsAffected;
    
    // Track by incident type
    const type = incident.fault_type?.toLowerCase();
    if (type?.includes('port')) {
      week.portFailuresCount++;
      week.portFailuresWithinSLA += calculateSLA(incident.total_duration, 4);
      week.byIncidentType.portFailures++;
      week.clientsAffectedByType.portFailures += clientsAffected;
    } else if (type?.includes('degrad')) {
      week.degradationCount++;
      week.degradationWithinSLA += calculateSLA(incident.total_duration, 8);
      week.byIncidentType.degradation++;
      week.clientsAffectedByType.degradation += clientsAffected;
    } else if (type?.includes('los')) {
      week.byIncidentType.multipleLOS++;
      week.clientsAffectedByType.multipleLOS += clientsAffected;
    } else if (type?.includes('olt')) {
      week.byIncidentType.oltFailures++;
      week.clientsAffectedByType.oltFailures += clientsAffected;
    }
    
    // Track by assigned group
    const group = incident.assigned_group || 'Unknown';
    if (!week.byAssignedGroup[group]) {
      week.byAssignedGroup[group] = {
        totalIncidents: 0,
        mttr: 0,
        clientsAffected: 0
      };
    }
    
    const groupStats = week.byAssignedGroup[group];
    groupStats.totalIncidents++;
    groupStats.mttr += parseTimeDuration(incident.mttr);
    groupStats.clientsAffected += clientsAffected;
  });
  
  // Calculate averages and percentages
  Object.values(weeklyData).forEach(week => {
    week.avgMTTR = week.incidents ? week.mttr / week.incidents : 0;
    week.avgMTTRFormatted = formatTimeHHMMSS(week.avgMTTR);
    week.mttrFormatted = formatTimeHHMMSS(week.mttr);
    week.portFailuresSLA = week.portFailuresCount ? 
      (week.portFailuresWithinSLA / week.portFailuresCount) * 100 : 0;
    week.degradationSLA = week.degradationCount ? 
      (week.degradationWithinSLA / week.degradationCount) * 100 : 0;
    
    // Calculate averages and SLAs for assigned groups
    Object.values(week.byAssignedGroup).forEach(group => {
      group.avgMTTR = group.totalIncidents ? group.mttr / group.totalIncidents : 0;
      group.avgMTTRFormatted = formatTimeHHMMSS(group.avgMTTR);
      group.mttrFormatted = formatTimeHHMMSS(group.mttr);
      group.portFailuresSLA = group.portFailuresCount ? 
        (group.portFailuresWithinSLA / group.portFailuresCount) * 100 : 0;
      group.degradationSLA = group.degradationCount ? 
        (group.degradationWithinSLA / group.degradationCount) * 100 : 0;
    });
  });
  
  return Object.values(weeklyData)
    .sort((a, b) => new Date(a.period) - new Date(b.period));
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
    month.avgMTTRFormatted = formatTimeHHMMSS(month.avgMTTR);
    month.mttrFormatted = formatTimeHHMMSS(month.mttr);
    month.portFailuresSLA = month.portFailuresCount ? 
      (month.portFailuresWithinSLA / month.portFailuresCount) * 100 : 0;
    month.degradationSLA = month.degradationCount ? 
      (month.degradationWithinSLA / month.degradationCount) * 100 : 0;
    
    // Calculate averages and SLAs for assigned groups
    Object.values(month.byAssignedGroup).forEach(group => {
      group.avgMTTR = group.totalIncidents ? group.mttr / group.totalIncidents : 0;
      group.avgMTTRFormatted = formatTimeHHMMSS(group.avgMTTR);
      group.mttrFormatted = formatTimeHHMMSS(group.mttr);
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
    let adrianPortFailures = 0; // Debug counter

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      console.log(`Processing sheet: ${sheetName}, Rows: ${data.length}`);

      // Log column headers for the first row
      if (data.length > 0) {
        console.log('Available columns in sheet:', {
          sheetName,
          columns: Object.keys(data[0])
        });
      }

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
            row['Total Duration (hr:min:sec)'] || 
            row['__EMPTY_7']
          );

          console.log('Raw Duration:', {
            rawValue: row['Total Duration (hr:min:sec)'] || row['__EMPTY_7'],
            parsedValue: mttr,
            sheetName: sheetName
          });

          if (!reportedDate || !clearedDate) {
            console.warn('Skipping row due to invalid dates:', row);
            continue;
          }

          // Try different possible column names for other fields
          const ticketNumber = row['Incident ID'] || row['__EMPTY_10'];
          const region = row['Region'] || row['N.East'] || row['N.West'] || row['__EMPTY_11'];
          
          // Log all potential assigned group fields
          console.log('Assigned Group Field Values:', {
            'Assigned Group': row['Assigned Group'],
            'Assigned': row['Assigned'],
            'Team': row['Team'],
            'Assignment Group': row['Assignment Group'],
            'Assigned Team': row['Assigned Team'],
            '__EMPTY_12': row['__EMPTY_12'],
            'All Keys': Object.keys(row)
          });
          
          const assignedGroup = row['Assigned Group'] || row['Assignment Group'] || row['Assigned Team'] || row['Assigned'] || row['Team'] || row['__EMPTY_12'] || 'Unknown';
          const faultCause = row['Causes'] || row['__EMPTY_15'] || 'Unknown';

          // Debug log for Adrian's port failures
          if (assignedGroup.toLowerCase().includes('adrian') && sheetName.toLowerCase().includes('port failure')) {
            adrianPortFailures++;
            console.log('Found Adrian Port Failure:', {
              ticketNumber,
              assignedGroup,
              sheetName,
              faultCause,
              row: JSON.stringify(row)
            });
          }

          const incident = {
            file_id: fileId,
            ticket_number: ticketNumber,
            region: region,
            fault_type: sheetName.trim(), // Use sheet name as fault type
            fault_cause: faultCause,
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
              fault_cause,
              assigned_group,
              reported_date,
              cleared_date,
              mttr,
              clients_affected,
              sheet_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              incident.file_id,
              incident.ticket_number,
              incident.region,
              incident.fault_type,
              incident.fault_cause,
              incident.assigned_group,
              incident.reported_date,
              incident.cleared_date,
              incident.total_duration,
              incident.clients_affected,
              incident.sheet_name
            ]
          );

          allIncidents.push(incident);
          
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

    console.log('Processing summary:', {
      totalRows: totalProcessedRows,
      adrianPortFailures,
      uniqueAssignedGroups: [...new Set(allIncidents.map(i => i.assigned_group))],
      portFailureSheets: workbook.SheetNames.filter(name => name.toLowerCase().includes('port failure'))
    });

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

  // Debug counters
  const debugCounts = {
    totalIncidents: 0,
    byType: {
      portFailures: 0,
      degradation: 0,
      multipleLOS: 0,
      oltFailures: 0
    }
  };

  incidents.forEach(incident => {
    debugCounts.totalIncidents++;
    
    const group = incident.assigned_group?.trim() || 'Unknown';
    const sheetName = incident.sheet_name?.trim().toLowerCase() || '';
    
    // Use the same MTTR calculation logic as summary stats
    let duration;
    const totalDurationStr = incident['Total Duration (hr:min:sec)'] || incident['__EMPTY_7'];
    
    if (totalDurationStr) {
      duration = parseTimeDuration(totalDurationStr);
    } else {
      // If Total Duration is not available, calculate from timestamps
      duration = calculateDurationInHours(incident.reported_date, incident.cleared_date);
    }
    
    const clientsAffected = parseInt(incident.clients_affected) || 0;
    
    // Initialize group if not exists
    if (!assignedGroups[group]) {
      assignedGroups[group] = {
        portFailures: {
          count: 0,
          mttr: 0,
          withinSLA: 0,
          slaPercentage: 0,
          clientsAffected: 0,
          byCategory: {} // Add categories for port failures
        },
        degradation: {
          count: 0,
          mttr: 0,
          withinSLA: 0,
          slaPercentage: 0,
          clientsAffected: 0
        },
        multipleLOS: {
          count: 0,
          mttr: 0,
          clientsAffected: 0
        },
        oltFailures: {
          count: 0,
          mttr: 0,
          clientsAffected: 0
        }
      };
    }

    const stats = assignedGroups[group];

    // Update stats based on sheet name
    if (sheetName.includes('port failure')) {
      stats.portFailures.count++;
      stats.portFailures.mttr += duration;
      stats.portFailures.clientsAffected += clientsAffected;
      
      // Categorize port failures
      const category = categorizeFault(incident);
      if (category) {
        if (!stats.portFailures.byCategory[category]) {
          stats.portFailures.byCategory[category] = {
            count: 0,
            mttr: 0,
            clientsAffected: 0
          };
        }
        stats.portFailures.byCategory[category].count++;
        stats.portFailures.byCategory[category].mttr += duration;
        stats.portFailures.byCategory[category].clientsAffected += clientsAffected;
      }

      if (duration <= 4) { // 4 hours SLA for Port Failures
        stats.portFailures.withinSLA++;
      }
      debugCounts.byType.portFailures++;
      
      console.log(`Updated Port Failures for ${group}:`, {
        count: stats.portFailures.count,
        totalMTTR: stats.portFailures.mttr,
        avgMTTR: Number((stats.portFailures.mttr / stats.portFailures.count).toFixed(4)),
        category
      });
    } else if (sheetName.includes('degradation')) {
      console.log('Processing Degradation MTTR:', {
        rawDuration: incident.mttr,
        parsedDuration: duration,
        currentTotal: stats.degradation.mttr,
        newTotal: stats.degradation.mttr + duration,
        count: stats.degradation.count + 1
      });
      
      stats.degradation.count++;
      stats.degradation.mttr += duration;
      stats.degradation.clientsAffected += clientsAffected;
      if (duration <= 8) { // 8 hours SLA for Degradations
        stats.degradation.withinSLA++;
      }
      debugCounts.byType.degradation++;
      
      console.log(`Updated Degradation for ${group}:`, {
        count: stats.degradation.count,
        totalMTTR: stats.degradation.mttr,
        avgMTTR: Number((stats.degradation.mttr / stats.degradation.count).toFixed(4)),
        duration
      });
    } else if (sheetName.includes('multiple los') || sheetName.includes('los')) {
      stats.multipleLOS.count++;
      stats.multipleLOS.mttr += duration;
      stats.multipleLOS.clientsAffected += clientsAffected;
      debugCounts.byType.multipleLOS++;
      
      console.log(`Updated Multiple LOS for ${group}:`, {
        count: stats.multipleLOS.count,
        totalMTTR: stats.multipleLOS.mttr,
        avgMTTR: Number((stats.multipleLOS.mttr / stats.multipleLOS.count).toFixed(4))
      });
    } else if (sheetName.includes('olt failure')) {
      stats.oltFailures.count++;
      stats.oltFailures.mttr += duration;
      stats.oltFailures.clientsAffected += clientsAffected;
      debugCounts.byType.oltFailures++;
    }
  });

  // Log debug summary
  console.log('Debug Summary:', {
    totalIncidents: debugCounts.totalIncidents,
    byType: debugCounts.byType,
    allGroups: Object.keys(assignedGroups)
  });

  // Calculate final metrics for each group
  Object.entries(assignedGroups).forEach(([group, stats]) => {
    // Calculate Port Failures metrics
    if (stats.portFailures.count > 0) {
      stats.portFailures.avgMTTR = Number((stats.portFailures.mttr / stats.portFailures.count).toFixed(4));
      stats.portFailures.avgMTTRFormatted = formatTimeHHMMSS(stats.portFailures.avgMTTR);
      stats.portFailures.slaPercentage = Number(((stats.portFailures.withinSLA / stats.portFailures.count) * 100).toFixed(2));
    }

    // Calculate Degradation metrics
    if (stats.degradation.count > 0) {
      stats.degradation.avgMTTR = Number((stats.degradation.mttr / stats.degradation.count).toFixed(4));
      stats.degradation.avgMTTRFormatted = formatTimeHHMMSS(stats.degradation.avgMTTR);
      stats.degradation.slaPercentage = Number(((stats.degradation.withinSLA / stats.degradation.count) * 100).toFixed(2));
      
      console.log(`Final Degradation metrics for ${group}:`, {
        count: stats.degradation.count,
        totalMTTR: stats.degradation.mttr,
        avgMTTR: stats.degradation.avgMTTR,
        formatted: stats.degradation.avgMTTRFormatted
      });
    }

    // Calculate Multiple LOS metrics
    if (stats.multipleLOS.count > 0) {
      stats.multipleLOS.avgMTTR = Number((stats.multipleLOS.mttr / stats.multipleLOS.count).toFixed(4));
      stats.multipleLOS.avgMTTRFormatted = formatTimeHHMMSS(stats.multipleLOS.avgMTTR);
    }

    // Calculate OLT Failures metrics
    if (stats.oltFailures.count > 0) {
      stats.oltFailures.avgMTTR = Number((stats.oltFailures.mttr / stats.oltFailures.count).toFixed(4));
      stats.oltFailures.avgMTTRFormatted = formatTimeHHMMSS(stats.oltFailures.avgMTTR);
    }
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
    
    // Calculate summary stats first
    const summaryStats = calculateSummaryStats(allIncidents);
    
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
        summary: summaryStats, // This now includes portFailureCategories and totalPortFailures
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
      const sheetSummary = calculateSummaryStats(sheetIncidents);
      data.sheets[sheet] = {
        summary: sheetSummary, // This includes portFailureCategories for the sheet
        trends: calculateTrends(sheetIncidents),
        regional: calculateRegionalStats(sheetIncidents),
        impact: calculateImpactStats(sheetIncidents),
        assignedGroups: calculateAssignedGroupStats(sheetIncidents)
      };
    });

    // Debug log to verify data structure
    console.log('Processed data structure:', {
      hasOverallAssignedGroups: !!data.overall.assignedGroups,
      overallAssignedGroupsKeys: Object.keys(data.overall.assignedGroups || {}),
      sheetNames: Object.keys(data.sheets),
      sheetsWithAssignedGroups: Object.keys(data.sheets).filter(sheet => !!data.sheets[sheet].assignedGroups),
      sampleAssignedGroup: data.overall.assignedGroups ? Object.values(data.overall.assignedGroups)[0] : null,
      hasPortFailureCategories: !!data.overall.summary.portFailureCategories,
      portFailureCategories: Object.keys(data.overall.summary.portFailureCategories || {}),
      portFailureSample: data.overall.summary.portFailureCategories ? 
        Object.entries(data.overall.summary.portFailureCategories)[0] : null
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

// Helper function to convert decimal hours to HH:MM:SS
function formatTimeHHMMSS(decimalHours) {
  if (!decimalHours && decimalHours !== 0) return 'N/A';
  
  // Convert decimal hours to total seconds
  const totalSeconds = Math.round(decimalHours * 3600);
  
  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format with leading zeros
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Helper functions for data processing
function calculateSummaryStats(data) {
  const totalIncidents = data.length;
  let totalMTTR = 0;
  let totalPortFailures = 0;
  const portFailureCategories = {};
  const portFailureCauses = {}; // Track causes for port failures
  const faultCauses = {}; // Track all fault causes
  const faultTypes = {};
  const faultTypesByCause = {};

  // Debug counters
  const debugStats = {
    totalRows: data.length,
    causesFound: 0,
    clientsTracked: 0
  };

  data.forEach(incident => {
    // Get duration
    let duration;
    const totalDurationStr = incident['Total Duration (hr:min:sec)'] || incident['__EMPTY_7'];
    
    if (totalDurationStr) {
      duration = parseTimeDuration(totalDurationStr);
    } else {
      duration = calculateDurationInHours(incident.reported_date, incident.cleared_date);
    }

    // Track all fault causes regardless of type
    const cause = incident.fault_cause || 'Unknown';
    if (!faultCauses[cause]) {
      faultCauses[cause] = {
          count: 0,
          clientsAffected: 0,
          mttr: 0
        };
      }
    faultCauses[cause].count++;
    faultCauses[cause].clientsAffected += parseInt(incident.clients_affected) || 0;
    faultCauses[cause].mttr += duration;
    debugStats.causesFound++;
    debugStats.clientsTracked += parseInt(incident.clients_affected) || 0;

    // Track fault types
    const type = incident.fault_type || 'Unknown';
    faultTypes[type] = (faultTypes[type] || 0) + 1;
    
    if (!faultTypesByCause[type]) {
      faultTypesByCause[type] = {};
    }
    faultTypesByCause[type][cause] = (faultTypesByCause[type][cause] || 0) + 1;

    totalMTTR += duration;
  });

  // Calculate averages for all fault causes
  Object.values(faultCauses).forEach(cause => {
    cause.avgMTTR = cause.count ? Number((cause.mttr / cause.count).toFixed(4)) : 0;
    cause.avgMTTRFormatted = formatTimeHHMMSS(cause.avgMTTR);
  });

  console.log('Summary Stats Processing:', {
    debugStats,
    totalFaultCauses: Object.keys(faultCauses).length,
    sampleCause: Object.entries(faultCauses)[0],
    totalClientsTracked: Object.values(faultCauses).reduce((sum, cause) => sum + cause.clientsAffected, 0)
  });

  return {
    totalIncidents,
    avgMTTR: totalIncidents ? Number((totalMTTR / totalIncidents).toFixed(4)) : 0,
    avgMTTRFormatted: formatTimeHHMMSS(totalIncidents ? totalMTTR / totalIncidents : 0),
    totalClientsAffected: debugStats.clientsTracked,
    faultTypes,
    faultCauses,
    faultTypesByCause,
    totalPortFailures
  };
}

function calculateTrends(data) {
  const weekly = {};
  const monthly = {};

  // First pass: Calculate total MTTR and incidents
  data.forEach(incident => {
    const date = new Date(incident.reported_date);
    
    // Get week number and year for the key
    const weekNumber = getWeekNumber(date);
    const year = date.getFullYear();
    const weekKey = `${year}-W${weekNumber}`;
    
    // Get month
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Initialize week data
    if (!weekly[weekKey]) {
      // Get the Monday of this week for the period
      const monday = new Date(date);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      
      weekly[weekKey] = {
        week: weekNumber,
        period: monday.toISOString().split('T')[0],
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
    
    // Get duration using same logic as summary stats
    let duration;
    const totalDurationStr = incident['Total Duration (hr:min:sec)'] || incident['__EMPTY_7'];
    
    if (totalDurationStr) {
      duration = parseTimeDuration(totalDurationStr);
    } else {
      duration = calculateDurationInHours(incident.reported_date, incident.cleared_date);
    }

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
        clientsAffected: 0,
        portFailuresCount: 0,
        portFailuresWithinSLA: 0,
        degradationCount: 0,
        degradationWithinSLA: 0
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
        clientsAffected: 0,
        portFailuresCount: 0,
        portFailuresWithinSLA: 0,
        degradationCount: 0,
        degradationWithinSLA: 0
      };
    }
    monthData.byAssignedGroup[group].totalIncidents++;
    monthData.byAssignedGroup[group].mttr += duration;
    monthData.byAssignedGroup[group].clientsAffected += clientsAffected;

    // Update fault type specific stats
    if (type?.includes('port')) {
      weekData.portFailuresCount++;
      weekData.portFailuresWithinSLA += calculateSLA(incident.total_duration, 4);
      weekData.clientsAffectedByType.portFailures += clientsAffected;
      weekData.byAssignedGroup[group].portFailuresCount++;
      weekData.byAssignedGroup[group].portFailuresWithinSLA += calculateSLA(incident.total_duration, 4);
      
      monthData.portFailuresCount++;
      monthData.portFailuresWithinSLA += calculateSLA(incident.total_duration, 4);
      monthData.clientsAffectedByType.portFailures += clientsAffected;
      monthData.byAssignedGroup[group].portFailuresCount++;
      monthData.byAssignedGroup[group].portFailuresWithinSLA += calculateSLA(incident.total_duration, 4);
    } else if (type?.includes('degrad')) {
      weekData.degradationCount++;
      weekData.degradationWithinSLA += calculateSLA(incident.total_duration, 8);
      weekData.clientsAffectedByType.degradation += clientsAffected;
      weekData.byAssignedGroup[group].degradationCount++;
      weekData.byAssignedGroup[group].degradationWithinSLA += calculateSLA(incident.total_duration, 8);
      
      monthData.degradationCount++;
      monthData.degradationWithinSLA += calculateSLA(incident.total_duration, 8);
      monthData.clientsAffectedByType.degradation += clientsAffected;
      monthData.byAssignedGroup[group].degradationCount++;
      monthData.byAssignedGroup[group].degradationWithinSLA += calculateSLA(incident.total_duration, 8);
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
    week.avgMTTRFormatted = formatTimeHHMMSS(week.avgMTTR);
    week.mttrFormatted = formatTimeHHMMSS(week.mttr);
    week.portFailuresSLA = week.portFailuresCount ? 
      (week.portFailuresWithinSLA / week.portFailuresCount) * 100 : 0;
    week.degradationSLA = week.degradationCount ? 
      (week.degradationWithinSLA / week.degradationCount) * 100 : 0;
    
    // Calculate averages and SLAs for assigned groups
    Object.values(week.byAssignedGroup).forEach(group => {
      group.avgMTTR = group.totalIncidents ? group.mttr / group.totalIncidents : 0;
      group.avgMTTRFormatted = formatTimeHHMMSS(group.avgMTTR);
      group.mttrFormatted = formatTimeHHMMSS(group.mttr);
      group.portFailuresSLA = group.portFailuresCount ? 
        (group.portFailuresWithinSLA / group.portFailuresCount) * 100 : 0;
      group.degradationSLA = group.degradationCount ? 
        (group.degradationWithinSLA / group.degradationCount) * 100 : 0;
    });
  });

  Object.values(monthly).forEach(month => {
    month.avgMTTR = month.incidents ? month.mttr / month.incidents : 0;
    month.avgMTTRFormatted = formatTimeHHMMSS(month.avgMTTR);
    month.mttrFormatted = formatTimeHHMMSS(month.mttr);
    month.portFailuresSLA = month.portFailuresCount ? 
      (month.portFailuresWithinSLA / month.portFailuresCount) * 100 : 0;
    month.degradationSLA = month.degradationCount ? 
      (month.degradationWithinSLA / month.degradationCount) * 100 : 0;
    
    // Calculate averages and SLAs for assigned groups
    Object.values(month.byAssignedGroup).forEach(group => {
      group.avgMTTR = group.totalIncidents ? group.mttr / group.totalIncidents : 0;
      group.avgMTTRFormatted = formatTimeHHMMSS(group.avgMTTR);
      group.mttrFormatted = formatTimeHHMMSS(group.mttr);
      group.portFailuresSLA = group.portFailuresCount ? 
        (group.portFailuresWithinSLA / group.portFailuresCount) * 100 : 0;
      group.degradationSLA = group.degradationCount ? 
        (group.degradationWithinSLA / group.degradationCount) * 100 : 0;
    });
  });

  return {
    weekly: Object.values(weekly).sort((a, b) => new Date(a.period) - new Date(b.period)),
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
    regions[incident.region].mttr += parseTimeDuration(incident.mttr);
    regions[incident.region].clients += parseInt(incident.clients_affected);
  });

  return Object.entries(regions).map(([region, stats]) => ({
    region,
    incidents: stats.incidents,
    avgMTTR: Number((stats.mttr / stats.incidents).toFixed(4)),
    avgMTTRFormatted: formatTimeHHMMSS(stats.mttr / stats.incidents),
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

  // Calculate fault cause distribution
  const faultCauseDistribution = {
    port_failures: [],
    degradations: [],
    multiple_los: [],
    olt_failures: []
  };

  // Group incidents by type and cause
  const causesByType = {
    port_failures: {},
    degradations: {},
    multiple_los: {},
    olt_failures: {}
  };

  data.forEach(incident => {
    const clients = parseInt(incident.clients_affected);
    if (clients <= 10) impactRanges['1-10']++;
    else if (clients <= 50) impactRanges['11-50']++;
    else if (clients <= 100) impactRanges['51-100']++;
    else if (clients <= 500) impactRanges['101-500']++;
    else impactRanges['500+']++;

    // Track causes by incident type
    const type = incident.fault_type?.toLowerCase() || '';
    const cause = incident.fault_cause || 'Unknown';
    let category;

    if (type.includes('port')) {
      category = 'port_failures';
    } else if (type.includes('degrad')) {
      category = 'degradations';
    } else if (type.includes('los')) {
      category = 'multiple_los';
    } else if (type.includes('olt')) {
      category = 'olt_failures';
    } else {
      return; // Skip if no matching category
    }

    if (!causesByType[category][cause]) {
      causesByType[category][cause] = {
        cause,
        count: 0,
        clients: 0
      };
    }
    causesByType[category][cause].count++;
    causesByType[category][cause].clients += clients;
  });

  // Convert causes by type to arrays for the frontend
  Object.keys(causesByType).forEach(type => {
    faultCauseDistribution[type] = Object.values(causesByType[type]);
  });

  console.log('Impact Stats - Fault Cause Distribution:', {
    types: Object.keys(faultCauseDistribution),
    sampleCounts: Object.fromEntries(
      Object.entries(faultCauseDistribution).map(([type, causes]) => 
        [type, causes.length]
      )
    ),
    portFailuresSample: faultCauseDistribution.port_failures.slice(0, 2)
  });

  return {
    highImpactIncidents,
    impactDistribution: Object.entries(impactRanges).map(([range, count]) => ({
      range,
      count
    })),
    faultCauseDistribution
  };
}

function getWeekNumber(date) {
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0); // Normalize time to midnight
  
  // Get the first day of the year
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);
  
  // Get the first Monday of the year
  const firstMonday = new Date(startOfYear);
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1);
  }
  
  // Get the Monday of the current week
  const currentMonday = new Date(currentDate);
  const day = currentMonday.getDay();
  const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1); // Adjust when it's Sunday
  currentMonday.setDate(diff);
  currentMonday.setHours(0, 0, 0, 0);
  
  // Calculate the difference in weeks
  const weekNumber = Math.floor(
    (currentMonday.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)
  ) + 1;
  
  return weekNumber;
}

const getFileStatus = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT status, error_message FROM analytics_files WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting file status:', error);
    res.status(500).json({ error: 'Error getting file status' });
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
    console.log('Starting PowerPoint generation for fileId:', fileId);
    client = await pool.connect();
    
    // Get all the analytics data
    console.log('Fetching analytics data...');
    const result = await client.query(
      'SELECT * FROM analytics_data WHERE file_id = $1',
      [fileId]
    );
    console.log(`Found ${result.rows.length} rows of data`);

    // Get file info
    console.log('Fetching file info...');
    const fileInfo = await client.query(
      'SELECT original_name FROM analytics_files WHERE id = $1',
      [fileId]
    );
    console.log('File info:', fileInfo.rows[0]);

    if (fileInfo.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Calculate all analytics
    console.log('Calculating analytics...');
    const data = {
      summary: calculateSummaryStats(result.rows),
      trends: calculateTrends(result.rows),
      regional: calculateRegionalStats(result.rows),
      impact: calculateImpactStats(result.rows)
    };
    console.log('Analytics calculated successfully');

    // Get the week number from the data
    const dates = result.rows.map(row => new Date(row.reported_date));
    const minDate = new Date(Math.min(...dates));
    const weekNumber = getWeekNumber(minDate); // Now returns just the number
    const year = minDate.getFullYear();

    // Create PowerPoint presentation with theme colors
    console.log('Creating PowerPoint presentation...');
    const pptx = new PptxGenJS();
    const theme = {
      primary: '2196F3',   // Blue
      secondary: '4CAF50', // Green
      accent1: 'FFC107',   // Amber
      accent2: 'FF5722',   // Deep Orange
      accent3: '9C27B0',   // Purple
      accent4: '00BCD4'    // Cyan
    };

    // Add title slide
    console.log('Adding title slide...');
    const titleSlide = pptx.addSlide();
    titleSlide.addText("Network Analysis Report", {
      x: 1,
      y: 2,
      w: 8,
      h: 1,
      fontSize: 36,
      bold: true,
      color: theme.primary,
      align: "center"
    });
    titleSlide.addText(`Week ${weekNumber}, ${year}`, {
      x: 1,
      y: 3.5,
      w: 8,
      h: 0.5,
      fontSize: 18,
      color: theme.secondary,
      align: "center"
    });
    titleSlide.addText(new Date().toLocaleDateString(), {
      x: 1,
      y: 4.5,
      w: 8,
      h: 0.5,
      fontSize: 14,
      color: '666666',
      align: "center"
    });

    // Add summary slide with cards and charts
    console.log('Adding summary slide...');
    const summarySlide = pptx.addSlide();
    summarySlide.addText("Summary Statistics", {
      x: 0,
      y: 0.2,
      w: 10,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: theme.primary
    });

    // Add summary stats cards
    const summaryData = [
      ["Metric", "Value"],
      ["Total Incidents", data.summary.totalIncidents],
      ["Average MTTR", data.summary.avgMTTRFormatted],
      ["Total Clients Affected", data.summary.totalClientsAffected.toLocaleString()]
    ];

    summarySlide.addTable(summaryData, {
      x: 0.5,
      y: 1,
      w: 4,
      h: 2,
      fontSize: 14,
      border: { type: 'solid', pt: 1, color: theme.primary },
      colW: [2, 2],
      rowH: 0.5,
      fill: { color: 'F5F5F5' }
    });

    // Add fault types distribution
    const faultTypeData = [{
      name: 'Fault Types',
      labels: Object.keys(data.summary.faultTypes || {}),
      values: Object.values(data.summary.faultTypes || {})
    }];

    summarySlide.addChart(pptx.ChartType.pie, faultTypeData, {
      title: "Fault Type Distribution",
      showValue: true,
      showPercent: true,
      chartColors: Object.values(theme),
      x: 5,
      y: 1,
      w: 4.5,
      h: 3
    });

    // Add fault causes slide
    console.log('Adding fault causes slide...');
    const causesSlide = pptx.addSlide();
    causesSlide.addText("Fault Cause Analysis", {
      x: 0,
      y: 0.2,
      w: 10,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: theme.primary
    });

    // Add fault causes table
    const causesTableData = [
      ["Cause", "Count", "Clients Affected", "Avg MTTR"],
      ...Object.entries(data.summary.faultCauses).map(([cause, stats]) => [
        cause,
        stats.count,
        stats.clientsAffected.toLocaleString(),
        stats.avgMTTRFormatted
      ])
    ];

    causesSlide.addTable(causesTableData, {
      x: 0.5,
      y: 1,
      w: 9,
      h: 4,
      fontSize: 12,
      border: { type: 'solid', pt: 1, color: theme.primary },
      colW: [3, 2, 2, 2],
      rowH: 0.3,
      fill: { color: 'F5F5F5' }
    });

    // Add trends slide
    console.log('Adding trends slide...');
    const trendsSlide = pptx.addSlide();
    trendsSlide.addText("Incident Trends", {
      x: 0,
      y: 0.2,
      w: 10,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: theme.primary
    });

    // Monthly incidents trend
    const monthlyIncidents = [{
      name: 'Incidents',
      labels: data.trends.monthly.map(m => m.month),
      values: data.trends.monthly.map(m => m.incidents)
    }];

    trendsSlide.addChart(pptx.ChartType.line, monthlyIncidents, {
      title: "Monthly Incidents",
      showValue: false,
      lineSize: 2,
      chartColors: [theme.primary],
      valAxisTitle: "Count",
      catAxisTitle: "Month",
      x: 0.5,
      y: 1,
      w: 9,
      h: 2
    });

    // Monthly MTTR trend
    const monthlyMTTR = [{
      name: 'Average MTTR',
      labels: data.trends.monthly.map(m => m.month),
      values: data.trends.monthly.map(m => m.avgMTTR)
    }];

    trendsSlide.addChart(pptx.ChartType.line, monthlyMTTR, {
      title: "Monthly Average MTTR",
      showValue: false,
      lineSize: 2,
      chartColors: [theme.secondary],
      valAxisTitle: "Hours",
      catAxisTitle: "Month",
      x: 0.5,
      y: 3.5,
      w: 9,
      h: 2
    });

    // Add assigned groups slide
    console.log('Adding assigned groups slide...');
    const groupsSlide = pptx.addSlide();
    groupsSlide.addText("Assigned Groups Analysis", {
      x: 0,
      y: 0.2,
      w: 10,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: theme.primary
    });

    // Create assigned groups table data
    const assignedGroups = calculateAssignedGroupStats(result.rows);
    const groupsTableData = [
      ["Group", "Port Failures", "Degradations", "Multiple LOS", "OLT Failures", "Avg MTTR"],
      ...Object.entries(assignedGroups).map(([group, stats]) => [
        group,
        stats.portFailures.count || 0,
        stats.degradation.count || 0,
        stats.multipleLOS.count || 0,
        stats.oltFailures.count || 0,
        stats.portFailures.avgMTTRFormatted || 
        stats.degradation.avgMTTRFormatted || 
        stats.multipleLOS.avgMTTRFormatted || 
        stats.oltFailures.avgMTTRFormatted || 
        '00:00:00'
      ])
    ];

    if (groupsTableData.length > 1) { // If we have data beyond the header
      groupsSlide.addTable(groupsTableData, {
      x: 0.5,
      y: 1,
      w: 9,
      h: 4,
        fontSize: 12,
        border: { type: 'solid', pt: 1, color: theme.primary },
        colW: [2, 1.4, 1.4, 1.4, 1.4, 1.4],
        rowH: 0.3,
        fill: { color: 'F5F5F5' }
      });
    } else {
      groupsSlide.addText("No assigned groups data available", {
        x: 0.5,
        y: 1,
        w: 9,
        h: 1,
        fontSize: 14,
        color: "666666",
        align: "center"
      });
    }

    // Add regional analysis slide
    console.log('Adding regional analysis slide...');
    const regionalSlide = pptx.addSlide();
    regionalSlide.addText("Regional Analysis", {
      x: 0,
      y: 0.2,
      w: 10,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: theme.primary
    });

    // Regional incidents chart
    const regionalIncidents = [{
      name: 'Incidents',
      labels: data.regional.map(r => r.region),
      values: data.regional.map(r => r.incidents)
    }];

    regionalSlide.addChart(pptx.ChartType.bar, regionalIncidents, {
      title: "Incidents by Region",
      showValue: true,
      chartColors: [theme.primary],
      valAxisTitle: "Number of Incidents",
      catAxisTitle: "Region",
      x: 0.5,
      y: 1,
      w: 4.5,
      h: 3
    });

    // Regional MTTR chart
    const regionalMTTR = [{
      name: 'MTTR',
      labels: data.regional.map(r => r.region),
      values: data.regional.map(r => r.avgMTTR)
    }];

    regionalSlide.addChart(pptx.ChartType.bar, regionalMTTR, {
      title: "Average MTTR by Region",
      showValue: true,
      chartColors: [theme.secondary],
      valAxisTitle: "Hours",
      catAxisTitle: "Region",
      x: 5.5,
      y: 1,
      w: 4.5,
      h: 3
    });

    // Add impact analysis slide
    console.log('Adding impact analysis slide...');
    const impactSlide = pptx.addSlide();
    impactSlide.addText("Impact Analysis", {
      x: 0,
      y: 0.2,
      w: 10,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: theme.primary
    });

    // Impact distribution chart
    const impactData = [{
      name: 'Impact',
      labels: data.impact.impactDistribution.map(d => d.range),
      values: data.impact.impactDistribution.map(d => d.count)
    }];

    impactSlide.addChart(pptx.ChartType.doughnut, impactData, {
      title: "Impact Distribution",
      showValue: true,
      showPercent: true,
      chartColors: Object.values(theme),
      dataLabelColor: "FFFFFF",
      x: 0.5,
      y: 1,
      w: 4.5,
      h: 3
    });

    // Add high impact incidents table
    const highImpactData = [
      ["Ticket", "Clients", "Region"],
      ...data.impact.highImpactIncidents
        .filter(incident => incident && incident.ticket_number)
        .map(incident => [
          incident.ticket_number || 'N/A',
          (incident.clients_affected || 0).toLocaleString(),
          incident.region || 'N/A'
        ])
    ];

    // Only add the table if we have data
    if (highImpactData.length > 1) { // More than just the header row
      impactSlide.addText("Top High Impact Incidents", {
        x: 5.5,
        y: 1,
        w: 4.5,
        h: 0.3,
        fontSize: 14,
        bold: true,
        color: theme.primary
      });

      impactSlide.addTable(highImpactData, {
        x: 5.5,
        y: 1.5,
        w: 4.5,
        h: 2.5,
        fontSize: 12,
        border: { type: 'solid', pt: 1, color: theme.primary },
        colW: [1.5, 1.5, 1.5],
        rowH: 0.3,
        fill: { color: 'F5F5F5' }
      });
    } else {
      // Add a message if no high impact incidents
      impactSlide.addText("No high impact incidents to display", {
        x: 5.5,
        y: 1,
        w: 4.5,
        h: 1,
        fontSize: 14,
        color: "666666",
        align: "center"
      });
    }

    // Save the presentation
    console.log('Generating PowerPoint buffer...');
    const buffer = await pptx.write('nodebuffer');
    console.log('PowerPoint buffer generated successfully');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', 'attachment; filename=network_analysis.pptx');
    
    // Send the file
    console.log('Sending PowerPoint file...');
    res.send(buffer);
    console.log('PowerPoint file sent successfully');

  } catch (error) {
    console.error('Error generating PowerPoint:', error);
    res.status(500).json({ error: 'Error generating PowerPoint presentation: ' + error.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Add function to categorize port failures
function categorizeFault(incident) {
  const type = incident.fault_type?.toLowerCase() || '';
  const cause = incident.fault_cause?.toLowerCase() || '';
  
  if (type.includes('port failure') || type.includes('port')) {
    // Categorize port failures
    if (cause.includes('power')) return 'Power Related';
    if (cause.includes('config')) return 'Configuration';
    if (cause.includes('fiber')) return 'Fiber Issue';
    if (cause.includes('hardware')) return 'Hardware Failure';
    if (cause.includes('cable')) return 'Cable Issue';
    if (cause.includes('disconnect')) return 'Disconnection';
    if (cause.includes('unknown')) return 'Unknown';
    // Add more categories as needed
    return 'Other';
  }
  return null;
}

const deleteUpload = async (req, res) => {
  const { id } = req.params;
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // First delete associated analytics data
    await client.query('DELETE FROM analytics_data WHERE file_id = $1', [id]);

    // Then delete the file record
    const result = await client.query(
      'DELETE FROM analytics_files WHERE id = $1 RETURNING filename',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the physical file if it exists
    const filePath = path.join(__dirname, '../../uploads', result.rows[0].filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await client.query('COMMIT');
    res.status(204).send();
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error deleting upload:', error);
    res.status(500).json({ error: 'Error deleting upload' });
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
  generatePowerPoint,
  deleteUpload
}; 