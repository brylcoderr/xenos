import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Documents from './pages/Documents';
import Templates from './pages/Templates';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import ClientDetail from './pages/ClientDetail';
import ProjectDetail from './pages/ProjectDetail';
import DocumentEditorPage from './pages/DocumentEditorPage.jsx';
import DocumentPreviewPage from './pages/DocumentPreviewPage.jsx';
import PublicDocumentView from './pages/PublicDocumentView.jsx';
import ClientDashboard from './pages/ClientDashboard.jsx';
import AgencyOS from './pages/AgencyOS.jsx';
import DailyTasks from './pages/DailyTasks.jsx';
import { useEffect } from 'react';

function Home() {
  const { user } = useAuthStore();
  if (user?.role === 'client') {
    return <ClientDashboard />;
  }
  return <Dashboard />;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-accent-purple font-heading text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // Load saved brand color
    const savedColor = localStorage.getItem('brandColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--brand-color', savedColor);
    }
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-accent-purple font-heading text-xl">XENOTRIX</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/shared/:token" element={<PublicDocumentView />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="leads" element={<Leads />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="documents" element={<Documents />} />
          <Route path="documents/:id/edit" element={<DocumentEditorPage />} />
          <Route path="documents/:id/preview" element={<DocumentPreviewPage />} />
          <Route path="templates" element={<Templates />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="agency-os" element={<AgencyOS />} />
          <Route path="daily-tasks" element={<DailyTasks />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
