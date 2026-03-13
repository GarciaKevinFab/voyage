import React, { useState } from 'react';

const LAYOUT_INFO = [
  {
    key: 'A',
    label: 'Editorial Split',
    render: (isSelected, isHover) => (
      <svg width="100%" height="100%" viewBox="0 0 80 56" fill="none">
        <rect x="1" y="1" width="38" height="54" fill={isSelected || isHover ? '#E8D5A3' : '#d4cec4'} />
        <rect x="44" y="10" width="30" height="3" rx="1" fill={isSelected || isHover ? '#C9A96E' : '#b0a99e'} />
        <rect x="44" y="17" width="26" height="2" rx="1" fill={isSelected || isHover ? '#C9A96E' : '#b0a99e'} opacity="0.6" />
        <rect x="44" y="22" width="28" height="2" rx="1" fill={isSelected || isHover ? '#C9A96E' : '#b0a99e'} opacity="0.6" />
        <rect x="44" y="27" width="20" height="2" rx="1" fill={isSelected || isHover ? '#C9A96E' : '#b0a99e'} opacity="0.4" />
      </svg>
    ),
  },
  {
    key: 'B',
    label: 'Full Bleed',
    render: (isSelected, isHover) => (
      <svg width="100%" height="100%" viewBox="0 0 80 56" fill="none">
        <rect x="1" y="1" width="78" height="54" fill={isSelected || isHover ? '#E8D5A3' : '#d4cec4'} />
        <rect x="6" y="40" width="30" height="3" rx="1" fill={isSelected || isHover ? '#FAFAF7' : '#eee'} />
        <rect x="6" y="46" width="22" height="2" rx="1" fill={isSelected || isHover ? '#FAFAF7' : '#eee'} opacity="0.7" />
      </svg>
    ),
  },
  {
    key: 'C',
    label: 'Magazine',
    render: (isSelected, isHover) => (
      <svg width="100%" height="100%" viewBox="0 0 80 56" fill="none">
        <rect x="1" y="1" width="78" height="54" fill={isSelected || isHover ? '#FAFAF7' : '#f0ece4'} />
        <rect x="16" y="6" width="48" height="30" fill={isSelected || isHover ? '#E8D5A3' : '#d4cec4'} />
        <rect x="20" y="42" width="40" height="2" rx="1" fill={isSelected || isHover ? '#C9A96E' : '#b0a99e'} opacity="0.6" />
        <rect x="24" y="47" width="32" height="2" rx="1" fill={isSelected || isHover ? '#C9A96E' : '#b0a99e'} opacity="0.4" />
      </svg>
    ),
  },
  {
    key: 'D',
    label: 'Text Only',
    render: (isSelected, isHover) => (
      <svg width="100%" height="100%" viewBox="0 0 80 56" fill="none">
        <rect x="1" y="1" width="78" height="54" fill={isSelected || isHover ? '#FAFAF7' : '#f0ece4'} />
        <rect x="16" y="18" width="48" height="3" rx="1" fill={isSelected || isHover ? '#C9A96E' : '#b0a99e'} />
        <rect x="20" y="25" width="40" height="2" rx="1" fill={isSelected || isHover ? '#C9A96E' : '#b0a99e'} opacity="0.6" />
        <rect x="22" y="30" width="36" height="2" rx="1" fill={isSelected || isHover ? '#C9A96E' : '#b0a99e'} opacity="0.5" />
        <rect x="24" y="35" width="32" height="2" rx="1" fill={isSelected || isHover ? '#C9A96E' : '#b0a99e'} opacity="0.4" />
      </svg>
    ),
  },
];

export default function LayoutSelector({ currentLayout, onSelect }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        backgroundColor: '#FAFAF7',
        border: '1px solid #E8D5A3',
        padding: '12px',
        width: '220px',
      }}
    >
      {LAYOUT_INFO.map((item) => (
        <LayoutOption
          key={item.key}
          item={item}
          isSelected={currentLayout === item.key}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function LayoutOption({ item, isSelected, onSelect }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={() => onSelect(item.key)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'transparent',
        border: isSelected ? '2px solid #C9A96E' : '1px solid #E8D5A3',
        cursor: 'pointer',
        padding: '6px',
        transition: 'all 300ms cubic-bezier(0.645, 0.045, 0.355, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <div style={{ width: '80px', height: '56px' }}>
        {item.render(isSelected, hover)}
      </div>
      <span
        style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: isSelected ? 400 : 200,
          fontSize: '0.5rem',
          letterSpacing: '0.15em',
          color: isSelected ? '#C9A96E' : '#8A8478',
          textTransform: 'uppercase',
          transition: 'color 300ms',
        }}
      >
        {item.label}
      </span>
    </button>
  );
}
