import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clients } from '../lib/api';
import { ArrowLeft, Building, Mail, Phone, Globe, DollarSign, FolderKanban, FileText, Clock } from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await clients.getOne(id);
        setClient(data.client);
        setProjects(data.projects || []);
        setInvoices(data.invoices || []);
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-8 text-muted-2">Loading...</div>;
  if (!client) return <div className="text-center py-8 text-muted-2">Client not found</div>;

  return (
    <div className="space-y-6">
      <a href="/clients" className="inline-flex items-center gap-2 text-muted-2 hover:text-text">
        <ArrowLeft size={18} /> Back to Clients
      </a>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-heading text-2xl font-bold">{client.name}</h1>
                <p className="text-muted-2">{client.company}</p>
              </div>
              <span className={`badge ${
                client.status === 'Active' ? 'badge-green' :
                client.status === 'Onboarding' ? 'badge-orange' : 'badge-muted'
              }`}>
                {client.status}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background-3 text-muted-2">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="text-xs text-muted-2">Email</div>
                  <div className="text-sm">{client.email}</div>
                </div>
              </div>
              {client.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background-3 text-muted-2">
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-2">Phone</div>
                    <div className="text-sm">{client.phone}</div>
                  </div>
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background-3 text-muted-2">
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-2">Website</div>
                    <div className="text-sm">{client.website}</div>
                  </div>
                </div>
              )}
              {client.industry && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background-3 text-muted-2">
                    <Building size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-2">Industry</div>
                    <div className="text-sm">{client.industry}</div>
                  </div>
                </div>
              )}
            </div>

            {client.notes && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-xs font-mono uppercase text-muted-2 mb-2">Notes</div>
                <p className="text-sm">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-heading font-bold">Projects</h2>
              <a href={`/projects?new=true&client=${id}`} className="text-sm text-accent-purple hover:underline">+ New</a>
            </div>
            <div className="divide-y divide-border">
              {projects.length === 0 ? (
                <div className="p-8 text-center text-muted-2">No projects yet</div>
              ) : (
                projects.map(project => (
                  <a key={project._id} href={`/projects/${project._id}`} className="block p-4 hover:bg-background-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-muted-2">{project.description}</div>
                      </div>
                      <span className={`badge ${
                        project.status === 'Completed' ? 'badge-green' :
                        project.status === 'Development' ? 'badge-purple' : 'badge-orange'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card p-4">
            <h3 className="font-heading font-bold mb-4">Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-2 text-sm">Deal Value</span>
                <span className="font-mono text-accent-green">${(client.dealValue || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-2 text-sm">Projects</span>
                <span className="font-mono">{projects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-2 text-sm">Invoices</span>
                <span className="font-mono">{invoices.length}</span>
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="card">
            <div className="p-4 border-b border-border">
              <h3 className="font-heading font-bold">Invoices</h3>
            </div>
            <div className="divide-y divide-border">
              {invoices.slice(0, 5).map(invoice => (
                <a key={invoice._id} href={`/invoices?id=${invoice._id}`} className="block p-4 hover:bg-background-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm">{invoice.invoiceNumber}</span>
                    <span className="text-sm font-mono text-accent-green">${(invoice.total || 0).toLocaleString()}</span>
                  </div>
                  <span className={`badge text-xs ${
                    invoice.status === 'Paid' ? 'badge-green' :
                    invoice.status === 'Sent' ? 'badge-blue' : 'badge-yellow'
                  }`}>
                    {invoice.status}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
