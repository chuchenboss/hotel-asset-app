// src/components/Toast.jsx
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ============ TOAST CONTEXT ============ */
const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={16} />,
  error:   <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info size={16} />,
};

const COLORS = {
  success: { bg: '#E1F5EE', border: '#9FE1CB', color: '#0F6E56', icon: '#1D9E75' },
  error:   { bg: '#FCEBEB', border: '#F7C1C1', color: '#A32D2D', icon: '#C94040' },
  warning: { bg: '#FAEEDA', border: '#FAC775', color: '#854F0B', icon: '#D97706' },
  info:    { bg: '#E6F1FB', border: '#B5D4F4', color: '#185FA5', icon: '#2563EB' },
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const c = COLORS[toast.type] || COLORS.info;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 280);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const timer = setTimeout(dismiss, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [dismiss, toast.duration]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: '11px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        maxWidth: 340,
        minWidth: 240,
        animation: exiting
          ? 'toastOut 0.28s ease forwards'
          : 'toastIn 0.25s ease',
        position: 'relative',
      }}
    >
      <span style={{ color: c.icon, flexShrink: 0, marginTop: 1 }}>{ICONS[toast.type]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{ fontWeight: 600, fontSize: 13, color: c.color, marginBottom: 1 }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: 13, color: c.color, lineHeight: 1.5 }}>{toast.message}</div>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: c.color, opacity: 0.6, padding: 2, flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0)    scale(1); }
          to   { opacity: 0; transform: translateX(24px) scale(0.95); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');

  return {
    success: (message, title) => ctx({ type: 'success', title, message }),
    error:   (message, title) => ctx({ type: 'error',   title, message }),
    warning: (message, title) => ctx({ type: 'warning', title, message }),
    info:    (message, title) => ctx({ type: 'info',    title, message }),
  };
}

/* ============ CONFIRM DIALOG ============ */
let _confirmResolve = null;

export function ConfirmDialog({ state, onClose }) {
  if (!state) return null;

  const { message, title, danger } = state;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(4px)',
        animation: 'toastIn 0.2s ease',
      }}
    >
      <div style={{
        background: 'var(--white)',
        borderRadius: 14,
        width: '100%', maxWidth: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 22px 16px' }}>
          {title && (
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>
              {title}
            </div>
          )}
          <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{message}</div>
        </div>
        <div style={{
          padding: '12px 22px 18px',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button className="btn" onClick={() => onClose(false)}>Huỷ</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => onClose(true)}
            style={!danger ? {} : { background: '#A32D2D', color: 'white', borderColor: '#A32D2D' }}
          >
            {danger ? 'Xoá' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ CONFIRM HOOK ============ */
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(({ message, title, danger = false }) => {
    return new Promise((resolve) => {
      _confirmResolve = resolve;
      setState({ message, title, danger });
    });
  }, []);

  const handleClose = useCallback((result) => {
    setState(null);
    if (_confirmResolve) {
      _confirmResolve(result);
      _confirmResolve = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog state={state} onClose={handleClose} />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx;
}
