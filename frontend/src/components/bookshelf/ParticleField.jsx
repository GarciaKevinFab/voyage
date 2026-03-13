import React, { useMemo } from 'react';

const PARTICLE_COUNT = 25;

function generateParticle(index) {
  const size = 3 + Math.random() * 5;
  const opacity = 0.2 + Math.random() * 0.4;
  const duration = 8 + Math.random() * 12;
  const delay = Math.random() * 15;
  const left = Math.random() * 100;
  const animName = `particle-float-${index}`;

  return { size, opacity, duration, delay, left, animName };
}

export default function ParticleField() {
  const particles = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => generateParticle(i)),
    []
  );

  return (
    <>
      <style>
        {particles
          .map(
            (p) => `
          @keyframes ${p.animName} {
            0% {
              transform: translateY(100vh) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: ${p.opacity};
            }
            90% {
              opacity: ${p.opacity};
            }
            100% {
              transform: translateY(-5vh) rotate(720deg);
              opacity: 0;
            }
          }
        `
          )
          .join('\n')}
      </style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              bottom: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: '#F5F0E8',
              opacity: 0,
              borderRadius: '1px',
              animation: `${p.animName} ${p.duration}s ${p.delay}s linear infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}
