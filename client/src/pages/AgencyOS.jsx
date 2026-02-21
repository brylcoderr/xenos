import { useEffect, useState } from 'react';
import { templates as templatesApi } from '../lib/api';
import { useAuthStore } from '../store';
import { BookOpen, FileText, Settings, Rocket, Terminal, ChevronRight, Loader2 } from 'lucide-react';

export default function AgencyOS() {
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { templates } = await templatesApi.getAll({ type: 'Internal Resource' });
      setResources(templates);
      if (templates.length > 0) setSelectedResource(templates[0]);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { user } = useAuthStore();

  const replaceVariables = (html) => {
    if (!html) return '';
    let processed = html;
    
    const variables = {
      your_name: user?.name || 'Agent',
      agency_name: 'Xenotrix',
      date: new Date().toLocaleDateString()
    };

    processed = processed.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
      const key = p1.trim();
      return variables[key] || match;
    });

    return processed;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-accent-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Agency Roadmap & OS</h1>
          <p className="text-muted-2">Your complete execution playbook for scaling Xenotrix.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {resources.map((res) => (
            <button
              key={res._id}
              onClick={() => setSelectedResource(res)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                selectedResource?._id === res._id
                  ? 'bg-accent-purple/10 border border-accent-purple/30 text-accent-purple shadow-lg shadow-accent-purple/5'
                  : 'bg-background-2 border border-background-3 text-muted-2 hover:bg-background-3'
              }`}
            >
              {res.name.includes('Roadmap') ? <Rocket size={18} /> : 
               res.name.includes('Cold Call') ? <Terminal size={18} /> : 
               res.name.includes('Automation') ? <Settings size={18} /> : <FileText size={18} />}
              <span className="font-medium text-sm text-left">{res.name}</span>
              <ChevronRight size={14} className="ml-auto opacity-50" />
            </button>
          ))}
          
          <div className="p-4 bg-background-3/50 rounded-xl border border-background-3 mt-8">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-2 mb-2">Agency Support</h4>
            <p className="text-xs text-muted-2 leading-relaxed">
              These systems are designed to be deployed in 7 days. Follow the roadmap in order.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {selectedResource ? (
            <div className="card bg-white overflow-hidden" style={{ minHeight: '800px', height: '80vh' }}>
              <iframe
                srcDoc={replaceVariables(selectedResource.htmlContent)}
                className="w-full h-full border-none"
                title={selectedResource.name}
              />
            </div>
          ) : (
            <div className="card p-12 text-center bg-background-2 border-dashed border-2 border-background-3">
              <BookOpen size={48} className="mx-auto mb-4 text-muted-2 opacity-20" />
              <h3 className="text-lg font-heading font-bold text-muted-2">Select a resource to begin</h3>
              <p className="text-sm text-muted-2 mt-2">Pick a guide from the sidebar to view the playbook.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
