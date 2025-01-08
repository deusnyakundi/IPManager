const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

// Format data for Excel export
async function formatExcelExport(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IP Manager';
  workbook.created = new Date();

  // Summary sheet
  if (data.summary) {
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Total Incidents
    summarySheet.addRow(['Total Incidents by Type']);
    summarySheet.addRow(['Type', 'Count']);
    Object.entries(data.summary.totalIncidents).forEach(([type, count]) => {
      summarySheet.addRow([type, count]);
    });
    summarySheet.addRow([]);

    // Average MTTR
    summarySheet.addRow(['Average MTTR by Type']);
    summarySheet.addRow(['Type', 'Hours']);
    Object.entries(data.summary.avgMTTR).forEach(([type, hours]) => {
      summarySheet.addRow([type, hours]);
    });
    summarySheet.addRow([]);

    // Clients Affected
    summarySheet.addRow(['Total Clients Affected by Type']);
    summarySheet.addRow(['Type', 'Clients']);
    Object.entries(data.summary.totalClientsAffected).forEach(([type, clients]) => {
      summarySheet.addRow([type, clients]);
    });
  }

  // Trends sheet
  if (data.trends) {
    const trendsSheet = workbook.addWorksheet('Trends');
    
    Object.entries(data.trends.monthly).forEach(([category, trends]) => {
      trendsSheet.addRow([`${category} Monthly Trends`]);
      trendsSheet.addRow(['Period', 'Incidents', 'MTTR', 'Clients Affected']);
      trends.forEach(trend => {
        trendsSheet.addRow([
          new Date(trend.period).toLocaleDateString(),
          trend.incident_count,
          trend.avg_mttr,
          trend.clients_affected,
        ]);
      });
      trendsSheet.addRow([]);
    });
  }

  // Regional sheet
  if (data.regional) {
    const regionalSheet = workbook.addWorksheet('Regional');
    
    Object.entries(data.regional.incidentsByRegion).forEach(([category, regions]) => {
      regionalSheet.addRow([`${category} by Region`]);
      regionalSheet.addRow(['Region', 'Incidents', 'MTTR', 'Clients Affected']);
      regions.forEach(region => {
        regionalSheet.addRow([
          region.region,
          region.incident_count,
          region.avg_mttr,
          region.total_clients,
        ]);
      });
      regionalSheet.addRow([]);
    });
  }

  // Impact sheet
  if (data.impact) {
    const impactSheet = workbook.addWorksheet('Impact');
    
    Object.entries(data.impact.clientImpactDistribution).forEach(([category, distribution]) => {
      impactSheet.addRow([`${category} Client Impact Distribution`]);
      impactSheet.addRow(['Range', 'Count']);
      distribution.forEach(item => {
        impactSheet.addRow([item.range, item.count]);
      });
      impactSheet.addRow([]);
    });

    Object.entries(data.impact.mttrDistribution).forEach(([category, distribution]) => {
      impactSheet.addRow([`${category} MTTR Distribution`]);
      impactSheet.addRow(['Range', 'Count']);
      distribution.forEach(item => {
        impactSheet.addRow([item.range, item.count]);
      });
      impactSheet.addRow([]);
    });
  }

  // Raw data sheet
  if (data.rawData) {
    const rawDataSheet = workbook.addWorksheet('Raw Data');
    
    if (data.rawData.length > 0) {
      // Add headers
      const headers = Object.keys(data.rawData[0]);
      rawDataSheet.addRow(headers);

      // Add data rows
      data.rawData.forEach(row => {
        rawDataSheet.addRow(headers.map(header => row[header]));
      });
    }
  }

  return workbook.xlsx.writeBuffer();
}

// Format data for CSV export
async function formatCsvExport(data) {
  const parser = new Parser();
  let csvData = '';

  // Summary data
  if (data.summary) {
    csvData += 'Summary Analysis\n\n';
    
    csvData += 'Total Incidents by Type\n';
    csvData += parser.parse(Object.entries(data.summary.totalIncidents)
      .map(([type, count]) => ({ Type: type, Count: count })));
    csvData += '\n';

    csvData += 'Average MTTR by Type\n';
    csvData += parser.parse(Object.entries(data.summary.avgMTTR)
      .map(([type, hours]) => ({ Type: type, Hours: hours })));
    csvData += '\n';
  }

  // Trends data
  if (data.trends) {
    csvData += 'Trends Analysis\n\n';
    Object.entries(data.trends.monthly).forEach(([category, trends]) => {
      csvData += `${category} Monthly Trends\n`;
      csvData += parser.parse(trends.map(trend => ({
        Period: new Date(trend.period).toLocaleDateString(),
        Incidents: trend.incident_count,
        MTTR: trend.avg_mttr,
        'Clients Affected': trend.clients_affected,
      })));
      csvData += '\n';
    });
  }

  // Raw data
  if (data.rawData) {
    csvData += 'Raw Data\n';
    csvData += parser.parse(data.rawData);
  }

  return Buffer.from(csvData);
}

// Format data for PDF export
async function formatPdfExport(data) {
  const doc = new PDFDocument();
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {});

  // Title
  doc.fontSize(24).text('Network Performance Analysis', { align: 'center' });
  doc.moveDown();

  // Summary section
  if (data.summary) {
    doc.fontSize(18).text('Summary Analysis');
    doc.moveDown();

    doc.fontSize(14).text('Total Incidents by Type');
    Object.entries(data.summary.totalIncidents).forEach(([type, count]) => {
      doc.fontSize(12).text(`${type}: ${count}`);
    });
    doc.moveDown();

    doc.fontSize(14).text('Average MTTR by Type');
    Object.entries(data.summary.avgMTTR).forEach(([type, hours]) => {
      doc.fontSize(12).text(`${type}: ${hours.toFixed(2)} hours`);
    });
    doc.moveDown();
  }

  // Trends section
  if (data.trends) {
    doc.fontSize(18).text('Trends Analysis');
    doc.moveDown();

    Object.entries(data.trends.monthly).forEach(([category, trends]) => {
      doc.fontSize(14).text(`${category} Monthly Trends`);
      trends.forEach(trend => {
        doc.fontSize(12).text(
          `${new Date(trend.period).toLocaleDateString()}: ${trend.incident_count} incidents`
        );
      });
      doc.moveDown();
    });
  }

  // Regional section
  if (data.regional) {
    doc.fontSize(18).text('Regional Analysis');
    doc.moveDown();

    Object.entries(data.regional.incidentsByRegion).forEach(([category, regions]) => {
      doc.fontSize(14).text(`${category} by Region`);
      regions.forEach(region => {
        doc.fontSize(12).text(
          `${region.region}: ${region.incident_count} incidents, ${region.avg_mttr.toFixed(2)} hours MTTR`
        );
      });
      doc.moveDown();
    });
  }

  doc.end();

  return Buffer.concat(chunks);
}

module.exports = {
  formatExcelExport,
  formatCsvExport,
  formatPdfExport,
}; 