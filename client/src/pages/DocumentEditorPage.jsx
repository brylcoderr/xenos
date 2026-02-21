import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documents as documentsApi } from '../lib/api';
import { Save, Download, Share2, Eye, ArrowLeft, Loader2, Check } from 'lucide-react';

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

export default function DocumentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [fields, setFields] = useState({});
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    setIsLoading(true);
    try {
      const doc = await documentsApi.getOne(id);
      setDocument(doc);
      setTitle(doc.title);
      setFields(doc.fields || {});
    } catch (error) {
      alert('Error loading document: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await documentsApi.update(id, { title, fields });
      setLastSaved(new Date());
    } catch (error) {
      alert('Error saving: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  }, [id, title, fields]);

  const handleFieldChange = (key, value) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleExportPdf = async () => {
    try {
      await handleSave();
      await documentsApi.exportPdf(id, `${title}.pdf`);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const handleExportDocx = async () => {
    try {
      await handleSave();
      await documentsApi.exportDocx(id, `${title}.docx`);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-accent-purple" />
      </div>
    );
  }

  const templateConfig = TEMPLATE_CONFIGS[document?.templateType] || { sections: [] };
  const templateInfo = TEMPLATE_TYPES[document?.templateType] || TEMPLATE_TYPES.custom;

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/documents')} className="p-2 hover:bg-background-3 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-heading font-bold bg-transparent border-none outline-none focus:underline"
              placeholder="Document Title"
            />
            <p className="text-sm text-muted-2" style={{ color: templateInfo.color }}>
              {templateInfo.label} {document?.htmlContent && '(Premium Template)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-2">
            {lastSaved && `Saved ${lastSaved.toLocaleTimeString()}`}
          </span>
          <button onClick={() => setShowPreview(!showPreview)} className="btn btn-ghost">
            <Eye size={18} />
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save
          </button>
          <button onClick={handleExportPdf} className="btn btn-secondary">
            <Download size={18} /> PDF
          </button>
          <button onClick={handleExportDocx} className="btn btn-secondary">
            <Download size={18} /> DOCX
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Field Editor */}
        <div className="space-y-4">
          {templateConfig.sections.map((section, idx) => (
            <div key={idx} className="card p-4">
              <h3 className="font-heading font-bold mb-4" style={{ color: templateInfo.color }}>
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.fields.map(fieldKey => (
                  <div key={fieldKey}>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">
                      {formatFieldLabel(fieldKey)}
                    </label>
                    {fieldKey.includes('Description') || fieldKey.includes('Summary') || fieldKey.includes('Tasks') || fieldKey.includes('Progress') || fieldKey.includes('blockers') || fieldKey.includes('notes') || fieldKey.includes('apiKeys') ? (
                      <textarea
                        value={fields[fieldKey] || ''}
                        onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                        className="input w-full h-24"
                        placeholder={`Enter ${formatFieldLabel(fieldKey).toLowerCase()}...`}
                      />
                    ) : (
                      <input
                        type={fieldKey.toLowerCase().includes('date') ? 'date' : 'text'}
                        value={fields[fieldKey] || ''}
                        onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                        className="input w-full"
                        placeholder={`Enter ${formatFieldLabel(fieldKey).toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {templateConfig.sections.length === 0 && (
            <div className="card p-8 text-center bg-background-2 border-dashed border-2 border-background-3">
              <p className="text-muted-2">No custom fields for this template.</p>
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="card p-4 sticky top-4">
          <h3 className="font-heading font-bold mb-4">Preview</h3>
          {document?.htmlContent ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[70vh]">
              <iframe
                srcDoc={replaceVariables(document.htmlContent, fields)}
                className="w-full h-full border-none"
                title="Live Preview"
              />
            </div>
          ) : (
            <div 
              className="bg-white text-black p-6 rounded-lg shadow-lg overflow-auto max-h-[70vh]"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              {/* Document Preview Render */}
              <div className="border-b-2 pb-4 mb-4" style={{ borderColor: templateInfo.color }}>
                <h1 className="font-bold text-xl uppercase" style={{ color: templateInfo.color }}>
                  {templateInfo.label}
                </h1>
                <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString()}</p>
              </div>

              {templateInfo.label === 'Thank You Package' && (
                <div className="bg-red-500 text-white px-4 py-2 font-bold text-xs uppercase mb-4">
                  ⚠ Confidential — Handle With Care
                </div>
              )}

              {templateConfig.sections.map((section, idx) => (
                <div key={idx} className="mb-4">
                  <h2 className="font-bold text-sm uppercase border-b border-gray-300 pb-1 mb-2">
                    {section.title}
                  </h2>
                  {section.fields.map(fieldKey => {
                    const value = fields[fieldKey];
                    return (
                      <div key={fieldKey} className="mb-2">
                        <p className="text-xs text-gray-500 uppercase">{formatFieldLabel(fieldKey)}</p>
                        <p className={value ? 'text-sm' : 'text-sm text-gray-300 italic'}>
                          {value || `[${formatFieldLabel(fieldKey)}]`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ))}

              <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                Generated by Xenotrix Agency OS
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
