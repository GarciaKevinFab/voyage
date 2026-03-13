import React from 'react';

export default function ShelfBase() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        perspective: '800px',
        zIndex: 2,
      }}
    >
      {/* Gold edge line */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 5%, #C9A96E 20%, #E8D5A3 50%, #C9A96E 80%, transparent 95%)',
        }}
      />
      {/* Shelf surface */}
      <div
        style={{
          height: '80px',
          background: 'linear-gradient(180deg, #4A2E14 0%, #3D2510 40%, #2A1A0A 100%)',
          transform: 'rotateX(3deg)',
          transformOrigin: 'top center',
        }}
      >
        {/* Wood grain texture lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(90deg, transparent, transparent 120px, rgba(202,169,110,0.04) 120px, rgba(202,169,110,0.04) 121px)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle front bevel highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(180deg, rgba(74,46,20,0.8) 0%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
}
