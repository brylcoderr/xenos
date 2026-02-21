import { useEffect, useState } from 'react';
import { useTemplateStore } from '../store';
import { Search, Plus, Copy, Edit, Trash2, Loader2, FileStack } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const DOC_TYPES = [
  'Client Agreement', 'Welcome Document', 'Invoice', 'Client Portal Guide',
  'Project Timeline', 'Fulfilment Checklist', 'Content Usage Guide',
  'Monthly Report', 'Competition Analysis', 'Thank You Document',
  'Thank You Package', 'Proposal Template', 'Custom'
];

export default function Templates() {
  const { templates, isLoading, fetchTemplates, createTemplate, deleteTemplate } = useTemplateStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTemplates({ search, type: typeFilter });
  }, [search, typeFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await createTemplate({
      name: formData.get('name'),
      type: formData.get('type'),
      content: formData.get('content'),
      htmlContent: formData.get('content'),
      description: formData.get('description'),
      variables: formData.get('variables')?.split(',').map(v => v.trim()).filter(Boolean) || [],
    });
    setShowModal(false);
  };

  const handleDuplicate = async (templateId) => {
    try {
      const { templates: api } = await import('../lib/api');
      await api.duplicate(templateId);
      fetchTemplates({ search, type: typeFilter });
    } catch (error) {
      alert('Duplicate failed: ' + error.message);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteTemplate(deleteId);
      setDeleteId(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Templates</h1>
          <p className="text-muted-2 text-sm">Manage document templates</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> New Template
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              type="text"
              placeholder="Search templates..."
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
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <Loader2 size={24} className="animate-spin mx-auto text-muted-2" />
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-2">
            No templates found
          </div>
        ) : (
          templates.map(template => (
            <div key={template._id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent-purple/10 text-accent-purple">
                  <FileStack size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{template.name}</h3>
                  <p className="text-xs text-muted-2 mt-1">{template.type}</p>
                </div>
              </div>
              {template.description && (
                <p className="text-sm text-muted-2 mt-3 line-clamp-2">{template.description}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-2">{template.usageCount || 0} uses</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDuplicate(template._id)}
                    className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-accent-purple"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(template._id)}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-heading text-xl font-bold">New Template</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Template Name *</label>
                  <input name="name" required className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Type</label>
                  <select name="type" className="input w-full">
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Description</label>
                  <input name="description" className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Variables (comma separated)</label>
                  <input name="variables" className="input w-full" placeholder="client_name, company_name, date" />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Content</label>
                  <textarea name="content" className="input w-full h-40 font-mono text-sm" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete Template"
        isLoading={isDeleting}
      />
    </div>
  );
}
