import { useState, useEffect, useRef } from 'react';
import { StickyNote, Plus, Save, Trash2, X, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { useNoteStore } from '../../store';
import { cn } from '../../lib/utils';
import ConfirmationModal from '../ui/ConfirmationModal';

export default function FloatingNotepad() {
  const { notes, fetchNotes, createNote, updateNote, deleteNote, isLoading } = useNoteStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!currentNote.trim()) return;

    try {
      if (editingId) {
        await updateNote(editingId, currentNote);
      } else {
        await createNote(currentNote);
      }
      setIsEditing(false);
      setCurrentNote('');
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleEdit = (note) => {
    setCurrentNote(note.content);
    setEditingId(note._id);
    setIsEditing(true);
    setIsMinimized(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setNoteToDelete(id);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      await deleteNote(noteToDelete);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent-yellow text-background shadow-lg shadow-accent-yellow/20 flex items-center justify-center hover:scale-110 transition-transform z-[100]"
        title="Open Notes"
      >
        <StickyNote size={24} />
      </button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 w-[320px] bg-background-2 border border-border rounded-xl shadow-2xl z-[100] flex flex-col transition-all duration-300",
        isMinimized ? "h-14" : "h-[480px]"
      )}
    >
      {/* Header */}
      <div 
        className="p-4 border-b border-border flex items-center justify-between cursor-default"
      >
        <h2 className="font-heading font-bold flex items-center gap-2 text-sm">
          <StickyNote size={16} className="text-accent-yellow" />
          Quick Notes
        </h2>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <button 
              onClick={() => {
                setIsEditing(true);
                setCurrentNote('');
                setEditingId(null);
              }}
              className="p-1 rounded-md text-muted-2 hover:text-accent-yellow hover:bg-accent-yellow/10 transition-colors"
              title="Add Note"
            >
              <Plus size={18} />
            </button>
          )}
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-md text-muted-2 hover:text-foreground hover:bg-background-3 transition-colors"
          >
            {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-muted-2 hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {isEditing ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <textarea
                  autoFocus
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Write your note here..."
                  className="w-full h-32 bg-background-3 border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-yellow resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={!currentNote.trim() || isLoading}
                    className="flex-1 btn btn-primary bg-accent-yellow hover:bg-accent-yellow/80 text-background flex items-center justify-center gap-2 text-sm py-2"
                  >
                    <Save size={16} />
                    Save Note
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditingId(null);
                    }}
                    className="p-2 rounded-lg bg-background-3 border border-border text-muted-2 hover:text-foreground transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {notes.length === 0 && !isEditing ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-background-3 mb-3">
                    <StickyNote size={24} className="text-muted-2" />
                  </div>
                  <p className="text-sm text-muted-2">No notes yet.</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note._id}
                    onClick={() => handleEdit(note)}
                    className="group relative p-3 rounded-lg bg-background-3 border border-border hover:border-accent-yellow/50 transition-all cursor-pointer"
                  >
                    <p className="text-sm whitespace-pre-wrap line-clamp-3">{note.content}</p>
                    <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-muted-2">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => handleDelete(note._id, e)}
                        className="p-1 rounded-md text-muted-2 hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete Note"
        isLoading={isDeleting}
      />
    </div>
  );
}
