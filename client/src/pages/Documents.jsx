import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documents as documentsApi } from '../lib/api';
import { Search, Plus, FileText, Download, Loader2, Copy, Trash2, Edit, Eye, Share2, FileSpreadsheet } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const TEMPLATE_TYPES = [
  { key: 'client-agreement', label: 'Client Agreement', icon: FileText, color: '#9b7cff', description: 'Service agreement with payment terms' },
  { key: 'welcome-document', label: 'Welcome Document', icon: Eye, color: '#39e97b', description: 'Welcome letter for new clients' },
  { key: 'invoice', label: 'Invoice', icon: FileSpreadsheet, color: '#3acdff', description: 'Professional invoice template' },
  { key: 'client-portal-guide', label: 'Client Portal Guide', icon: Share2, color: '#ff7c3a', description: 'Notion dashboard instructions' },
  { key: 'project-timeline', label: 'Project Timeline', icon: Copy, color: '#39e97b', description: 'Visual project roadmap' },
  { key: 'fulfilment-checklist', label: 'Fulfilment Checklist', icon: Eye, color: '#ffcc00', description: 'Delivery checklist' },
  { key: 'content-usage-guide', label: 'Content Usage Guide', icon: FileText, color: '#3acdff', description: 'How to use deliverables' },
  { key: 'monthly-report', label: 'Monthly Report', icon: Copy, color: '#9b7cff', description: 'Monthly progress report' },
  { key: 'competition-analysis', label: 'Competition Analysis', icon: Search, color: '#ff7c3a', description: 'Competitor research' },
  { key: 'thank-you-document', label: 'Thank You Document', icon: Edit, color: '#39e97b', description: 'Thank you note after completion' },
  { key: 'thank-you-package', label: 'Thank You Package', icon: Download, color: '#ffcc00', description: 'Final handoff with credentials' }
];

export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchTemplates();
  }, [search, typeFilter]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await documentsApi.getAll(params);
      setDocuments(res.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await documentsApi.getTemplates();
      setTemplates(res);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateDocument = async (templateType) => {
    try {
      const template = TEMPLATE_TYPES.find(t => t.key === templateType);
      const res = await documentsApi.create({
        templateType,
        title: `${template?.label || 'Document'} - Untitled`,
        fields: {}
      });
      navigate(`/documents/${res._id}/edit`);
    } catch (error) {
      alert('Error creating document: ' + error.message);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await documentsApi.delete(deleteId);
      fetchDocuments();
      setDeleteId(null);
    } catch (error) {
      alert('Error deleting: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await documentsApi.duplicate(id);
      fetchDocuments();
    } catch (error) {
      alert('Error duplicating: ' + error.message);
    }
  };

  const handleExportPdf = async (doc) => {
    try {
      await documentsApi.exportPdf(doc._id, `${doc.title}.pdf`);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const handleExportDocx = async (doc) => {
    try {
      await documentsApi.exportDocx(doc._id, `${doc.title}.docx`);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const handleShare = async (doc) => {
    try {
      const res = await documentsApi.share(doc._id, !doc.isShareEnabled);
      if (res.isShareEnabled) {
        setShareUrl(window.location.origin + res.shareUrl);
        setShowShareModal(doc);
      } else {
        setShowShareModal(null);
      }
      fetchDocuments();
    } catch (error) {
      alert('Error sharing: ' + error.message);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTemplateColor = (type) => {
    const template = TEMPLATE_TYPES.find(t => t.key === type);
    return template?.color || '#9b7cff';
  };

  const getTemplateLabel = (type) => {
    const template = TEMPLATE_TYPES.find(t => t.key === type);
    return template?.label || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Documents</h1>
          <p className="text-muted-2 text-sm">Create and manage professional documents</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
          <Plus size={18} /> New Document
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">All Types</option>
            {TEMPLATE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <Loader2 size={24} className="animate-spin mx-auto text-muted-2" />
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-2">
            No documents found
          </div>
        ) : (
          documents.map(doc => (
            <div key={doc._id} className="card p-4 hover:border-accent-purple transition-colors">
              <div className="flex items-start gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${getTemplateColor(doc.templateType)}20`, color: getTemplateColor(doc.templateType) }}
                >
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/documents/${doc._id}/preview`} className="font-medium hover:text-accent-purple truncate block">
                    {doc.title}
                  </Link>
                  <div className="text-xs text-muted-2 mt-1">{getTemplateLabel(doc.templateType)}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1">
                  {doc.isShareEnabled && (
                    <span className="badge badge-green text-xs">Shared</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigate(`/documents/${doc._id}/edit`)}
                    className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-text"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => navigate(`/documents/${doc._id}/preview`)}
                    className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-text"
                    title="Preview"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleShare(doc)}
                    className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-accent-blue"
                    title="Share"
                  >
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={() => handleExportPdf(doc)}
                    className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-accent-green"
                    title="Download PDF"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(doc._id)}
                    className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-accent-purple"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-danger"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Document Modal - Template Picker */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-heading text-xl font-bold">Choose a Template</h2>
              <p className="text-sm text-muted-2 mt-1">Select a blueprint to start your professional document</p>
            </div>
            <div className="modal-body modal-content-scroll max-h-[60vh] overflow-y-auto">
              <div className="template-grid">
                {TEMPLATE_TYPES.map(template => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.key}
                      onClick={() => handleCreateDocument(template.key)}
                      className="template-card group"
                      style={{ color: template.color }}
                    >
                      <div 
                        className="template-card-icon"
                        style={{ backgroundColor: `${template.color}15`, color: template.color }}
                      >
                        <Icon size={22} />
                      </div>
                      <div className="template-card-title">{template.label}</div>
                      <div className="template-card-desc">{template.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowNewModal(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(null)}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-heading text-xl font-bold">Share Document</h2>
            </div>
            <div className="modal-body space-y-4">
              <div className="p-4 bg-background-3 rounded-lg">
                <p className="text-sm text-muted-2 mb-2">Share link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="input flex-1 text-sm font-mono"
                  />
                  <button onClick={copyShareLink} className="btn btn-secondary">
                    {copied ? 'Copied!' : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-2">
                ⚠ Anyone with this link can view this document without logging in.
              </p>
            </div>
            <div className="modal-footer justify-between">
              <button onClick={() => handleShare(showShareModal)} className="btn btn-danger">
                Disable Link
              </button>
              <button onClick={() => setShowShareModal(null)} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete Document"
        isLoading={isDeleting}
      />
    </div>
  );
}

function Link({ to, children, className }) {
  const navigate = useNavigate();
  return (
    <span onClick={() => navigate(to)} className={`cursor-pointer ${className || ''}`}>
      {children}
    </span>
  );
}
