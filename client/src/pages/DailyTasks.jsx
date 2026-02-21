import { useEffect, useState } from 'react';
import { useDailyTaskStore } from '../store';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Target,
  Zap,
  Coffee,
  MoreVertical
} from 'lucide-react';
import { cn } from '../lib/utils';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const CATEGORIES = [
  { id: 'work', label: 'Work', icon: Target, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
  { id: 'outreach', label: 'Outreach', icon: Zap, color: 'text-accent-yellow', bg: 'bg-accent-yellow/10' },
  { id: 'personal', label: 'Personal', icon: Coffee, color: 'text-accent-green', bg: 'bg-accent-green/10' },
  { id: 'other', label: 'Other', icon: Clock, color: 'text-muted-2', bg: 'bg-muted/10' }
];

export default function DailyTasks() {
  const { dailyTasks, isLoading, fetchDailyTasks, createDailyTask, updateDailyTask, deleteDailyTask } = useDailyTaskStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('work');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDailyTasks({ date: selectedDate });
  }, [selectedDate]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createDailyTask({
      title,
      category: selectedCategory,
      date: selectedDate
    });
    setTitle('');
  };

  const handleToggleTask = async (task) => {
    await updateDailyTask(task._id, { completed: !task.completed });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDailyTask(deleteId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Daily Accomplishments</h1>
          <p className="text-muted-2 text-sm">Log your daily progress and keep the momentum going.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-background-2 border border-border p-1 rounded-xl shadow-sm">
          <button 
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-background-3 rounded-lg text-muted-2 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-1.5 flex flex-col items-center min-w-[140px]">
            <span className="text-xs font-mono uppercase text-muted-3 tracking-widest leading-none mb-1">
              {isToday ? 'Today' : new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
            <span className="text-sm font-bold">
              {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <button 
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-background-3 rounded-lg text-muted-2 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Add Task */}
      <div className="card p-6 bg-gradient-to-br from-background-2 to-background-3 border-accent-purple/10">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  selectedCategory === cat.id 
                    ? `border-${cat.color.split('-')[1]}-500/50 ${cat.bg} ${cat.color} shadow-sm` 
                    : "border-border bg-background-4 text-muted-2 hover:border-muted opacity-60"
                )}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="What did you get done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input flex-1 py-3 px-4 text-base focus:ring-1 ring-accent-purple/20"
            />
            <button 
              type="submit" 
              disabled={!title.trim() || isLoading}
              className="btn btn-primary px-6 flex items-center gap-2"
            >
              <Plus size={20} /> Add
            </button>
          </div>
        </form>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {isLoading && dailyTasks.length === 0 ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple mx-auto"></div>
          </div>
        ) : dailyTasks.length === 0 ? (
          <div className="card p-12 text-center border-dashed border-2 opacity-60">
            <CalendarIcon size={40} className="mx-auto text-muted-3 mb-4 opacity-20" />
            <h3 className="font-heading font-bold text-muted-1">No accomplishments yet</h3>
            <p className="text-sm text-muted-2 mt-1">Start by adding what you've done today!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {dailyTasks.map(task => {
              const category = CATEGORIES.find(c => c.id === task.category) || CATEGORIES[0];
              return (
                <div 
                  key={task._id} 
                  className={cn(
                    "card p-4 flex items-center gap-4 group hover:border-muted-2 transition-all duration-300",
                    task.completed && "opacity-60 bg-background-3/50"
                  )}
                >
                  <button 
                    onClick={() => handleToggleTask(task)}
                    className={cn(
                      "shrink-0 transition-transform active:scale-90",
                      task.completed ? "text-accent-green" : "text-muted hover:text-accent-purple"
                    )}
                  >
                    {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("p-1 rounded bg-background-3", category.color)}>
                        <category.icon size={12} />
                      </span>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-muted-3">
                        {category.label}
                      </span>
                    </div>
                    <h3 className={cn(
                      "font-medium text-sm transition-all",
                      task.completed && "line-through text-muted-2"
                    )}>
                      {task.title}
                    </h3>
                  </div>

                  <button 
                    onClick={() => setDeleteId(task._id)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger rounded-lg text-muted transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete accomplishment"
        message="Are you sure you want to remove this log entry? This action cannot be undone."
        confirmText="Remove Entry"
        isLoading={isDeleting}
      />
    </div>
  );
}
