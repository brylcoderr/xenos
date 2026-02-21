import { useEffect, useState } from 'react';
import { useProjectStore, useClientStore } from '../store';
import { Link } from 'react-router-dom';
import { Search, Plus, Loader2, FolderKanban, ArrowRight, CheckCircle, Clock, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const STATUSES = ['Lead', 'Proposal', 'Agreement', 'Onboarding', 'Development', 'Delivery', 'Handoff', 'Completed'];
const STATUS_COLORS = {
  'Lead': 'badge-yellow',
  'Proposal': 'badge-purple',
  'Agreement': 'badge-blue',
  'Onboarding': 'badge-orange',
  'Development': 'badge-purple',
  'Delivery': 'badge-orange',
  'Handoff': 'badge-blue',
  'Completed': 'badge-green',
};

export default function Projects() {
  const { projects, pagination, isLoading, fetchProjects, createProject, updateProject, deleteProject } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProjects({ search, status: statusFilter });
    fetchClients({ limit: 100 });
  }, [search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await createProject({
      name: formData.get('name'),
      description: formData.get('description'),
      clientId: formData.get('clientId'),
      status: formData.get('status'),
      budget: parseFloat(formData.get('budget')) || 0,
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
    });
    setShowModal(false);
  };

  const getStatusIndex = (status) => STATUSES.indexOf(status);
  const canAdvance = (status) => status !== 'Completed';

  const handleAdvance = async (projectId, currentStatus) => {
    const nextIndex = getStatusIndex(currentStatus) + 1;
    if (nextIndex < STATUSES.length) {
      await updateProject(projectId, { status: STATUSES[nextIndex] });
      fetchProjects({ search, status: statusFilter });
    }
  };

  const handleDelete = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteId);
      setDeleteId(null);
      fetchProjects({ search, status: statusFilter });
    } catch (error) {
      alert('Failed to delete project: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Projects</h1>
          <p className="text-muted-2 text-sm">Track and manage your projects</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Workflow Progress */}
      <div className="card p-4 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-[600px]">
          {STATUSES.map((status, index) => (
            <div key={status} className="flex items-center flex-1">
              <div className={`
                w-24 py-2 px-3 rounded-lg text-center text-xs font-mono
                ${projects.some(p => p.status === status) ? 'bg-accent-purple/20 text-accent-purple' : 'bg-background-3 text-muted-2'}
              `}>
                {status}
              </div>
              {index < STATUSES.length - 1 && (
                <ArrowRight size={16} className="text-muted mx-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <Loader2 size={24} className="animate-spin mx-auto text-muted-2" />
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-2">No projects found</div>
        ) : (
          projects.map(project => (
            <Link key={project._id} to={`/projects/${project._id}`} className="card p-4 hover:border-accent-purple transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-heading font-bold line-clamp-1">{project.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`badge ${STATUS_COLORS[project.status]}`}>{project.status}</span>
                  <button 
                    onClick={(e) => handleDelete(project._id, e)}
                    className="p-1 hover:bg-background-3 rounded text-muted-2 hover:text-danger transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-2 mb-3 line-clamp-2">{project.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-2">{project.client?.name}</span>
                {project.budget && (
                  <span className="font-mono text-accent-green">${project.budget.toLocaleString()}</span>
                )}
              </div>
              {project.progress > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-2 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-heading text-xl font-bold">New Project</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Project Name *</label>
                  <input name="name" required className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Client *</label>
                  <select name="clientId" required className="input w-full">
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name} - {c.company}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Description</label>
                  <textarea name="description" className="input w-full h-20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Status</label>
                    <select name="status" defaultValue="Lead" className="input w-full">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Budget ($)</label>
                    <input name="budget" type="number" className="input w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Start Date</label>
                    <input name="startDate" type="date" className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">End Date</label>
                    <input name="endDate" type="date" className="input w-full" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will remove all associated tasks and activity logs. This action cannot be undone."
        confirmText="Delete Project"
        isLoading={isDeleting}
      />
    </div>
  );
}
