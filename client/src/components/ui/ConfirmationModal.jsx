import { AlertTriangle, Loader2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // danger, info
  isLoading = false 
}) {
  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle size={24} />,
    info: <Info size={24} />,
  };

  const colors = {
    danger: 'bg-danger/10 text-danger',
    info: 'bg-accent-blue/10 text-accent-blue',
  };

  const btnColors = {
    danger: 'btn-danger',
    info: 'btn-primary bg-accent-blue hover:bg-accent-blue/80 text-background',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-md animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="modal-header border-none pb-0">
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform hover:rotate-12", colors[variant])}>
            {icons[variant]}
          </div>
          <h2 className="font-heading text-xl font-bold">{title}</h2>
        </div>
        <div className="modal-body pt-2">
          <p className="text-muted-2 text-sm leading-relaxed">
            {message}
          </p>
        </div>
        <div className="modal-footer bg-transparent pt-2 pb-6 px-6">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-ghost"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            className={cn("btn flex items-center justify-center gap-2 min-w-[120px]", btnColors[variant])}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
