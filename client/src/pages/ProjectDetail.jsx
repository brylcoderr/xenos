import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projects as projectsApi, workflows } from '../lib/api';
import { 
  ArrowLeft, ArrowRight, CheckCircle, Clock, FileText, Plus, 
  Loader2, Calendar, Target, ListTodo, MoreVertical, Trash2
} from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const STATUSES = ['Lead', 'Proposal', 'Agreement', 'Onboarding', 'Development', 'Delivery', 'Handoff', 'Completed'];
const STATUS_COLORS = {
  'Lead': 'badge-yellow', 'Proposal': 'badge-purple', 'Agreement': 'badge-blue',
  'Onboarding': 'badge-orange', 'Development': 'badge-purple', 'Delivery': 'badge-orange',
  'Handoff': 'badge-blue', 'Completed': 'badge-green',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' });
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  const fetchData = async () => {
    try {
      const data = await projectsApi.getOne(id);
      setProject(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAdvance = () => {
    setShowAdvanceModal(true);
  };

  const confirmAdvance = async () => {
    setShowAdvanceModal(false);
    setAdvancing(true);
    try {
      const result = await workflows.advance('project', id);
      fetchData();
      if (result.generatedDocuments?.length > 0) {
        alert(`Advanced! Generated ${result.generatedDocuments.length} documents.`);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setAdvancing(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await projectsApi.addTask(id, newTask);
      setNewTask({ title: '', description: '', dueDate: '' });
      setShowAddTask(false);
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await projectsApi.updateTask(id, taskId, { status: nextStatus });
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 size={32} className="animate-spin text-accent-purple" />
    </div>
  );
  if (!project) return <div className="text-center py-8 text-muted-2">Project not found</div>;

  const currentIndex = STATUSES.indexOf(project.status);
  const canAdvance = currentIndex < STATUSES.length - 1;

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-muted-2 hover:text-text transition-colors">
        <ArrowLeft size={18} /> Back to Projects
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-white to-muted-2 bg-clip-text text-transparent">
                  {project.name}
                </h1>
                <p className="text-muted-2 flex items-center gap-2 mt-1">
                  <Target size={14} /> {project.client?.name} · {project.client?.company}
                </p>
              </div>
              <span className={`badge ${STATUS_COLORS[project.status]} px-3 py-1 text-xs uppercase tracking-wider`}>
                {project.status}
              </span>
            </div>
            <p className="text-sm text-muted-1 max-w-2xl leading-relaxed mb-8">{project.description}</p>

            {/* Workflow Progress Bar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-muted-2">
                <span>Current Stage: {project.status}</span>
                <span>{Math.round(((currentIndex + 1) / STATUSES.length) * 100)}% Lifecycle</span>
              </div>
              <div className="h-1.5 bg-background-3 rounded-full overflow-hidden flex">
                {STATUSES.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-full border-r border-background-1 flex-1 transition-all duration-500 
                      ${i <= currentIndex ? 'bg-accent-purple shadow-[0_0_10px_rgba(155,124,255,0.4)]' : 'bg-background-3'}`}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
                {STATUSES.map((status, index) => (
                  <div key={status} className="flex items-center flex-shrink-0">
                    <div className={`
                      py-1.5 px-3 rounded-full text-[10px] font-mono whitespace-nowrap border
                      ${index === currentIndex ? 'bg-accent-purple/20 border-accent-purple text-accent-purple' : 
                        index < currentIndex ? 'bg-background-3 border-transparent text-muted-1' : 
                        'bg-background-2 border-transparent text-muted-3'}
                    `}>
                      {status}
                    </div>
                    {index < STATUSES.length - 1 && (
                      <ArrowRight size={12} className={`mx-1 ${index < currentIndex ? 'text-accent-purple/50' : 'text-muted-3'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {canAdvance && (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="btn btn-primary mt-8 group"
              >
                {advancing ? <Loader2 size={18} className="animate-spin" /> : 
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                }
                Advance to {STATUSES[currentIndex + 1]}
              </button>
            )}
          </div>

          {/* Tasks Section */}
          <div className="card shadow-xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-accent-purple/10 rounded-lg text-accent-purple">
                  <ListTodo size={18} />
                </div>
                <h2 className="font-heading font-bold">Project Tasks</h2>
              </div>
              <button 
                onClick={() => setShowAddTask(!showAddTask)}
                className="btn btn-ghost btn-sm text-accent-purple hover:bg-accent-purple/10"
              >
                {showAddTask ? 'Cancel' : <><Plus size={16} /> Add Task</>}
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {showAddTask && (
                <form onSubmit={handleAddTask} className="p-4 bg-accent-purple/[0.03] space-y-4 animate-in slide-in-from-top duration-300">
                  <input 
                    type="text" 
                    placeholder="What needs to be done?" 
                    className="input w-full bg-background-1" 
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    required
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="date" 
                      className="input w-full bg-background-1" 
                      value={newTask.dueDate}
                      onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    />
                    <button type="submit" className="btn btn-primary">Save Task</button>
                  </div>
                </form>
              )}

              {project.tasks?.length === 0 ? (
                <div className="p-12 text-center text-muted-2">
                  <p>No tasks yet. Start by adding one!</p>
                </div>
              ) : (
                [...project.tasks].reverse().map((task) => (
                  <div key={task._id} className="p-4 flex items-center gap-4 group hover:bg-white/[0.02] transition-colors">
                    <button 
                      onClick={() => toggleTaskStatus(task._id, task.status)}
                      className={`p-1 rounded-full border-2 transition-all 
                        ${task.status === 'completed' ? 'bg-accent-green border-accent-green text-white' : 'border-muted-3 text-transparent hover:border-accent-purple'}`}
                    >
                      <CheckCircle size={16} />
                    </button>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-3' : 'text-white'}`}>
                        {task.title}
                      </div>
                      {task.dueDate && (
                        <div className="text-[10px] text-muted-2 flex items-center gap-1 mt-0.5 font-mono">
                          <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <button className="text-muted-3 opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="card p-5 space-y-6">
            <div>
              <h3 className="text-xs font-mono uppercase text-muted-3 mb-4 tracking-widest">Financials</h3>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-heading font-bold text-accent-green">
                  ${(project.budget || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-3 font-mono">TOTAL PROJECT BUDGET</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-2 flex items-center gap-1.5"><Calendar size={12} /> Timeline</span>
                <span className="font-mono">
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'} 
                  <span className="mx-1 text-muted-3">→</span>
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-2 flex items-center gap-1.5"><Clock size={12} /> Completion</span>
                <span className="text-accent-purple font-bold">{project.progress || 0}%</span>
              </div>
            </div>
          </div>

          {/* Connected Documents */}
          <div className="card shadow-lg">
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-heading font-bold flex items-center gap-2">
                <FileText size={16} className="text-accent-blue" /> Documents
              </h3>
            </div>
            <div className="p-2 space-y-1">
              {project.documents?.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-3 italic">No files linked</div>
              ) : (
                project.documents?.map(doc => (
                  <Link 
                    key={doc._id} 
                    to={`/documents/${doc._id}`} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple group-hover:bg-accent-purple group-hover:text-white transition-all">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{doc.name || doc.title}</div>
                      <div className="text-[10px] text-muted-3">{new Date(doc.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showAdvanceModal}
        onClose={() => setShowAdvanceModal(false)}
        onConfirm={confirmAdvance}
        title="Advance Workflow Stage"
        message={`Are you sure you want to advance this project to the ${STATUSES[currentIndex + 1]} stage? This may trigger automated document generation or notifications.`}
        confirmText={`Advance to ${STATUSES[currentIndex + 1]}`}
        variant="info"
        isLoading={advancing}
      />
    </div>
  );
}
