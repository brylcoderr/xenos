import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FolderKanban, 
  FileText, 
  FileStack, 
  Receipt, 
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  BookOpen,
  Clock
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import FloatingNotepad from './dashboard/FloatingNotepad';
import ActivitySidebar from './ActivitySidebar';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/leads', icon: UserPlus, label: 'Leads' },
  { path: '/clients', icon: Users, label: 'Clients' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/agency-os', icon: BookOpen, label: 'Agency OS' },
  { path: '/daily-tasks', icon: Clock, label: 'Daily Log' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/templates', icon: FileStack, label: 'Templates' },
  { path: '/invoices', icon: Receipt, label: 'Invoices' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activitySidebarVisible, setActivitySidebarVisible] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-56 bg-background-2 border-r border-border transform transition-transform duration-200 print:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-border">
            <div className="font-heading font-extrabold text-xl text-accent-purple">
              XENOTRIX
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-accent-purple/15 text-accent-purple" 
                    : "text-muted-2 hover:bg-background-3 hover:text-text"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple text-sm font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-muted-2 truncate">{user?.role || 'Team'}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-2 hover:bg-background-3 hover:text-danger transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-14 bg-background-2 border-b border-border flex items-center justify-between px-4 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-muted-2 hover:text-text"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-background-3 rounded-lg border border-border">
              <Search size={16} className="text-muted-2" />
              <input 
                type="text" 
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-48"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!activitySidebarVisible && (
              <button
                onClick={() => setActivitySidebarVisible(true)}
                className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 transition-all animate-in fade-in zoom-in"
              >
                SHOW ACTIVITY
              </button>
            )}
            <NavLink
              to="/settings"
              className="p-2 text-muted-2 hover:text-text hover:bg-background-3 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto print:p-0">
          <Outlet />
        </main>
      </div>
      
      <div className="print:hidden">
        <ActivitySidebar 
          isOpen={activitySidebarVisible} 
          onHide={() => setActivitySidebarVisible(false)} 
        />
        
        <FloatingNotepad />
      </div>
    </div>
  );
}
