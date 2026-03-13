import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom gold feather/pen cursor that follows the mouse.
 * Rotates 15deg on mousedown. Hidden on touch devices.
 */
export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(true);
  const rafRef = useRef(null);
  const targetRef = useRef({ x: -100, y: -100 });

  /* ── Detect touch device ─────────────────────────────── */
  useEffect(() => {
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;

    if (isTouch) {
      setVisible(false);
      return;
    }

    // Hide default cursor on body
    document.body.style.cursor = 'none';

    return () => {
      document.body.style.cursor = '';
    };
  }, []);

  /* ── Mouse tracking with RAF smoothing ───────────────── */
  const handleMouseMove = useCallback((e) => {
    targetRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    if (!visible) return;

    function tick() {
      setPos((prev) => ({
        x: prev.x + (targetRef.current.x - prev.x) * 0.3,
        y: prev.y + (targetRef.current.y - prev.y) * 0.3,
      }));
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [visible, handleMouseMove]);

  /* ── Mousedown rotation ──────────────────────────────── */
  useEffect(() => {
    if (!visible) return;

    const down = () => setPressed(true);
    const up = () => setPressed(false);

    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);

    return () => {
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        transform: `translate(${pos.x - 6}px, ${pos.y - 24}px) rotate(${pressed ? '15deg' : '0deg'})`,
        transition: 'transform 120ms ease-out',
        willChange: 'transform',
      }}
    >
      <svg
        width="24"
        height="32"
        viewBox="0 0 24 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Feather / pen nib */}
        <path
          d="M12 30 L10 18 Q6 10 4 4 Q8 6 12 8 Q16 6 20 4 Q18 10 14 18 Z"
          fill="#C9A96E"
          opacity="0.85"
        />
        {/* Nib tip */}
        <path
          d="M11 28 L12 32 L13 28"
          fill="#A07840"
        />
        {/* Quill center line */}
        <line
          x1="12"
          y1="8"
          x2="12"
          y2="28"
          stroke="#A07840"
          strokeWidth="0.5"
          opacity="0.5"
        />
        {/* Feather barbs — left */}
        <path
          d="M4 4 Q7 7 10 18"
          stroke="#E8D5A3"
          strokeWidth="0.4"
          fill="none"
          opacity="0.6"
        />
        {/* Feather barbs — right */}
        <path
          d="M20 4 Q17 7 14 18"
          stroke="#E8D5A3"
          strokeWidth="0.4"
          fill="none"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
