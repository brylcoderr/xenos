import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { documents as documentsApi } from '../lib/api';
import { FileText, Loader2 } from 'lucide-react';

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

export default function PublicDocumentView() {
  const { token } = useParams();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocument();
  }, [token]);

  const fetchDocument = async () => {
    setIsLoading(true);
    try {
      const res = await documentsApi.getShared(token);
      setDocument(res);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent-purple" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 text-muted-2" />
          <h1 className="text-xl font-heading font-bold mb-2">Document Not Found</h1>
          <p className="text-muted-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const { document: doc, templateConfig, owner } = document;
  const fields = doc.fields || {};
  const templateInfo = TEMPLATE_TYPES[doc.templateType] || TEMPLATE_TYPES.custom;
  const config = templateConfig || TEMPLATE_CONFIGS[doc.templateType] || { sections: [] };

  const replaceVariables = (html, variables) => {
    if (!html) return '';
    let processed = html;
    
    const varMap = {
      client_name: variables.clientName || variables.client_name,
      company_name: variables.clientCompany || variables.company_name,
      project_name: variables.projectName || variables.project_name,
      amount: variables.totalDue || variables.finalAmount || variables.amount,
      date: variables.date || variables.invoiceDate || new Date().toLocaleDateString(),
      email: variables.clientEmail || variables.email,
      phone: variables.phone
    };

    processed = processed.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
      const key = p1.trim();
      return varMap[key] || variables[key] || match;
    });

    processed = processed.replace(/\[(.*?)\]/g, (match, p1) => {
      const key = p1.trim().toLowerCase().replace(/ /g, '_');
      return varMap[key] || variables[key] || match;
    });

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
        });
      </script>
    `;
    
    return processed + script;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-heading text-3xl font-bold text-accent-purple">XENOTRIX</h1>
          <p className="text-sm text-muted-2 mt-1">Shared Document</p>
        </div>

        {/* Document */}
        {doc.htmlContent ? (
          <div className="card bg-white overflow-hidden" style={{ minHeight: '800px' }}>
            <iframe
              srcDoc={replaceVariables(doc.htmlContent, fields)}
              className="w-full h-[1000px] border-none"
              title="Document View"
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div 
              className="bg-white text-black p-8"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              {/* Header */}
              <div className="border-b-2 pb-4 mb-6" style={{ borderColor: templateInfo.color }}>
                <h1 className="font-bold text-2xl uppercase" style={{ color: templateInfo.color }}>
                  {templateInfo.label}
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  {doc.title} · {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Confidential Warning */}
              {templateInfo.label === 'Thank You Package' && (
                <div className="bg-red-500 text-white px-4 py-2 font-bold text-xs uppercase mb-6">
                  ⚠ Confidential — Handle With Care
                </div>
              )}

              {/* Content */}
              {config.sections.map((section, idx) => (
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
                Made with Xenotrix Agency OS
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
