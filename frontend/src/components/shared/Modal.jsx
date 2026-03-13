import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LUXURY_EASE = [0.645, 0.045, 0.355, 1];

/**
 * Reusable modal wrapper with backdrop blur and scale animation.
 *
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 *   - children: ReactNode
 *   - title: string (optional)
 */
export default function Modal({ isOpen, onClose, children, title }) {
  /* ── Close on Escape ─────────────────────────────────── */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  /* ── Prevent body scroll ─────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(10, 10, 10, 0.6)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.35, ease: LUXURY_EASE }}
            style={{
              position: 'relative',
              backgroundColor: '#F5F0E8',
              padding: '40px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 16px 64px rgba(0,0,0,0.2)',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#8A8478',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px',
                transition: 'color 300ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0A0A0A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8A8478')}
            >
              &times;
            </button>

            {/* Title */}
            {title && (
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  fontSize: '1.5rem',
                  letterSpacing: '0.2em',
                  color: '#0A0A0A',
                  textTransform: 'uppercase',
                  marginBottom: '24px',
                  paddingRight: '32px',
                }}
              >
                {title}
              </h2>
            )}

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
