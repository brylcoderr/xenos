import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStore } from '../store';
import { 
  Users, 
  FolderKanban, 
  DollarSign, 
  FileText, 
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function ActivitySidebar({ isOpen, onHide }) {
  const { activity, fetchActivity } = useDashboardStore();

  useEffect(() => {
    fetchActivity();
    // Refresh every minute
    const interval = setInterval(fetchActivity, 60000);
    return () => clearInterval(interval);
  }, []);

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
    <aside className={cn(
      "hidden xl:flex flex-col bg-background-2 border-l border-border h-screen sticky top-0 overflow-hidden shadow-2xl sidebar-transition shrink-0",
      isOpen ? "w-80 opacity-100" : "w-0 opacity-0 border-l-0"
    )}>
      <div className="h-14 flex items-center px-6 border-b border-border justify-between bg-white/[0.02] shrink-0 min-w-[320px]">
        <h2 className="font-heading font-bold text-xs tracking-widest uppercase text-muted-3">Recent Activity</h2>
        <button 
          onClick={onHide}
          className="text-[10px] text-muted-3 hover:text-danger hover:bg-danger/10 px-2 py-1 rounded transition-all font-mono font-bold"
        >
          HIDE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background-2 min-w-[320px]">
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <Clock size={24} className="text-muted-3 mb-2 opacity-20" />
            <p className="text-xs text-muted-3 italic">No recent activity detected</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {activity.slice(0, 15).map((item, index) => (
              <div 
                key={item._id || index}
                className="p-5 hover:bg-white/[0.02] transition-all duration-300 group cursor-default"
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-xl bg-background-1 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-accent-purple/30 transition-all duration-500", 
                    getActivityColor(item.type)
                  )}>
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-1 leading-relaxed group-hover:text-text transition-colors">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] text-muted-3 font-mono flex items-center gap-1.5 opacity-60">
                        <Clock size={10} /> {formatTimeAgo(item.createdAt)}
                      </p>
                      <ArrowUpRight size={10} className="text-accent-purple opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border bg-background-1 shadow-[0_-10px_20px_rgba(0,0,0,0.2)] shrink-0 min-w-[320px]">
        <div className="rounded-2xl bg-gradient-to-br from-accent-purple/10 via-accent-blue/5 to-transparent border border-white/5 p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-accent-purple/10 rounded-full blur-2xl group-hover:bg-accent-purple/20 transition-all duration-700"></div>
          <div className="flex items-center gap-2 mb-2 text-accent-purple">
            <Users size={14} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest ont-heading">System Insight</span>
          </div>
          <p className="text-[10px] text-muted-2 leading-relaxed font-medium">
            Your agency is currently tracking <span className="text-text font-bold">{activity.length}</span> activities this week.
          </p>
        </div>
      </div>
    </aside>
  );
}
