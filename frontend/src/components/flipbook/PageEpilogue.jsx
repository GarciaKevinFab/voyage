import React, { useEffect } from 'react';

const KEYFRAMES_ID = 'voyage-epilogue-keyframes';

function injectKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const sheet = document.createElement('style');
  sheet.id = KEYFRAMES_ID;
  sheet.textContent = `
    @keyframes epilogueCharReveal {
      from { opacity: 0; transform: translateY(3px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes epilogueLineGrow {
      from { width: 0; }
      to   { width: 80px; }
    }
    @keyframes epilogueFin {
      from { opacity: 0; letter-spacing: 1.2em; }
      to   { opacity: 1; letter-spacing: 0.6em; }
    }
  `;
  document.head.appendChild(sheet);
}

/**
 * Letter-by-letter text reveal for the epilogue.
 */
function RevealText({ text, delay = 0 }) {
  if (!text) return null;
  return (
    <span>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            opacity: 0,
            animation: `epilogueCharReveal 300ms ${delay + i * 18}ms forwards`,
            display: 'inline-block',
            whiteSpace: char === ' ' ? 'pre' : 'normal',
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

/**
 * Epilogue page.
 *
 * Props:
 *   - text: epilogue string
 */
export default function PageEpilogue({ text }) {
  useEffect(() => {
    injectKeyframes();
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#F5F0E8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
      }}
    >
      {/* Gold ornamental line — top */}
      <div
        style={{
          height: '1px',
          backgroundColor: '#C9A96E',
          marginBottom: '40px',
          animation: 'epilogueLineGrow 800ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards',
          width: 0,
        }}
      />

      {/* Epilogue text */}
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: '20px',
          lineHeight: 2.4,
          color: '#0A0A0A',
          textAlign: 'center',
          maxWidth: '80%',
        }}
      >
        <RevealText text={text || ''} delay={400} />
      </div>

      {/* Gold ornamental line — bottom */}
      <div
        style={{
          height: '1px',
          backgroundColor: '#C9A96E',
          marginTop: '40px',
          animation: 'epilogueLineGrow 800ms 200ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards',
          width: 0,
        }}
      />

      {/* FIN */}
      <div
        style={{
          marginTop: '48px',
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 200,
          fontSize: '12px',
          color: '#C9A96E',
          textTransform: 'uppercase',
          opacity: 0,
          animation: 'epilogueFin 1000ms 1200ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards',
          letterSpacing: '0.6em',
        }}
      >
        FIN
      </div>
    </div>
  );
}
