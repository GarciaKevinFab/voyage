import React, { useState, useEffect, useRef } from 'react';

const KEYFRAMES_ID = 'voyage-loading-keyframes';

function injectKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const sheet = document.createElement('style');
  sheet.id = KEYFRAMES_ID;
  sheet.textContent = `
    @keyframes voyageDotWave {
      0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.3;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(sheet);
}

/**
 * Full-screen loading overlay with rotating literary quotes and gold dot animation.
 *
 * Props:
 *   - isVisible: boolean
 *   - quotes: string[] — array of quote strings, rotates every 3s
 */
export default function LoadingOverlay({ isVisible, quotes = [] }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadingIn, setFadingIn] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    injectKeyframes();
  }, []);

  useEffect(() => {
    if (!isVisible || quotes.length === 0) return;

    intervalRef.current = setInterval(() => {
      setFadingIn(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFadingIn(true);
      }, 400);
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [isVisible, quotes]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(10, 10, 10, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '40px',
      }}
    >
      {/* Quote */}
      {quotes.length > 0 && (
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: '16px',
            lineHeight: 1.8,
            color: '#F5F0E8',
            textAlign: 'center',
            maxWidth: '480px',
            padding: '0 24px',
            opacity: fadingIn ? 1 : 0,
            transition: 'opacity 400ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
        >
          {quotes[quoteIndex]}
        </p>
      )}

      {/* Three gold dots wave */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#C9A96E',
              animation: `voyageDotWave 1.4s ${i * 0.16}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
