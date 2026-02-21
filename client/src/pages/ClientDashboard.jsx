import { useEffect, useState } from 'react';
import { dashboard, projects, invoices, documents } from '../lib/api';
import { 
  FileText, CreditCard, Clock, CheckCircle, 
  ArrowRight, ExternalLink, Download, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
  const [data, setData] = useState({
    activeProjects: [],
    pendingInvoices: [],
    recentDocuments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientData() {
      try {
        const [projRes, invRes, docRes] = await Promise.all([
          projects.getAll({ status: 'active' }), // In real app, filter by client ID on backend
          invoices.getAll({ status: 'Sent' }),
          documents.getAll({ limit: 5 })
        ]);

        setData({
          activeProjects: projRes.projects || [],
          pendingInvoices: invRes.invoices || [],
          recentDocuments: docRes.documents || []
        });
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchClientData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 size={32} className="animate-spin text-accent-purple" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-heading font-bold">Welcome back!</h1>
        <p className="text-muted-2 mt-1">Here's what's happening with your projects.</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-mono uppercase text-muted-3 tracking-widest flex items-center gap-2">
            <Clock size={16} /> Active Projects
          </h2>
          {data.activeProjects.length === 0 ? (
            <div className="card p-8 text-center text-muted-2 italic">
              No active projects at the moment.
            </div>
          ) : (
            data.activeProjects.map(project => (
              <div key={project._id} className="card p-6 group hover:border-accent-purple/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold font-heading">{project.name}</h3>
                    <div className="text-xs text-muted-2 mt-1 uppercase tracking-wider">{project.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-accent-purple">{project.progress || 0}%</div>
                    <div className="text-[10px] text-muted-3 font-mono">PROGRESS</div>
                  </div>
                </div>
                <div className="h-1.5 bg-background-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-purple transition-all duration-1000" 
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
                <div className="mt-6 flex gap-3">
                  <Link to={`/projects/${project._id}`} className="btn btn-primary btn-sm">
                    View Project <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar: Invoices & Documents */}
        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-sm font-mono uppercase text-muted-3 tracking-widest flex items-center gap-2">
              <CreditCard size={16} /> Pending Invoices
            </h2>
            <div className="space-y-3">
              {data.pendingInvoices.length === 0 ? (
                <div className="text-xs text-muted-3 italic bg-background-2 p-4 rounded-lg">No pending invoices.</div>
              ) : (
                data.pendingInvoices.map(invoice => (
                  <div key={invoice._id} className="card p-4 flex justify-between items-center bg-accent-purple/[0.03]">
                    <div>
                      <div className="text-sm font-bold font-mono">{invoice.invoiceNumber}</div>
                      <div className="text-[10px] text-muted-3">Due {new Date(invoice.dueDate).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-accent-green">${invoice.total.toLocaleString()}</div>
                      <button className="text-[10px] text-accent-purple font-bold hover:underline">Pay Now</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-mono uppercase text-muted-3 tracking-widest flex items-center gap-2">
              <FileText size={16} /> Shared Files
            </h2>
            <div className="card divide-y divide-white/5">
              {data.recentDocuments.length === 0 ? (
                <div className="p-4 text-xs text-muted-3 italic">No shared documents yet.</div>
              ) : (
                data.recentDocuments.map(doc => (
                  <Link key={doc._id} to={`/documents/${doc._id}`} className="block p-3 hover:bg-white/[0.02] group">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate group-hover:text-accent-purple transition-colors">
                          {doc.title || doc.name}
                        </div>
                        <div className="text-[10px] text-muted-3 font-mono">{new Date(doc.updatedAt).toLocaleDateString()}</div>
                      </div>
                      <Download size={14} className="text-muted-3" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
