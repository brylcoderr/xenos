import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documents as documentsApi } from '../lib/api';
import { ArrowLeft, Download, Share2, Edit, Loader2, ExternalLink, FileText } from 'lucide-react';

const TEMPLATE_TYPES = {
  'client-agreement': { label: 'Client Agreement', color: '#9b7cff' },
  'welcome-document': { label: 'Welcome Document', color: '#39e97b' },
  'invoice': { label: 'Invoice', color: '#3acdff' },
  'client-portal-guide': { label: 'Client Portal Guide', color: '#ff7c3a' },
  'project-timeline': { label: 'Project Timeline', color: '#39e97b' },
  'fulfilment-checklist': { label: 'Fulfilment Checklist', color: '#ffcc00' },
  'content-usage-guide': { label: 'Content Usage Guide', color: '#3acdff' },
  'monthly-report': { label: 'Monthly Report', color: '#9b7cff' },
  'competition-analysis': { label: 'Competition Analysis', color: '#ff7c3a' },
  'thank-you-document': { label: 'Thank You Document', color: '#39e97b' },
  'thank-you-package': { label: 'Thank You Package', color: '#ffcc00' },
  'custom': { label: 'Custom Document', color: '#888899' }
};

const TEMPLATE_CONFIGS = {
  'client-agreement': {
    sections: [
      { title: 'Parties', fields: ['date', 'clientName', 'clientCompany', 'clientEmail', 'developerName'] },
      { title: 'Timeline', fields: ['projectStartDate', 'finalDeliveryDate'] },
      { title: 'Payment', fields: ['kickoffAmount', 'kickoffDue', 'midAmount', 'midDue', 'finalAmount', 'finalDue'] },
      { title: 'Terms', fields: ['revisionRounds', 'hourlyRate'] }
    ]
  },
  'invoice': {
    sections: [
      { title: 'Sender', fields: ['developerName', 'developerEmail'] },
      { title: 'Client', fields: ['clientName', 'clientCompany', 'clientEmail'] },
      { title: 'Invoice Details', fields: ['invoiceNumber', 'invoiceDate', 'dueDate', 'serviceDescription', 'qty', 'rate', 'subtotal', 'taxPercent', 'totalDue'] },
      { title: 'Payment Details', fields: ['bankName', 'accountName', 'accountNumber', 'paymentDays'] }
    ]
  },
  'welcome-document': {
    sections: [
      { title: 'Developer Info', fields: ['developerName', 'primaryChannel', 'videoTool', 'notionLink'] },
      { title: 'Key Dates', fields: ['projectStart', 'firstMilestone', 'midReview', 'finalDelivery'] },
      { title: 'Quick Links', fields: ['agreementLink', 'timelineLink', 'invoiceLink', 'portalLink'] }
    ]
  },
  'project-timeline': {
    sections: [
      { title: 'Project Info', fields: ['projectName', 'clientName', 'startDate', 'endDate'] },
      { title: 'Phase 1', fields: ['phase1Start', 'phase1End', 'phase1Deliverable'] },
      { title: 'Phase 2', fields: ['phase2Start', 'phase2End', 'phase2Deliverable'] },
      { title: 'Phase 3', fields: ['phase3Start', 'phase3End', 'phase3Deliverable'] },
      { title: 'Phase 4', fields: ['phase4Start', 'phase4End', 'phase4Deliverable'] },
      { title: 'Phase 5', fields: ['phase5Start', 'phase5End', 'phase5Deliverable'] }
    ]
  },
  'fulfilment-checklist': {
    sections: [
      { title: 'Project Info', fields: ['projectName', 'clientName', 'deliveryDate', 'developerName'] }
    ]
  },
  'monthly-report': {
    sections: [
      { title: 'Report Info', fields: ['reportPeriod', 'projectName', 'clientName', 'developerName', 'date'] },
      { title: 'Content', fields: ['executiveSummary', 'completedTasks', 'inProgress', 'upcoming', 'blockers'] },
      { title: 'Budget', fields: ['hoursThisMonth', 'totalHours', 'budgetUsed', 'totalBudget', 'onTrack'] }
    ]
  },
  'competition-analysis': {
    sections: [
      { title: 'Overview', fields: ['clientProject', 'industry', 'date', 'developerName', 'objective'] },
      { title: 'Competitor 1', fields: ['comp1Name', 'comp1Url', 'comp1Strength', 'comp1Weakness'] },
      { title: 'Competitor 2', fields: ['comp2Name', 'comp2Url', 'comp2Strength', 'comp2Weakness'] },
      { title: 'Competitor 3', fields: ['comp3Name', 'comp3Url', 'comp3Strength', 'comp3Weakness'] },
      { title: 'SWOT', fields: ['strengths', 'weaknesses', 'opportunities', 'threats', 'recommendations'] }
    ]
  },
  'client-portal-guide': {
    sections: [
      { title: 'Portal Details', fields: ['portalLink', 'portalUsername', 'portalPassword'] }
    ]
  },
  'content-usage-guide': {
    sections: [
      { title: 'URLs', fields: ['liveUrl', 'stagingUrl', 'adminUrl'] },
      { title: 'Access', fields: ['cmsPlatform', 'cmsUsername', 'cmsPassword'] }
    ]
  },
  'thank-you-document': {
    sections: [
      { title: 'Details', fields: ['developerName', 'projectName', 'email', 'linkedin', 'portfolio', 'phone'] }
    ]
  },
  'thank-you-package': {
    sections: [
      { title: 'Login Credentials', fields: ['hostingUser', 'hostingPass', 'domainUser', 'domainPass', 'cmsUser', 'cmsPass', 'dbUser', 'dbPass', 'apiKeys', 'githubUser', 'githubPass'] },
      { title: 'Important URLs', fields: ['liveUrl', 'adminUrl', 'stagingUrl', 'repoUrl', 'notionUrl'] },
      { title: 'Brand Colors', fields: ['primaryColor', 'secondaryColor', 'bgColor', 'textDark', 'textLight'] },
      { title: 'Typography', fields: ['headingFont', 'bodyFont', 'accentFont'] }
    ]
  }
};

function formatFieldLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}

export default function DocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    setIsLoading(true);
    try {
      const doc = await documentsApi.getOne(id);
      setDocument(doc);
    } catch (error) {
      alert('Error loading document: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      await documentsApi.exportPdf(id, `${document.title}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('PDF Export failed\n\nReason: ' + error.message + '\n\nTIP: If the server is overloaded, you can use the "Print" button to save as PDF directly from your browser.');
    }
  };

  const handleExportDocx = async () => {
    try {
      await documentsApi.exportDocx(id, `${document.title}.docx`);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-accent-purple" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-8 text-muted-2">
        Document not found
      </div>
    );
  }

  const fields = document.fields || {};
  const templateConfig = TEMPLATE_CONFIGS[document.templateType] || { sections: [] };
  const templateInfo = TEMPLATE_TYPES[document.templateType] || TEMPLATE_TYPES.custom;

  const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
  const logoUrl = `${backendUrl}/Assets/logo.png`;

  const replaceVariables = (html, variables) => {
    if (!html) return '';
    let processed = html;
    
    // Map of fields to common variable names used in HTML templates
    const varMap = {
      client_name: variables.clientName || variables.client_name,
      company_name: variables.clientCompany || variables.company_name,
      project_name: variables.projectName || variables.project_name,
      amount: variables.totalDue || variables.finalAmount || variables.amount,
      date: variables.date || variables.invoiceDate || new Date().toLocaleDateString(),
      email: variables.clientEmail || variables.email,
      phone: variables.phone
    };

    // Replace {{variable}} style
    processed = processed.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
      const key = p1.trim();
      return varMap[key] || variables[key] || match;
    });

    // Replace [Variable] style (found in some templates)
    processed = processed.replace(/\[(.*?)\]/g, (match, p1) => {
      const key = p1.trim().toLowerCase().replace(/ /g, '_');
      return varMap[key] || variables[key] || match;
    });

    // Special: Inject script to populate inputs with IDs matching variable names
    const script = `
      <script>
        window.addEventListener('load', () => {
          const vars = ${JSON.stringify({ ...varMap, ...variables })};
          Object.keys(vars).forEach(key => {
            const el = document.getElementById(key) || document.getElementById(key.replace(/_/g, ''));
            if (el) {
              if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                el.value = vars[key];
              } else {
                el.textContent = vars[key];
              }
            }
          });
          // Fix for contract.html specific IDs
          if (document.getElementById('docDate') && vars.date) document.getElementById('docDate').value = vars.date;
          if (document.getElementById('clientName') && vars.client_name) document.getElementById('clientName').value = vars.client_name;
          if (document.getElementById('clientCompany') && vars.company_name) document.getElementById('clientCompany').value = vars.company_name;
        });
      </script>
    `;
    
    return processed + script;
  };

  if (document.htmlContent) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/documents')} className="p-2 hover:bg-background-3 rounded-lg">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-heading text-xl font-bold">{document.title}</h1>
              <p className="text-sm text-muted-2" style={{ color: templateInfo.color }}>
                Premium Template
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/documents/${id}/edit`)} className="btn btn-ghost">
              <Edit size={18} /> Edit
            </button>
            <button onClick={handleExportPdf} className="btn btn-secondary">
              <Download size={18} /> PDF
            </button>
            <button onClick={handlePrint} className="btn btn-ghost">
              Print
            </button>
          </div>
        </div>

        <div className="card bg-white overflow-hidden print:hidden" style={{ minHeight: '1000px' }}>
          <iframe
            srcDoc={replaceVariables(document.htmlContent, fields)}
            className="w-full h-[1200px] border-none"
            title="Document Preview"
          />
        </div>
        {/* Print-only version of the HTML content */}
        <div className="hidden print:block bg-white p-0">
          <div dangerouslySetInnerHTML={{ __html: replaceVariables(document.htmlContent, fields) }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/documents')} className="p-2 hover:bg-background-3 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-heading text-xl font-bold">{document.title}</h1>
            <p className="text-sm text-muted-2" style={{ color: templateInfo.color }}>
              {templateInfo.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/documents/${id}/edit`)} className="btn btn-ghost">
            <Edit size={18} /> Edit
          </button>
          <button onClick={handleExportPdf} className="btn btn-secondary">
            <Download size={18} /> PDF
          </button>
          <button onClick={handleExportDocx} className="btn btn-secondary">
            <Download size={18} /> DOCX
          </button>
          <button onClick={handlePrint} className="btn btn-ghost">
            Print
          </button>
        </div>
      </div>

      {/* Document Preview */}
      <div className="card overflow-hidden print:shadow-none print:border-none">
        <div 
          className="bg-white text-black p-8 mx-auto max-w-3xl"
          style={{ fontFamily: 'Barlow, sans-serif', minHeight: '800px' }}
        >
          {/* Header */}
          <div className="border-b-2 pb-4 mb-6 flex justify-between items-start" style={{ borderColor: templateInfo.color }}>
            <div>
              <h1 className="font-bold text-2xl uppercase" style={{ color: templateInfo.color }}>
                {templateInfo.label}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {document.title} · {new Date(document.updatedAt || document.createdAt).toLocaleDateString()}
              </p>
            </div>
            <img src={logoUrl} alt="Logo" className="h-12 object-contain" onError={(e) => e.target.style.display = 'none'} />
          </div>

          {/* Confidential Warning */}
          {templateInfo.label === 'Thank You Package' && (
            <div className="bg-red-500 text-white px-4 py-2 font-bold text-xs uppercase mb-6">
              ⚠ Confidential — Handle With Care
            </div>
          )}

          {/* Content */}
          {templateConfig.sections.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h2 className="font-bold text-sm uppercase border-b border-gray-300 pb-2 mb-3">
                {section.title}
              </h2>
              {section.fields.map(fieldKey => {
                const value = fields[fieldKey];
                return (
                  <div key={fieldKey} className="mb-3">
                    <p className="text-xs text-gray-500 uppercase font-semibold">{formatFieldLabel(fieldKey)}</p>
                    <p className={`text-sm ${value ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                      {value || `[${formatFieldLabel(fieldKey)}]`}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
            Generated by Xenotrix Agency OS
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
        }
      `}</style>
    </div>
  );
}
