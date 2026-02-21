import { useEffect, useState } from 'react';
import { useClientStore } from '../store';
import { Link } from 'react-router-dom';
import { Search, Plus, Loader2, Building, Mail, Phone, DollarSign, Trash2, Edit } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const STATUSES = ['Active', 'Inactive', 'Onboarding', 'Completed', 'Churned'];

export default function Clients() {
  const { clients, pagination, isLoading, fetchClients, createClient, updateClient, deleteClient } = useClientStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchClients({ search, status: statusFilter });
  }, [search, statusFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      company: formData.get('company'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      website: formData.get('website'),
      industry: formData.get('industry'),
      status: formData.get('status'),
      dealValue: parseFloat(formData.get('dealValue')) || 0,
      notes: formData.get('notes'),
    };

    if (editingClient) {
      await updateClient(editingClient._id, data);
    } else {
      await createClient(data);
    }
    setShowModal(false);
    setEditingClient(null);
  };

  const openEdit = (client, e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingClient(client);
    setShowModal(true);
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
      await deleteClient(deleteId);
      setDeleteId(null);
    } catch (error) {
      alert('Failed to delete client: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Clients</h1>
          <p className="text-muted-2 text-sm">Manage your client relationships</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Add Client
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              type="text"
              placeholder="Search clients..."
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
        ) : clients.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-2">No clients found</div>
        ) : (
          clients.map(client => (
            <Link key={client._id} to={`/clients/${client._id}`} className="card p-4 hover:border-accent-purple transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading font-bold">{client.name}</h3>
                  <p className="text-sm text-muted-2">{client.company}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => openEdit(client, e)}
                    className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-accent-purple transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(client._id, e)}
                    className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-danger transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-2">
                  <Mail size={14} /> {client.email}
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-muted-2">
                    <Phone size={14} /> {client.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-accent-green">
                  <DollarSign size={14} /> ${(client.dealValue || 0).toLocaleString()}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-2">
                <span>{client.projectCount || 0} projects</span>
                <span>{client.invoiceCount || 0} invoices</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-heading text-xl font-bold">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Contact Name *</label>
                    <input name="name" defaultValue={editingClient?.name} required className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Company</label>
                    <input name="company" defaultValue={editingClient?.company} className="input w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Email *</label>
                    <input name="email" type="email" defaultValue={editingClient?.email} required className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Phone</label>
                    <input name="phone" defaultValue={editingClient?.phone} className="input w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Address</label>
                  <input name="address" defaultValue={editingClient?.address} className="input w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Website</label>
                    <input name="website" defaultValue={editingClient?.website} className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Industry</label>
                    <input name="industry" defaultValue={editingClient?.industry} className="input w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Status</label>
                    <select name="status" defaultValue={editingClient?.status || 'Active'} className="input w-full">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Deal Value ($)</label>
                    <input name="dealValue" type="number" defaultValue={editingClient?.dealValue} className="input w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Notes</label>
                  <textarea name="notes" defaultValue={editingClient?.notes} className="input w-full h-20" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingClient ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? This will remove all associated projects and invoices. This action cannot be undone."
        confirmText="Delete Client"
        isLoading={isDeleting}
      />
    </div>
  );
}
