const xlsx = require('xlsx');
const fs = require('fs');

const APP_HEADERS = {
  name: { aliases: ['name', 'contact name', 'contact', 'full name', 'customer name', 'client name'], required: true },
  company: { aliases: ['company', 'company name', 'business', 'organization', 'org'], required: false },
  phone: { aliases: ['phone', 'phone number', 'mobile', 'contact number', 'telephone', 'whatsapp'], required: true },
  email: { aliases: ['email', 'email address', 'mail', 'e-mail'], required: false },
  website: { aliases: ['website', 'url', 'website url', 'site'], required: false },
  biztype: { aliases: ['biztype', 'business type', 'industry', 'category', 'niche'], required: false },
  channel: { aliases: ['channel', 'source', 'lead source', 'how found', 'referral source'], required: false },
  status: { aliases: ['status', 'lead status', 'stage'], required: false },
  value: { aliases: ['value', 'deal value', 'amount', 'budget', 'price', 'potential'], required: false },
  notes: { aliases: ['notes', 'comments', 'description', 'remark', 'remarkes'], required: false },
  followupDate: { aliases: ['followup', 'follow up', 'followup date', 'next contact', 'callback'], required: false }
};

function parseFile(filePath) {
  const ext = filePath.toLowerCase().split('.').pop();
  
  if (ext === 'csv') {
    return parseCSV(filePath);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseXLSX(filePath);
  }
  
  throw new Error('Unsupported file format. Please use CSV or XLSX.');
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('File is empty');
  }
  
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return { headers, data };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function parseXLSX(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (data.length === 0) {
    throw new Error('File is empty');
  }
  
  const headers = data[0].map(h => String(h).trim());
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = data[i][index] || '';
    });
    rows.push(row);
  }
  
  return { headers, data: rows };
}

function normalizeHeader(header) {
  const h = String(header).toLowerCase().trim();
  
  for (const [appField, config] of Object.entries(APP_HEADERS)) {
    if (config.aliases.some(alias => h === alias || h.includes(alias))) {
      return appField;
    }
  }
  
  return null;
}

function mapHeaders(fileHeaders) {
  const mapping = {};
  
  fileHeaders.forEach(header => {
    const normalized = normalizeHeader(header);
    if (normalized) {
      mapping[header] = normalized;
    }
  });
  
  return mapping;
}

function transformData(fileData, headerMapping) {
  const transformed = [];
  const errors = [];
  
  fileData.forEach((row, index) => {
    const newRow = {};
    let rowErrors = [];
    
    for (const [fileHeader, appField] of Object.entries(headerMapping)) {
      let value = row[fileHeader];
      
      if (value === undefined || value === null) {
        value = '';
      }
      
      value = String(value).trim();
      
      if (appField === 'value' && value) {
        value = value.replace(/[^0-9.-]/g, '');
        value = parseFloat(value) || 0;
      }
      
      if (appField === 'followupDate' && value) {
        if (value.includes('/')) {
          const [d, m, y] = value.split('/');
          value = new Date(y.length === 2 ? `20${y}` : y, m - 1, d).toISOString();
        } else if (!isNaN(Date.parse(value))) {
          value = new Date(value).toISOString();
        }
      }
      
      if (appField === 'status' && value) {
        const validStatuses = ['New', 'Contacted', 'Replied', 'Call Booked', 'Proposal Sent', 'Closed', 'Rejected', 'Follow Up'];
        if (!validStatuses.includes(value)) {
          value = 'New';
        }
      }
      
      newRow[appField] = value;
    }
    
    if (!newRow.name) {
      rowErrors.push('Missing name');
    }
    if (!newRow.phone) {
      rowErrors.push('Missing phone');
    }
    
    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, errors: rowErrors });
    } else {
      transformed.push(newRow);
    }
  });
  
  return { transformed, errors };
}

function getSuggestedMapping(fileHeaders) {
  const suggestions = {};
  
  fileHeaders.forEach(header => {
    const normalized = normalizeHeader(header);
    if (normalized) {
      suggestions[header] = normalized;
    }
  });
  
  return suggestions;
}

function getAvailableFields() {
  return Object.entries(APP_HEADERS).map(([key, config]) => ({
    key,
    required: config.required,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
  }));
}

module.exports = {
  parseFile,
  mapHeaders,
  transformData,
  getSuggestedMapping,
  getAvailableFields,
  APP_HEADERS
};
