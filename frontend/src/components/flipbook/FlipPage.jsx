import React, { useEffect, useRef } from 'react';

const TURN_DURATION = 700;
const LUXURY_EASING = 'cubic-bezier(0.645, 0.045, 0.355, 1)';

const KEYFRAMES_ID = 'voyage-flippage-keyframes';

function injectKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const sheet = document.createElement('style');
  sheet.id = KEYFRAMES_ID;
  sheet.textContent = `
    @keyframes flipForward {
      0%   { transform: rotateY(0deg); }
      40%  { transform: rotateY(-72deg); }
      100% { transform: rotateY(-180deg); }
    }
    @keyframes flipBackward {
      0%   { transform: rotateY(-180deg); }
      40%  { transform: rotateY(-108deg); }
      100% { transform: rotateY(0deg); }
    }
  `;
  document.head.appendChild(sheet);
}

/**
 * 3D page flip overlay.
 *
 * Props:
 *   - frontContent: ReactNode for the front face
 *   - backContent: ReactNode for the back face
 *   - isTurning: boolean
 *   - direction: 'forward' | 'backward'
 */
export default function FlipPage({
  frontContent,
  backContent,
  isTurning,
  direction = 'forward',
}) {
  const ref = useRef(null);

  useEffect(() => {
    injectKeyframes();
  }, []);

  const isForward = direction === 'forward';

  const containerStyle = {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: '50%',
    height: '100%',
    transformOrigin: 'left center',
    transformStyle: 'preserve-3d',
    zIndex: 15,
    animation: isTurning
      ? `${isForward ? 'flipForward' : 'flipBackward'} ${TURN_DURATION}ms ${LUXURY_EASING} forwards`
      : 'none',
    pointerEvents: 'none',
  };

  const faceBase = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    overflow: 'hidden',
  };

  const frontStyle = {
    ...faceBase,
    zIndex: 2,
    backgroundColor: '#F5F0E8',
  };

  const backStyle = {
    ...faceBase,
    transform: 'rotateY(180deg)',
    zIndex: 1,
    backgroundColor: '#F5F0E8',
    backgroundImage: `
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 59px,
        rgba(201,169,110,0.08) 59px,
        rgba(201,169,110,0.08) 60px
      ),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 59px,
        rgba(201,169,110,0.06) 59px,
        rgba(201,169,110,0.06) 60px
      )
    `,
  };

  /* Dynamic shadow that peaks at 40% of the turn */
  const shadowStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '30px',
    height: '100%',
    background: 'linear-gradient(90deg, rgba(0,0,0,0.25) 0%, transparent 100%)',
    pointerEvents: 'none',
    opacity: isTurning ? 1 : 0,
    transition: `opacity ${TURN_DURATION * 0.4}ms`,
    zIndex: 3,
  };

  return (
    <div ref={ref} style={containerStyle}>
      {/* Front face */}
      <div style={frontStyle}>
        {frontContent || (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#F5F0E8' }} />
        )}
      </div>

      {/* Back face — paper texture with subtle gold grid lines */}
      <div style={backStyle}>
        {backContent || (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Decorative paper texture indicator */}
            <div
              style={{
                width: '40px',
                height: '1px',
                backgroundColor: 'rgba(201,169,110,0.2)',
              }}
            />
          </div>
        )}
      </div>

      {/* Edge shadow */}
      <div style={shadowStyle} />
    </div>
  );
}
