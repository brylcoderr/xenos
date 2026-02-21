import { useEffect, useState } from 'react';
import { useDashboardStore } from '../store';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  FolderKanban, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Rocket
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const statsCards = [
  { key: 'leads', label: 'Total Leads', icon: Users, color: 'accent-purple' },
  { key: 'leads', subKey: 'revenue', label: 'Revenue', icon: DollarSign, color: 'accent-green', isSub: true },
  { key: 'clients', label: 'Active Clients', icon: TrendingUp, color: 'accent-blue' },
  { key: 'projects', label: 'Active Projects', icon: FolderKanban, color: 'accent-orange' },
  { key: 'invoices', subKey: 'paid', label: 'Paid Invoices', icon: CheckCircle, color: 'accent-green', isSub: true },
  { key: 'invoices', subKey: 'pending', label: 'Pending', icon: Clock, color: 'accent-yellow', isSub: true },
];

export default function Dashboard() {
  const { stats, activity, upcoming, fetchStats, fetchActivity, fetchUpcoming, isLoading } = useDashboardStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchActivity();
    fetchUpcoming();
    setMounted(true);
  }, []);

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const getActivityIcon = (type) => {
    if (type.includes('lead')) return <Users size={14} />;
    if (type.includes('client')) return <Users size={14} />;
    if (type.includes('project')) return <FolderKanban size={14} />;
    if (type.includes('invoice')) return <DollarSign size={14} />;
    if (type.includes('document')) return <FileText size={14} />;
    return <Clock size={14} />;
  };

  const getActivityColor = (type) => {
    if (type.includes('created')) return 'text-accent-green';
    if (type.includes('updated') || type.includes('changed')) return 'text-accent-blue';
    if (type.includes('deleted')) return 'text-danger';
    if (type.includes('paid')) return 'text-accent-green';
    return 'text-muted-2';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-2 text-sm">Welcome back! Here's your agency overview.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
          <span className="text-muted-2">Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Leads"
          value={stats?.leads?.total || 0}
          icon={Users}
          color="accent-purple"
          trend={stats?.leads?.new || 0}
          trendLabel="new"
          mounted={mounted}
        />
        <StatCard 
          label="Revenue"
          value={formatCurrency(stats?.leads?.revenue || 0)}
          icon={DollarSign}
          color="accent-green"
          trend={12}
          trendLabel="this month"
          mounted={mounted}
        />
        <StatCard 
          label="Active Clients"
          value={stats?.clients?.active || 0}
          icon={TrendingUp}
          color="accent-blue"
          subtext={`${stats?.clients?.onboarding || 0} onboarding`}
          mounted={mounted}
        />
        <StatCard 
          label="Active Projects"
          value={stats?.projects?.active || 0}
          icon={FolderKanban}
          color="accent-orange"
          subtext={`${stats?.projects?.completed || 0} completed`}
          mounted={mounted}
        />
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-2 text-xs font-mono uppercase">Paid</span>
            <CheckCircle size={16} className="text-accent-green" />
          </div>
          <div className="text-2xl font-heading font-bold text-accent-green">
            {formatCurrency(stats?.invoices?.paidAmount || 0)}
          </div>
          <div className="text-xs text-muted-2 mt-1">
            {stats?.invoices?.paid || 0} invoices
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-2 text-xs font-mono uppercase">Pending</span>
            <Clock size={16} className="text-accent-yellow" />
          </div>
          <div className="text-2xl font-heading font-bold text-accent-yellow">
            {formatCurrency(stats?.invoices?.pendingAmount || 0)}
          </div>
          <div className="text-xs text-muted-2 mt-1">
            {stats?.invoices?.pending || 0} invoices
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-2 text-xs font-mono uppercase">Overdue</span>
            <AlertCircle size={16} className="text-danger" />
          </div>
          <div className="text-2xl font-heading font-bold text-danger">
            {stats?.invoices?.overdue || 0}
          </div>
          <div className="text-xs text-muted-2 mt-1">invoices</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-2 text-xs font-mono uppercase">Project Progress</span>
            <TrendingUp size={16} className="text-accent-purple" />
          </div>
          <div className="text-2xl font-heading font-bold text-accent-purple">
            {stats?.projects?.avgProgress || 0}%
          </div>
          <div className="text-xs text-muted-2 mt-1">average</div>
        </div>
      </div>

      {/* Featured & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Playbook Card */}
        <div className="card bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 border-accent-purple/30 p-6 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Rocket size={120} className="-rotate-12" />
          </div>
          <div className="relative">
            <div className="badge-purple mb-4">Agency Growth</div>
            <h3 className="text-xl font-heading font-bold mb-2">Agency Execution Playbook</h3>
            <p className="text-muted-2 text-sm leading-relaxed max-w-[240px]">
              Access your scaling roadmap, outreach scripts, and automation guides.
            </p>
          </div>
          <Link to="/agency-os" className="btn btn-primary mt-6 w-full flex items-center justify-center gap-2 relative z-10">
            View Playbook <ArrowUpRight size={18} />
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-heading font-bold mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link to="/leads?new=true" className="p-4 rounded-xl bg-background-3 border border-border hover:border-accent-yellow transition-all group">
              <div className="p-3 rounded-lg bg-accent-yellow/10 text-accent-yellow w-fit mb-3 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <div className="font-medium text-sm">Add Lead</div>
              <div className="text-[10px] text-muted-2 uppercase font-mono mt-1">Prospecting</div>
            </Link>
            <Link to="/projects?new=true" className="p-4 rounded-xl bg-background-3 border border-border hover:border-accent-orange transition-all group">
              <div className="p-3 rounded-lg bg-accent-orange/10 text-accent-orange w-fit mb-3 group-hover:scale-110 transition-transform">
                <FolderKanban size={20} />
              </div>
              <div className="font-medium text-sm">New Project</div>
              <div className="text-[10px] text-muted-2 uppercase font-mono mt-1">Operations</div>
            </Link>
            <Link to="/documents?new=true" className="p-4 rounded-xl bg-background-3 border border-border hover:border-accent-purple transition-all group">
              <div className="p-3 rounded-lg bg-accent-purple/10 text-accent-purple w-fit mb-3 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <div className="font-medium text-sm">Document</div>
              <div className="text-[10px] text-muted-2 uppercase font-mono mt-1">Assets</div>
            </Link>
            <Link to="/invoices?new=true" className="p-4 rounded-xl bg-background-3 border border-border hover:border-accent-green transition-all group">
              <div className="p-3 rounded-lg bg-accent-green/10 text-accent-green w-fit mb-3 group-hover:scale-110 transition-transform">
                <DollarSign size={20} />
              </div>
              <div className="font-medium text-sm">Invoice</div>
              <div className="text-[10px] text-muted-2 uppercase font-mono mt-1">Billing</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Follow-ups */}
        <div className="card h-full">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-bold flex items-center gap-2">
              <Clock size={18} className="text-accent-orange" />
              Upcoming Follow-ups
            </h2>
          </div>
          <div className="p-4 space-y-3 flex-1">
            {upcoming?.followUps?.length === 0 ? (
              <p className="text-sm text-muted-2">No upcoming follow-ups</p>
            ) : (
              upcoming?.followUps?.map((lead) => (
                <Link
                  key={lead._id}
                  to={`/leads?id=${lead._id}`}
                  className="block p-4 rounded-xl bg-background-3 hover:bg-background-4 border border-border/50 hover:border-accent-orange/30 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold group-hover:text-accent-orange transition-colors">{lead.name}</div>
                      <div className="text-xs text-muted-2 mt-0.5">{lead.company}</div>
                    </div>
                    {lead.followupDate && (
                      <div className="text-[10px] font-mono bg-accent-orange/10 text-accent-orange px-2 py-1 rounded-md">
                        {new Date(lead.followupDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Invoices */}
        <div className="card h-full">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-bold flex items-center gap-2">
              <DollarSign size={18} className="text-accent-yellow" />
              Pending Payments
            </h2>
          </div>
          <div className="p-4 space-y-3 flex-1">
            {upcoming?.upcomingInvoices?.length === 0 ? (
              <p className="text-sm text-muted-2">No pending payments</p>
            ) : (
              upcoming?.upcomingInvoices?.map((invoice) => (
                <Link
                  key={invoice._id}
                  to={`/invoices?id=${invoice._id}`}
                  className="block p-4 rounded-xl bg-background-3 hover:bg-background-4 border border-border/50 hover:border-accent-yellow/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold font-mono text-muted-1 group-hover:text-text">{invoice.invoiceNumber}</span>
                    <span className="text-sm font-bold text-accent-green">
                      {formatCurrency(invoice.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-2">
                      {invoice.client?.name}
                    </div>
                    {invoice.dueDate && (
                      <div className="text-[10px] text-muted-3">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, trend, trendLabel, subtext, mounted }) {
  return (
    <div className={cn(
      "stat-card transition-all duration-500",
      mounted && "animate-fade-in"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-2 text-xs font-mono uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg bg-${color}/10`}>
          <Icon size={18} className={`text-${color}`} />
        </div>
      </div>
      <div className={`stat-number text-${color}`}>
        {mounted ? value : '—'}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          <span className={trend >= 0 ? "text-accent-green" : "text-danger"}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          </span>
          <span className="text-muted-2">{trendLabel}</span>
        </div>
      )}
      {subtext && (
        <div className="text-xs text-muted-2 mt-2">{subtext}</div>
      )}
    </div>
  );
}
