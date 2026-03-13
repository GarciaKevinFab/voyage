import React, { useMemo, useEffect, useRef } from 'react';

const PARTICLE_COUNT = 7;
const DURATION = 900; // ms
const COLORS = ['#F5F0E8', '#E8D5A3', '#F5F0E8', '#E8D5A3', '#F5F0E8', '#E8D5A3', '#F5F0E8'];
const KEYFRAMES_ID = 'voyage-dust-keyframes';

function injectKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const sheet = document.createElement('style');
  sheet.id = KEYFRAMES_ID;
  sheet.textContent = `
    @keyframes dustArc {
      0% {
        opacity: 0;
        transform: translate(0, 0) scale(1);
      }
      15% {
        opacity: 0.8;
      }
      60% {
        opacity: 0.6;
        transform: translate(
          calc(var(--dx) * 0.7),
          calc(var(--dy) * 0.5 - 20px)
        ) scale(0.8);
      }
      100% {
        opacity: 0;
        transform: translate(var(--dx), var(--dy)) scale(0.3);
      }
    }
  `;
  document.head.appendChild(sheet);
}

/**
 * Dust particle burst emitted from the book spine on page turn.
 *
 * Props:
 *   - isActive: boolean — triggers a new burst
 *   - direction: 'forward' | 'backward'
 */
export default function DustParticles({ isActive, direction = 'forward' }) {
  const keyRef = useRef(0);

  useEffect(() => {
    injectKeyframes();
  }, []);

  // Regenerate particles each time isActive becomes true
  useEffect(() => {
    if (isActive) {
      keyRef.current += 1;
    }
  }, [isActive]);

  const particles = useMemo(() => {
    // Trigger recalc via keyRef.current (read inside memo is fine for burst)
    void keyRef.current;

    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const size = 4 + Math.random() * 3; // 4-7px
      const dirMult = direction === 'forward' ? 1 : -1;

      // Arc trajectory: horizontal spread + downward arc
      const dx = (20 + Math.random() * 60) * (Math.random() > 0.5 ? 1 : -1) * dirMult;
      const dy = 15 + Math.random() * 40;

      // Vertical offset from center of spine
      const startY = -30 + Math.random() * 60;
      const delay = Math.random() * 120;

      return {
        id: i,
        size,
        dx: `${dx}px`,
        dy: `${dy}px`,
        startY,
        delay,
        color: COLORS[i % COLORS.length],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, direction]);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
        zIndex: 25,
        pointerEvents: 'none',
      }}
    >
      {particles.map((p) => (
        <div
          key={`${keyRef.current}-${p.id}`}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            backgroundColor: p.color,
            top: `${p.startY}px`,
            left: 0,
            opacity: 0,
            '--dx': p.dx,
            '--dy': p.dy,
            animation: `dustArc ${DURATION}ms ${p.delay}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
