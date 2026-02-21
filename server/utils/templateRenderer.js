const fs = require('fs');
const path = require('path');

const TEMPLATE_CONFIGS = {
  'client-agreement': {
    label: 'Client Agreement',
    color: '#9b7cff',
    sections: [
      {
        title: 'Parties',
        fields: [
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'clientName', label: 'Client Full Name', type: 'text' },
          { key: 'clientCompany', label: 'Client Company', type: 'text' },
          { key: 'clientEmail', label: 'Client Email', type: 'email' },
          { key: 'developerName', label: 'Your Name', type: 'text' },
        ]
      },
      {
        title: 'Timeline',
        fields: [
          { key: 'projectStartDate', label: 'Project Start Date', type: 'date' },
          { key: 'finalDeliveryDate', label: 'Final Delivery Date', type: 'date' },
        ]
      },
      {
        title: 'Payment',
        fields: [
          { key: 'kickoffAmount', label: 'Kickoff / Deposit Amount ($)', type: 'text' },
          { key: 'kickoffDue', label: 'Kickoff Due Date', type: 'date' },
          { key: 'midAmount', label: 'Mid-Project Amount ($)', type: 'text' },
          { key: 'midDue', label: 'Mid-Project Due Date', type: 'date' },
          { key: 'finalAmount', label: 'Final Delivery Amount ($)', type: 'text' },
          { key: 'finalDue', label: 'Final Due Date', type: 'date' },
        ]
      },
      {
        title: 'Terms',
        fields: [
          { key: 'revisionRounds', label: 'Revision Rounds Included', type: 'text' },
          { key: 'hourlyRate', label: 'Additional Revision Rate ($/hr)', type: 'text' },
        ]
      }
    ]
  },

  'invoice': {
    label: 'Invoice',
    color: '#3acdff',
    sections: [
      {
        title: 'Sender',
        fields: [
          { key: 'developerName', label: 'Your Name', type: 'text' },
          { key: 'developerEmail', label: 'Your Email', type: 'email' },
        ]
      },
      {
        title: 'Client',
        fields: [
          { key: 'clientName', label: 'Client Name', type: 'text' },
          { key: 'clientCompany', label: 'Client Company', type: 'text' },
          { key: 'clientEmail', label: 'Client Email', type: 'email' },
        ]
      },
      {
        title: 'Invoice Details',
        fields: [
          { key: 'invoiceNumber', label: 'Invoice #', type: 'text', placeholder: 'INV-001' },
          { key: 'invoiceDate', label: 'Invoice Date', type: 'date' },
          { key: 'dueDate', label: 'Due Date', type: 'date' },
          { key: 'serviceDescription', label: 'Service Description', type: 'textarea' },
          { key: 'qty', label: 'Qty / Hours', type: 'text' },
          { key: 'rate', label: 'Rate ($)', type: 'text' },
          { key: 'subtotal', label: 'Subtotal ($)', type: 'text' },
          { key: 'taxPercent', label: 'Tax (%)', type: 'text' },
          { key: 'totalDue', label: 'Total Due ($)', type: 'text' },
        ]
      },
      {
        title: 'Payment Details',
        fields: [
          { key: 'bankName', label: 'Bank / PayPal', type: 'text' },
          { key: 'accountName', label: 'Account Name', type: 'text' },
          { key: 'accountNumber', label: 'Account Number', type: 'text' },
          { key: 'paymentDays', label: 'Payment Terms (days)', type: 'text', placeholder: '14' },
        ]
      }
    ]
  },

  'welcome-document': {
    label: 'Welcome Document',
    color: '#39e97b',
    sections: [
      {
        title: 'Developer Info',
        fields: [
          { key: 'developerName', label: 'Your Name', type: 'text' },
          { key: 'primaryChannel', label: 'Primary Communication Channel', type: 'text', placeholder: 'Slack / Email' },
          { key: 'videoTool', label: 'Video Call Tool', type: 'text', placeholder: 'Zoom / Google Meet' },
          { key: 'notionLink', label: 'Notion Dashboard Link', type: 'text' },
        ]
      },
      {
        title: 'Key Dates',
        fields: [
          { key: 'projectStart', label: 'Project Start Date', type: 'date' },
          { key: 'firstMilestone', label: 'First Milestone Date', type: 'date' },
          { key: 'midReview', label: 'Mid-Review Date', type: 'date' },
          { key: 'finalDelivery', label: 'Final Delivery Date', type: 'date' },
        ]
      },
      {
        title: 'Quick Links',
        fields: [
          { key: 'agreementLink', label: 'Agreement Link', type: 'text' },
          { key: 'timelineLink', label: 'Timeline Link', type: 'text' },
          { key: 'invoiceLink', label: 'Invoice Link', type: 'text' },
          { key: 'portalLink', label: 'Client Portal Link', type: 'text' },
        ]
      }
    ]
  },

  'project-timeline': {
    label: 'Project Timeline',
    color: '#39e97b',
    sections: [
      {
        title: 'Project Info',
        fields: [
          { key: 'projectName', label: 'Project Name', type: 'text' },
          { key: 'clientName', label: 'Client Name', type: 'text' },
          { key: 'startDate', label: 'Start Date', type: 'date' },
          { key: 'endDate', label: 'End Date', type: 'date' },
        ]
      },
      {
        title: 'Phase 1 — Discovery & Planning',
        fields: [
          { key: 'phase1Start', label: 'Start', type: 'date' },
          { key: 'phase1End', label: 'End', type: 'date' },
          { key: 'phase1Deliverable', label: 'Deliverable', type: 'textarea' },
        ]
      },
      {
        title: 'Phase 2 — Design & Wireframes',
        fields: [
          { key: 'phase2Start', label: 'Start', type: 'date' },
          { key: 'phase2End', label: 'End', type: 'date' },
          { key: 'phase2Deliverable', label: 'Deliverable', type: 'textarea' },
        ]
      },
      {
        title: 'Phase 3 — Development',
        fields: [
          { key: 'phase3Start', label: 'Start', type: 'date' },
          { key: 'phase3End', label: 'End', type: 'date' },
          { key: 'phase3Deliverable', label: 'Deliverable', type: 'textarea' },
        ]
      },
      {
        title: 'Phase 4 — Testing & QA',
        fields: [
          { key: 'phase4Start', label: 'Start', type: 'date' },
          { key: 'phase4End', label: 'End', type: 'date' },
          { key: 'phase4Deliverable', label: 'Deliverable', type: 'textarea' },
        ]
      },
      {
        title: 'Phase 5 — Launch',
        fields: [
          { key: 'phase5Start', label: 'Start', type: 'date' },
          { key: 'phase5End', label: 'End', type: 'date' },
          { key: 'phase5Deliverable', label: 'Deliverable', type: 'textarea' },
        ]
      }
    ]
  },

  'fulfilment-checklist': {
    label: 'Fulfilment Checklist',
    color: '#ffcc00',
    sections: [
      {
        title: 'Project Info',
        fields: [
          { key: 'projectName', label: 'Project Name', type: 'text' },
          { key: 'clientName', label: 'Client Name', type: 'text' },
          { key: 'deliveryDate', label: 'Delivery Date', type: 'date' },
          { key: 'developerName', label: 'Developer Name', type: 'text' },
        ]
      }
    ]
  },

  'monthly-report': {
    label: 'Monthly Report',
    color: '#9b7cff',
    sections: [
      {
        title: 'Report Info',
        fields: [
          { key: 'reportPeriod', label: 'Report Period (Month Year)', type: 'text' },
          { key: 'projectName', label: 'Project Name', type: 'text' },
          { key: 'clientName', label: 'Client Name', type: 'text' },
          { key: 'developerName', label: 'Prepared By', type: 'text' },
          { key: 'date', label: 'Date', type: 'date' },
        ]
      },
      {
        title: 'Content',
        fields: [
          { key: 'executiveSummary', label: 'Executive Summary', type: 'textarea' },
          { key: 'completedTasks', label: 'Completed This Month', type: 'textarea' },
          { key: 'inProgress', label: 'In Progress', type: 'textarea' },
          { key: 'upcoming', label: 'Upcoming (Next Month)', type: 'textarea' },
          { key: 'blockers', label: 'Blockers & Risks', type: 'textarea' },
        ]
      },
      {
        title: 'Budget',
        fields: [
          { key: 'hoursThisMonth', label: 'Hours This Month', type: 'text' },
          { key: 'totalHours', label: 'Total Hours to Date', type: 'text' },
          { key: 'budgetUsed', label: 'Budget Used ($)', type: 'text' },
          { key: 'totalBudget', label: 'Total Budget ($)', type: 'text' },
          { key: 'onTrack', label: 'On Track?', type: 'text' },
        ]
      }
    ]
  },

  'competition-analysis': {
    label: 'Competition Analysis',
    color: '#ff7c3a',
    sections: [
      {
        title: 'Overview',
        fields: [
          { key: 'clientProject', label: 'Client / Project', type: 'text' },
          { key: 'industry', label: 'Industry', type: 'text' },
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'developerName', label: 'Prepared By', type: 'text' },
          { key: 'objective', label: 'Objective / Context', type: 'textarea' },
        ]
      },
      {
        title: 'Competitor 1',
        fields: [
          { key: 'comp1Name', label: 'Competitor Name', type: 'text' },
          { key: 'comp1Url', label: 'Website URL', type: 'text' },
          { key: 'comp1Strength', label: 'Strengths', type: 'textarea' },
          { key: 'comp1Weakness', label: 'Weaknesses', type: 'textarea' },
        ]
      },
      {
        title: 'Competitor 2',
        fields: [
          { key: 'comp2Name', label: 'Competitor Name', type: 'text' },
          { key: 'comp2Url', label: 'Website URL', type: 'text' },
          { key: 'comp2Strength', label: 'Strengths', type: 'textarea' },
          { key: 'comp2Weakness', label: 'Weaknesses', type: 'textarea' },
        ]
      },
      {
        title: 'Competitor 3',
        fields: [
          { key: 'comp3Name', label: 'Competitor Name', type: 'text' },
          { key: 'comp3Url', label: 'Website URL', type: 'text' },
          { key: 'comp3Strength', label: 'Strengths', type: 'textarea' },
          { key: 'comp3Weakness', label: 'Weaknesses', type: 'textarea' },
        ]
      },
      {
        title: 'SWOT Analysis',
        fields: [
          { key: 'strengths', label: 'Strengths', type: 'textarea' },
          { key: 'weaknesses', label: 'Weaknesses', type: 'textarea' },
          { key: 'opportunities', label: 'Opportunities', type: 'textarea' },
          { key: 'threats', label: 'Threats', type: 'textarea' },
          { key: 'recommendations', label: 'Strategic Recommendations', type: 'textarea' },
        ]
      }
    ]
  },

  'client-portal-guide': {
    label: 'Client Portal Guide',
    color: '#ff7c3a',
    sections: [
      {
        title: 'Portal Details',
        fields: [
          { key: 'portalLink', label: 'Notion Portal URL', type: 'text' },
          { key: 'portalUsername', label: 'Portal Username (if needed)', type: 'text' },
          { key: 'portalPassword', label: 'Portal Password (if needed)', type: 'text' },
        ]
      }
    ]
  },

  'content-usage-guide': {
    label: 'Content Usage Guide',
    color: '#3acdff',
    sections: [
      {
        title: 'URLs',
        fields: [
          { key: 'liveUrl', label: 'Live Website URL', type: 'text' },
          { key: 'stagingUrl', label: 'Staging URL', type: 'text' },
          { key: 'adminUrl', label: 'Admin Panel URL', type: 'text' },
        ]
      },
      {
        title: 'Access',
        fields: [
          { key: 'cmsPlatform', label: 'CMS Platform', type: 'text' },
          { key: 'cmsUsername', label: 'CMS Username', type: 'text' },
          { key: 'cmsPassword', label: 'CMS Password', type: 'text' },
        ]
      }
    ]
  },

  'thank-you-document': {
    label: 'Thank You Document',
    color: '#39e97b',
    sections: [
      {
        title: 'Details',
        fields: [
          { key: 'developerName', label: 'Your Name', type: 'text' },
          { key: 'projectName', label: 'Project Name', type: 'text' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'linkedin', label: 'LinkedIn URL', type: 'text' },
          { key: 'portfolio', label: 'Portfolio URL', type: 'text' },
          { key: 'phone', label: 'Phone', type: 'text' },
        ]
      }
    ]
  },

  'thank-you-package': {
    label: 'Thank You Package',
    color: '#ffcc00',
    isConfidential: true,
    sections: [
      {
        title: 'Login Credentials',
        fields: [
          { key: 'hostingUser', label: 'Hosting Username/Email', type: 'text' },
          { key: 'hostingPass', label: 'Hosting Password/Key', type: 'text' },
          { key: 'domainUser', label: 'Domain Provider Username', type: 'text' },
          { key: 'domainPass', label: 'Domain Provider Password', type: 'text' },
          { key: 'cmsUser', label: 'CMS/Admin Username', type: 'text' },
          { key: 'cmsPass', label: 'CMS/Admin Password', type: 'text' },
          { key: 'dbUser', label: 'Database Username', type: 'text' },
          { key: 'dbPass', label: 'Database Password', type: 'text' },
          { key: 'apiKeys', label: 'API Keys', type: 'textarea' },
          { key: 'githubUser', label: 'GitHub/GitLab Username', type: 'text' },
          { key: 'githubPass', label: 'GitHub/GitLab Password/Token', type: 'text' },
        ]
      },
      {
        title: 'Important URLs',
        fields: [
          { key: 'liveUrl', label: 'Live Website URL', type: 'text' },
          { key: 'adminUrl', label: 'Admin Panel URL', type: 'text' },
          { key: 'stagingUrl', label: 'Staging Server URL', type: 'text' },
          { key: 'repoUrl', label: 'Repository URL', type: 'text' },
          { key: 'notionUrl', label: 'Notion Portal URL', type: 'text' },
        ]
      },
      {
        title: 'Brand Colors',
        fields: [
          { key: 'primaryColor', label: 'Primary Color (HEX)', type: 'text', placeholder: '#000000' },
          { key: 'secondaryColor', label: 'Secondary Color (HEX)', type: 'text' },
          { key: 'bgColor', label: 'Background Color (HEX)', type: 'text' },
          { key: 'textDark', label: 'Text Dark (HEX)', type: 'text' },
          { key: 'textLight', label: 'Text Light (HEX)', type: 'text' },
        ]
      },
      {
        title: 'Typography',
        fields: [
          { key: 'headingFont', label: 'Heading Font', type: 'text', placeholder: 'Inter Bold' },
          { key: 'bodyFont', label: 'Body Font', type: 'text', placeholder: 'Inter Regular' },
          { key: 'accentFont', label: 'Accent Font', type: 'text', placeholder: 'Playfair Display' },
        ]
      }
    ]
  },

  'custom': {
    label: 'Custom Document',
    color: '#888899',
    sections: [
      {
        title: 'Content',
        fields: [
          { key: 'content', label: 'Document Content', type: 'textarea' }
        ]
      }
    ]
  }
};

function getTemplateConfig(templateType) {
  return TEMPLATE_CONFIGS[templateType] || TEMPLATE_CONFIGS['custom'];
}

function renderTemplate(templateType, fields = {}, options = {}) {
  const config = getTemplateConfig(templateType);
  const accentColor = config.color || '#9b7cff';
  
  const logoPath = path.join(__dirname, '../../Assets/logo.png');
  let logoDataUri = '';
  try {
    if (fs.existsSync(logoPath)) {
      const logoBase64 = fs.readFileSync(logoPath).toString('base64');
      logoDataUri = `data:image/png;base64,${logoBase64}`;
    }
  } catch (e) {
    console.error('Error reading logo for template:', e);
  }

  let sectionsHtml = '';
  
  if (config.isConfidential) {
    sectionsHtml += `<div class="confidential">⚠ Confidential — Handle With Care</div>`;
  }

  config.sections.forEach(section => {
    sectionsHtml += `<div class="section"><h2>${section.title}</h2>`;
    
    section.fields.forEach(field => {
      const value = fields[field.key] || '';
      const displayValue = value ? value : `[${field.label}]`;
      const isEmpty = !value;
      
      if (field.type === 'textarea') {
        sectionsHtml += `
          <div class="field">
            <div class="field-label">${field.label}</div>
            <div class="field-value ${isEmpty ? 'empty' : ''}" style="white-space: pre-wrap;">${displayValue}</div>
          </div>
        `;
      } else {
        sectionsHtml += `
          <div class="field">
            <div class="field-label">${field.label}</div>
            <div class="field-value ${isEmpty ? 'empty' : ''}">${displayValue}</div>
          </div>
        `;
      }
    });
    
    sectionsHtml += `</div>`;
  });

  if (options.raw) {
    return sectionsHtml;
  }

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Barlow', 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #111; background: white; padding: 40px; }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid ${accentColor}; margin-bottom: 30px; }
    .header h1 { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 900; color: ${accentColor}; text-transform: uppercase; letter-spacing: 2px; }
    .header .subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
    .section { margin-bottom: 25px; }
    .section h2 { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 700; color: #333; margin: 20px 0 10px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .field { margin-bottom: 12px; }
    .field-label { font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
    .field-value { font-size: 14px; color: #111; padding: 8px 10px; background: #f9f9f9; border-radius: 4px; }
    .field-value.empty { color: #999; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table th, table td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
    table th { background: #f5f5f5; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .confidential { background: #ff4444; color: white; padding: 8px 16px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 20px; }
    .signature-block { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature-block .sig-box { width: 45%; }
    .signature-block .sig-line { border-bottom: 1px solid #333; height: 40px; margin-bottom: 5px; }
    .signature-block .sig-label { font-size: 11px; color: #666; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #ddd; font-family: 'Space Mono', monospace; font-size: 10px; color: #666; margin-top: 40px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
    ${logoDataUri ? `<img src="${logoDataUri}" alt="Logo" style="height: 60px; margin-bottom: 5px;">` : ''}
    <h1>${config.label}</h1>
    <div class="subtitle">${new Date().toLocaleDateString()}</div>
  </div>
  ${sectionsHtml}
  <div class="footer">
    Generated by Xenotrix Agency OS · ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;

  return html;
}

function getAllTemplates() {
  return Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => ({
    key,
    label: config.label,
    color: config.color,
    description: config.sections.map(s => s.title).join(', '),
    isConfidential: config.isConfidential || false
  }));
}

module.exports = {
  TEMPLATE_CONFIGS,
  getTemplateConfig,
  renderTemplate,
  getAllTemplates
};
