import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-[#0d2e25] border-[#14E8B4]',
      icon_color: 'text-[#14E8B4]',
      text: 'text-[#14E8B4]',
    },
    error: {
      icon: XCircle,
      bg: 'bg-[#2e1010] border-[#F5514B]',
      icon_color: 'text-[#F5514B]',
      text: 'text-[#F5514B]',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-[#2e2010] border-[#F6B93B]',
      icon_color: 'text-[#F6B93B]',
      text: 'text-[#F6B93B]',
    },
    info: {
      icon: Info,
      bg: 'bg-[#101e2e] border-[#4C8DFF]',
      icon_color: 'text-[#4C8DFF]',
      text: 'text-[#4C8DFF]',
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} shadow-2xl min-w-[280px] max-w-sm animate-[slideIn_0.3s_ease-out]`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.icon_color}`} />
      <p className="text-[#EAF0FB] text-sm flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[#5C6B85] hover:text-[#EAF0FB] transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Global toast state
type ToastListener = (toasts: Toast[]) => void;
let toasts: Toast[] = [];
const listeners: Set<ToastListener> = new Set();

const notify = (listeners: Set<ToastListener>, newToasts: Toast[]) => {
  listeners.forEach(fn => fn([...newToasts]));
};

export const toast = {
  success: (message: string, duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, type: 'success', message, duration }];
    notify(listeners, toasts);
  },
  error: (message: string, duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, type: 'error', message, duration: duration ?? 5000 }];
    notify(listeners, toasts);
  },
  warning: (message: string, duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, type: 'warning', message, duration }];
    notify(listeners, toasts);
  },
  info: (message: string, duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, type: 'info', message, duration }];
    notify(listeners, toasts);
  },
};

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  const remove = useCallback((id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    notify(listeners, toasts);
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        {items.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </>
  );
}
