import { useEffect, useState, useRef } from 'react';
import { useLeadStore } from '../store';
import { cn } from '../lib/utils';
import { leads as leadsApi } from '../lib/api';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  Globe,
  Edit,
  Trash2,
  MessageCircle,
  Download,
  Upload,
  Loader2,
  FileSpreadsheet,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const statusColors = {
  'New': 'badge-yellow',
  'Contacted': 'badge-blue',
  'Replied': 'badge-purple',
  'Call Booked': 'badge-orange',
  'Proposal Sent': 'badge-green',
  'Closed': 'badge-green',
  'Follow Up': 'badge-yellow',
  'Rejected': 'badge-danger',
};

const channelColors = {
  'WhatsApp': 'ch-wa',
  'Cold Call': 'ch-call',
  'SMS': 'ch-sms',
  'LinkedIn': 'ch-li',
};

const CHANNELS = ['WhatsApp', 'Cold Call', 'SMS', 'LinkedIn'];
const BIZ_TYPES = ['Restaurant', 'Clinic', 'Lawyer', 'Real Estate', 'Gym', 'Retail', 'Other'];
const STATUSES = ['New', 'Contacted', 'Replied', 'Call Booked', 'Proposal Sent', 'Closed', 'Follow Up', 'Rejected'];

export default function Leads() {
  const { leads, stats, pagination, isLoading, fetchLeads, fetchStats, createLead, updateLead, deleteLead: deleteLeadAction } = useLeadStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [view, setView] = useState('table');
  
  // Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState('upload'); // upload, mapping, importing, done
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [headerMapping, setHeaderMapping] = useState({});
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchLeads({ search, status: statusFilter, channel: channelFilter });
    fetchStats();
  }, [search, statusFilter, channelFilter]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = async (leadId, newStatus) => {
    await updateLead(leadId, { status: newStatus });
    fetchStats();
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteLeadAction(deleteId);
      await fetchStats();
      setDeleteId(null);
    } catch (error) {
      alert('Failed to delete lead: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      company: formData.get('company'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      website: formData.get('website'),
      biztype: formData.get('biztype'),
      channel: formData.get('channel'),
      status: formData.get('status'),
      value: parseFloat(formData.get('value')) || 0,
      notes: formData.get('notes'),
      followupDate: formData.get('followupDate') || null,
    };

    if (editingLead) {
      await updateLead(editingLead._id, data);
    } else {
      await createLead(data);
    }
    setShowModal(false);
    setEditingLead(null);
    fetchStats();
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setShowModal(true);
  };

  const openNewModal = () => {
    setEditingLead(null);
    setShowModal(true);
  };

  // Import handlers
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportFile(file);
    setImporting(true);
    
    try {
      const result = await leadsApi.importAnalyze(file);
      setFileHeaders(result.fileHeaders);
      setImportData(result.preview);
      
      // Auto-map suggested fields
      const mapping = {};
      Object.entries(result.suggestedMapping).forEach(([fileHeader, appField]) => {
        mapping[fileHeader] = appField;
      });
      setHeaderMapping(mapping);
      
      setImportStep('mapping');
    } catch (error) {
      alert('Error analyzing file: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleMappingChange = (fileHeader, appField) => {
    setHeaderMapping(prev => ({
      ...prev,
      [fileHeader]: appField
    }));
  };

  const handleConfirmImport = async () => {
    if (!importData || fileHeaders.length === 0) return;
    
    setImporting(true);
    
    try {
      // Build the full dataset from preview (in real app, you'd store all data)
      // For now, we'll use the preview data
      const result = await leadsApi.importConfirm(headerMapping, importData);
      
      setImportResult(result);
      setImportStep('done');
      fetchLeads({ search, status: statusFilter, channel: channelFilter });
      fetchStats();
    } catch (error) {
      alert('Error importing: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setShowImportModal(false);
    setImportStep('upload');
    setImportFile(null);
    setImportData(null);
    setFileHeaders([]);
    setHeaderMapping({});
    setImportErrors([]);
    setImportResult(null);
  };

  const APP_FIELDS = [
    { key: '', label: '-- Skip --' },
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
    { key: 'biztype', label: 'Business Type' },
    { key: 'channel', label: 'Channel' },
    { key: 'status', label: 'Status' },
    { key: 'value', label: 'Value' },
    { key: 'notes', label: 'Notes' },
    { key: 'followupDate', label: 'Follow Up Date' },
  ];

  const kanbanGroups = {
    'new': leads.filter(l => ['New', 'Contacted'].includes(l.status)),
    'replied': leads.filter(l => ['Replied', 'Call Booked'].includes(l.status)),
    'proposal': leads.filter(l => l.status === 'Proposal Sent'),
    'closed': leads.filter(l => l.status === 'Closed'),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Leads</h1>
          <p className="text-muted-2 text-sm">Manage your potential clients and track progress</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-background-2 border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={cn("px-3 py-1.5 text-sm", view === 'table' ? "bg-background-3 text-text" : "text-muted-2")}
            >
              Table
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn("px-3 py-1.5 text-sm", view === 'kanban' ? "bg-background-3 text-text" : "text-muted-2")}
            >
              Kanban
            </button>
          </div>
          <button onClick={openNewModal} className="btn btn-primary">
            <Plus size={18} />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
            <Upload size={18} />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="stat-card">
          <div className="text-2xl font-heading font-bold">{stats?.total || 0}</div>
          <div className="text-xs text-muted-2">Total</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-heading font-bold text-yellow-500">{stats?.new || 0}</div>
          <div className="text-xs text-muted-2">New</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-heading font-bold text-blue-500">{stats?.contacted || 0}</div>
          <div className="text-xs text-muted-2">Contacted</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-heading font-bold text-purple-500">{stats?.replied || 0}</div>
          <div className="text-xs text-muted-2">Replied</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-heading font-bold text-orange-500">{stats?.callsBooked || 0}</div>
          <div className="text-xs text-muted-2">Calls</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-heading font-bold text-accent-green">${(stats?.revenue || 0).toLocaleString()}</div>
          <div className="text-xs text-muted-2">Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={handleSearch}
              className="input w-full pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-40"
          >
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="input w-full sm:w-40"
          >
            <option value="">All Channels</option>
            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Follow Up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      <Loader2 size={24} className="animate-spin mx-auto text-muted-2" />
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-2">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  leads.map(lead => (
                    <tr key={lead._id}>
                      <td>
                        <div className="font-medium">{lead.name}</div>
                        {lead.email && <div className="text-xs text-muted-2">{lead.email}</div>}
                      </td>
                      <td>{lead.company || '—'}</td>
                      <td>
                        <a href={`tel:${lead.phone}`} className="text-accent-green hover:underline font-mono text-sm">
                          {lead.phone}
                        </a>
                      </td>
                      <td>{lead.biztype || '—'}</td>
                      <td>
                        {lead.channel && (
                          <span className={cn("badge", channelColors[lead.channel] || 'badge-muted')}>
                            {lead.channel}
                          </span>
                        )}
                      </td>
                      <td>
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                          className={cn("badge cursor-pointer", statusColors[lead.status])}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="font-mono text-accent-green">
                        {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                      </td>
                      <td className="text-sm text-muted-2">
                        {lead.followupDate ? new Date(lead.followupDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-accent-green"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-text"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(lead._id)}
                            className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-danger"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-2">
                Showing {((pagination.page - 1) * 20) + 1} - {Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
              </div>
              <div className="flex gap-2">
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => fetchLeads({ page: i + 1, search, status: statusFilter, channel: channelFilter })}
                    className={cn(
                      "px-3 py-1 rounded text-sm",
                      pagination.page === i + 1 ? "bg-accent-purple text-white" : "bg-background-3 text-muted-2"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KanbanColumn
            title="New / Contacted"
            color="yellow"
            leads={kanbanGroups.new}
            onEdit={openEditModal}
          />
          <KanbanColumn
            title="Replied / Call"
            color="purple"
            leads={kanbanGroups.replied}
            onEdit={openEditModal}
          />
          <KanbanColumn
            title="Proposal Sent"
            color="orange"
            leads={kanbanGroups.proposal}
            onEdit={openEditModal}
          />
          <KanbanColumn
            title="Closed / Won"
            color="green"
            leads={kanbanGroups.closed}
            onEdit={openEditModal}
          />
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-heading text-xl font-bold">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h2>
            </div>
            <form onSubmit={handleSaveLead}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Name *</label>
                    <input name="name" defaultValue={editingLead?.name} required className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Company</label>
                    <input name="company" defaultValue={editingLead?.company} className="input w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Phone *</label>
                    <input name="phone" defaultValue={editingLead?.phone} required className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Email</label>
                    <input name="email" type="email" defaultValue={editingLead?.email} className="input w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Business Type</label>
                    <select name="biztype" defaultValue={editingLead?.biztype} className="input w-full">
                      <option value="">Select...</option>
                      {BIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Channel</label>
                    <select name="channel" defaultValue={editingLead?.channel} className="input w-full">
                      <option value="">Select...</option>
                      {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Status</label>
                    <select name="status" defaultValue={editingLead?.status || 'New'} className="input w-full">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Value ($)</label>
                    <input name="value" type="number" defaultValue={editingLead?.value} className="input w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Website</label>
                  <input name="website" defaultValue={editingLead?.website} className="input w-full" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Follow Up Date</label>
                  <input name="followupDate" type="date" defaultValue={editingLead?.followupDate?.split('T')[0]} className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Notes</label>
                  <textarea name="notes" defaultValue={editingLead?.notes} className="input w-full h-20" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLead ? 'Update' : 'Create'} Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={resetImport}>
          <div className="modal max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-accent-green" />
                Import Leads
              </h2>
              <button onClick={resetImport} className="p-1 hover:bg-background-3 rounded transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {importStep === 'upload' && (
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-border-2 rounded-xl p-8 text-center cursor-pointer hover:border-accent-purple transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv,.xlsx,.xls" 
                      className="hidden"
                      onChange={handleImportFile}
                    />
                    <Upload size={40} className="mx-auto mb-3 text-muted-2" />
                    <p className="text-lg font-medium mb-1">Drop your CSV or Excel file here</p>
                    <p className="text-sm text-muted-2">or click to browse</p>
                  </div>
                  <p className="text-xs text-muted-2 text-center">
                    Supported formats: CSV, XLSX, XLS
                  </p>
                </div>
              )}

              {importStep === 'mapping' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-2">
                      {importData?.length || 0} rows detected
                    </span>
                    <span className="text-accent-green flex items-center gap-1">
                      <Check size={14} /> Auto-mapped
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-background-3 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-mono text-xs text-muted-2">File Column</th>
                          <th className="text-left p-2 font-mono text-xs text-muted-2">Map to</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileHeaders.map((header) => (
                          <tr key={header} className="border-t border-border">
                            <td className="p-2 font-medium">{header}</td>
                            <td className="p-2">
                              <select
                                value={headerMapping[header] || ''}
                                onChange={(e) => handleMappingChange(header, e.target.value)}
                                className="input w-full text-sm"
                              >
                                {APP_FIELDS.map(field => (
                                  <option key={field.key} value={field.key}>{field.label}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importStep === 'done' && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-accent-green" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2">Import Complete!</h3>
                  <p className="text-muted-2 mb-4">
                    Successfully imported <span className="text-accent-green font-bold">{importResult?.imported || 0}</span> leads
                  </p>
                  {importResult?.errors?.length > 0 && (
                    <div className="text-left bg-danger/10 border border-danger/20 rounded-lg p-3 mb-4">
                      <p className="text-danger text-sm font-medium mb-2">Skipped {importResult.errors.length} rows:</p>
                      {importResult.errors.slice(0, 3).map((err, i) => (
                        <p key={i} className="text-xs text-muted-2">Row {err.row}: {err.errors.join(', ')}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              {importStep === 'mapping' && (
                <>
                  <button 
                    onClick={() => setImportStep('upload')}
                    className="btn btn-ghost"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="btn btn-primary"
                  >
                    {importing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Import {importData?.length || 0} Leads
                      </>
                    )}
                  </button>
                </>
              )}
              {importStep === 'done' && (
                <button onClick={resetImport} className="btn btn-primary">
                  Done
                </button>
              )}
              {importStep === 'upload' && (
                <button onClick={resetImport} className="btn btn-ghost">
                  Cancel
                </button>
              )}
            </div>

            {importing && importStep !== 'done' && (
              <div className="absolute inset-0 bg-background-2/80 flex items-center justify-center rounded-xl z-10">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin mx-auto mb-2 text-accent-purple" />
                  <p className="text-sm text-muted-2">Processing...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This will remove all associated history and data. This action cannot be undone."
        confirmText="Delete Lead"
        isLoading={isDeleting}
      />
    </div>
  );
}

function KanbanColumn({ title, color, leads, onEdit }) {
  const colors = {
    yellow: 'text-yellow-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    green: 'text-green-500',
  };

  return (
    <div className="kanban-column">
      <div className="flex items-center justify-between mb-3">
        <span className={`font-heading font-bold ${colors[color]}`}>{title}</span>
        <span className="font-mono text-xs text-muted-2 bg-background-3 px-2 py-0.5 rounded">
          {leads.length}
        </span>
      </div>
      {leads.length === 0 ? (
        <div className="text-center py-8 text-muted-2 text-sm">Empty</div>
      ) : (
        leads.map(lead => (
          <div key={lead._id} className="kanban-card" onClick={() => onEdit(lead)}>
            <div className="font-medium text-sm">{lead.name}</div>
            <div className="text-xs text-muted-2 mt-0.5">{lead.company}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-mono text-accent-green">
                {lead.value ? `$${lead.value.toLocaleString()}` : ''}
              </span>
              {lead.channel && (
                <span className="text-xs text-muted-2">{lead.channel}</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
