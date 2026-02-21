import { useEffect, useState } from 'react';
import { useInvoiceStore, useClientStore } from '../store';
import { Search, Plus, DollarSign, Download, Send, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const STATUSES = ['Draft', 'Pending', 'Sent', 'Viewed', 'Paid', 'Overdue', 'Cancelled'];
const STATUS_COLORS = {
  'Draft': 'badge-muted', 'Pending': 'badge-yellow', 'Sent': 'badge-blue',
  'Viewed': 'badge-purple', 'Paid': 'badge-green', 'Overdue': 'badge-danger', 'Cancelled': 'badge-muted'
};

export default function Invoices() {
  const { 
    invoices, stats, pagination, isLoading, 
    fetchInvoices, fetchStats, createInvoice, updateInvoice, deleteInvoice 
  } = useInvoiceStore();
  const { clients, fetchClients } = useClientStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices({ search, status: statusFilter });
    fetchStats();
    fetchClients({ limit: 100 });
  }, [search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const items = [
      { description: formData.get('description'), quantity: 1, rate: parseFloat(formData.get('rate')) || 0, amount: parseFloat(formData.get('rate')) || 0 }
    ];
    await createInvoice({
      client: formData.get('clientId'),
      type: formData.get('type'),
      items,
      dueDate: formData.get('dueDate') || null,
      notes: formData.get('notes'),
    });
    setShowModal(false);
    fetchStats();
  };

  const handleSend = async (id) => {
    try {
      const { invoices: api } = await import('../lib/api');
      await api.send(id);
      fetchInvoices({ search, status: statusFilter });
      fetchStats();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      const { invoices: api } = await import('../lib/api');
      await api.markPaid(id);
      fetchInvoices({ search, status: statusFilter });
      fetchStats();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleExportPdf = async (id, number) => {
    try {
      const { invoices: api } = await import('../lib/api');
      await api.exportPdf(id, `${number}.pdf`);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteInvoice(deleteId);
      fetchStats();
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
          <h1 className="font-heading text-2xl font-bold">Invoices</h1>
          <p className="text-muted-2 text-sm">Manage your invoices and payments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="text-2xl font-heading font-bold text-accent-green">
            ${(stats?.paidAmount || 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted-2">Paid</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-heading font-bold text-accent-yellow">
            ${(stats?.pendingAmount || 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted-2">Pending</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-heading font-bold text-danger">
            {stats?.overdue || 0}
          </div>
          <div className="text-xs text-muted-2">Overdue</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-heading font-bold">
            {stats?.total || 0}
          </div>
          <div className="text-xs text-muted-2">Total Invoices</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              type="text"
              placeholder="Search invoices..."
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

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <Loader2 size={24} className="animate-spin mx-auto text-muted-2" />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-2">No invoices found</td>
                </tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice._id}>
                    <td className="font-mono">{invoice.invoiceNumber}</td>
                    <td>{invoice.client?.name}</td>
                    <td>{invoice.type}</td>
                    <td className="font-mono text-accent-green">${(invoice.total || 0).toLocaleString()}</td>
                    <td>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[invoice.status]}`}>{invoice.status}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {invoice.status === 'Draft' && (
                          <button onClick={() => handleSend(invoice._id)} className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-accent-blue" title="Send">
                            <Send size={14} />
                          </button>
                        )}
                        {(invoice.status === 'Sent' || invoice.status === 'Pending') && (
                          <button onClick={() => handleMarkPaid(invoice._id)} className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-accent-green" title="Mark Paid">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button onClick={() => handleExportPdf(invoice._id, invoice.invoiceNumber)} className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-accent-purple" title="Download PDF">
                          <Download size={14} />
                        </button>
                        <button onClick={() => handleDelete(invoice._id)} className="p-1.5 hover:bg-background-3 rounded text-muted-2 hover:text-danger" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-heading text-xl font-bold">New Invoice</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Client *</label>
                  <select name="clientId" required className="input w-full">
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name} - {c.company}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Type</label>
                    <select name="type" className="input w-full">
                      <option value="Custom">Custom</option>
                      <option value="Deposit">Deposit</option>
                      <option value="Milestone">Milestone</option>
                      <option value="Final">Final</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Due Date</label>
                    <input name="dueDate" type="date" className="input w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Description</label>
                    <input name="description" className="input w-full" placeholder="Service description" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Amount ($)</label>
                    <input name="rate" type="number" className="input w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Notes</label>
                  <textarea name="notes" className="input w-full h-20" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
