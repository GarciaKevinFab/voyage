import React, { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useAppStore from '../../store/appStore';

const LUXURY_EASE = [0.645, 0.045, 0.355, 1];
const AUTO_DISMISS = 4000;

const TYPE_STYLES = {
  success: {
    borderLeft: '2px solid #C9A96E',
    backgroundColor: 'rgba(245,240,232,0.97)',
    color: '#0A0A0A',
  },
  error: {
    borderLeft: '2px solid #8A8478',
    backgroundColor: 'rgba(245,240,232,0.97)',
    color: '#0A0A0A',
  },
  info: {
    borderLeft: '2px solid #E8D5A3',
    backgroundColor: 'rgba(245,240,232,0.97)',
    color: '#0A0A0A',
  },
};

/**
 * Single toast notification item.
 */
function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const typeStyle = TYPE_STYLES[toast.type] || TYPE_STYLES.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.35, ease: LUXURY_EASE }}
      style={{
        ...typeStyle,
        fontFamily: "'Josefin Sans', sans-serif",
        fontWeight: 200,
        fontSize: '12px',
        letterSpacing: '0.08em',
        padding: '14px 20px',
        minWidth: '240px',
        maxWidth: '360px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        cursor: 'pointer',
      }}
      onClick={() => onDismiss(toast.id)}
    >
      <span>{toast.message}</span>
      <span
        style={{
          fontSize: '14px',
          opacity: 0.4,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        &times;
      </span>
    </motion.div>
  );
}

/**
 * Toast notification container.
 * Reads from appStore.toasts and renders stacked at bottom-right.
 */
export default function Toast() {
  const { toasts, removeToast } = useAppStore();

  const handleDismiss = useCallback(
    (id) => removeToast(id),
    [removeToast]
  );

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={toast} onDismiss={handleDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
