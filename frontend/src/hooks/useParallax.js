import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook that tracks mouse position and returns smoothed transform values
 * for a parallax effect. Uses requestAnimationFrame with linear
 * interpolation (lerp) for buttery smooth movement.
 *
 * @param {object} options
 * @param {number} options.intensity - Movement intensity multiplier (default 15).
 * @param {number} options.smoothing - Lerp factor, 0–1 (default 0.08). Lower = smoother/slower.
 * @param {boolean} options.enabled - Whether the effect is active (default true).
 *
 * Returns { x, y, style } where style is a ready-to-use CSS transform object.
 */
export default function useParallax({
  intensity = 15,
  smoothing = 0.08,
  enabled = true,
} = {}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  // Lerp helper
  const lerp = (start, end, factor) => start + (end - start) * factor;

  // Track mouse position as normalized -1 to 1 values
  const handleMouseMove = useCallback(
    (e) => {
      if (!enabled) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
      targetRef.current = { x, y };
    },
    [enabled]
  );

  // Animation loop
  useEffect(() => {
    if (!enabled) {
      setPosition({ x: 0, y: 0 });
      return;
    }

    function animate() {
      const curr = currentRef.current;
      const target = targetRef.current;

      curr.x = lerp(curr.x, target.x, smoothing);
      curr.y = lerp(curr.y, target.y, smoothing);

      // Only update React state when the change is visually meaningful
      const dx = Math.abs(curr.x * intensity - position.x);
      const dy = Math.abs(curr.y * intensity - position.y);
      if (dx > 0.01 || dy > 0.01) {
        setPosition({
          x: curr.x * intensity,
          y: curr.y * intensity,
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, intensity, smoothing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attach / detach mouse listener
  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled, handleMouseMove]);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      targetRef.current = { x: 0, y: 0 };
      currentRef.current = { x: 0, y: 0 };
      setPosition({ x: 0, y: 0 });
    }
  }, [enabled]);

  const style = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
  };

  return { x: position.x, y: position.y, style };
}
