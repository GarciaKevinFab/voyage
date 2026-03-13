import React, { useEffect, useRef, useState } from 'react';

const KEYFRAMES_ID = 'voyage-pinDrop-keyframes';

function injectKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const sheet = document.createElement('style');
  sheet.id = KEYFRAMES_ID;
  sheet.textContent = `
    @keyframes pinDrop {
      0%   { transform: translateY(-30px) scale(0.5); opacity: 0; }
      60%  { transform: translateY(4px) scale(1.1); opacity: 1; }
      80%  { transform: translateY(-2px) scale(0.95); }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }

    .voyage-dark-tooltip {
      background: rgba(10,10,10,0.92) !important;
      border: 1px solid #C9A96E !important;
      color: #F5F0E8 !important;
      font-family: 'Josefin Sans', sans-serif !important;
      font-weight: 200 !important;
      font-size: 10px !important;
      letter-spacing: 0.15em !important;
      padding: 8px 14px !important;
      border-radius: 0 !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
    }

    .voyage-dark-tooltip::before {
      border-top-color: #C9A96E !important;
    }

    .voyage-pin-marker {
      opacity: 0;
      animation: pinDrop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  `;
  document.head.appendChild(sheet);
}

/**
 * Gold pin SVG icon as HTML string for Leaflet divIcon.
 */
function goldPinHTML() {
  return `
    <svg width="20" height="28" viewBox="0 0 20 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.48 15.52 0 10 0z"
            fill="#C9A96E" stroke="#A07840" stroke-width="1"/>
      <circle cx="10" cy="10" r="4" fill="#F5F0E8"/>
    </svg>
  `;
}

/**
 * Map page showing all photo locations with dark editorial tiles.
 *
 * Props:
 *   - locations: array of page objects with { latitude, longitude, caption, photo, location_name }
 */
export default function PageMap({ locations = [] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    injectKeyframes();
  }, []);

  /* ── Initialize Leaflet ──────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (typeof window === 'undefined' || !window.L) {
      // Leaflet not loaded yet — try dynamic import
      setReady(false);
      return;
    }

    const L = window.L;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([20, 0], 2);

    // CartoDB Dark Matter tiles
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 18 }
    ).addTo(map);

    const bounds = [];

    locations.forEach((loc, index) => {
      if (!loc.latitude || !loc.longitude) return;
      const latlng = [loc.latitude, loc.longitude];
      bounds.push(latlng);

      const icon = L.divIcon({
        className: 'voyage-pin-marker',
        html: goldPinHTML(),
        iconSize: [20, 28],
        iconAnchor: [10, 28],
        popupAnchor: [0, -30],
      });

      // Stagger animation delay
      const marker = L.marker(latlng, { icon }).addTo(map);

      // Set staggered animation delay via the element
      setTimeout(() => {
        const el = marker.getElement();
        if (el) {
          el.style.animationDelay = `${index * 150}ms`;
        }
      }, 50);

      // Tooltip with photo thumbnail + label
      const label = loc.location_name || loc.caption || `Location ${index + 1}`;
      const thumbHTML = loc.photo
        ? `<div style="margin-bottom:6px;">
             <img src="${loc.photo}" alt="" style="width:80px;height:56px;object-fit:cover;display:block;" />
           </div>`
        : '';

      marker.bindTooltip(
        `${thumbHTML}<span>${label}</span>`,
        {
          className: 'voyage-dark-tooltip',
          direction: 'top',
          offset: [0, -8],
          opacity: 1,
        }
      );
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }

    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [locations]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a2e',
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        <h2
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 200,
            fontSize: '14px',
            letterSpacing: '0.5em',
            color: '#C9A96E',
            textTransform: 'uppercase',
          }}
        >
          EL VIAJE
        </h2>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
