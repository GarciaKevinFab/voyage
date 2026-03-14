import React, { useEffect, useRef, useState } from 'react';

const KEYFRAMES_ID = 'voyage-worldmap-keyframes';

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

    .voyage-world-tooltip {
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

    .voyage-world-tooltip::before {
      border-top-color: #C9A96E !important;
    }

    .voyage-world-pin {
      opacity: 0;
      animation: pinDrop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      cursor: pointer;
    }
  `;
  document.head.appendChild(sheet);
}

/**
 * Gold pin SVG icon as HTML string for Leaflet divIcon.
 */
function goldPinHTML() {
  return `
    <svg width="24" height="34" viewBox="0 0 20 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.48 15.52 0 10 0z"
            fill="#C9A96E" stroke="#A07840" stroke-width="1"/>
      <circle cx="10" cy="10" r="4" fill="#FAFAF7"/>
    </svg>
  `;
}

/**
 * Interactive world map showing book locations with gold pin markers.
 *
 * Props:
 *   - books: array of book objects with { id, city, country, latitude, longitude, cover_url }
 *   - onBookClick: callback(bookId) when a marker is clicked
 *   - height: map container height (default '500px')
 */
export default function WorldMap({ books = [], onBookClick, height = '500px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    injectKeyframes();
  }, []);

  /* ── Initialize Leaflet ──────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (typeof window === 'undefined' || !window.L) return;

    const L = window.L;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      dragging: true,
    }).setView([20, 0], 2);

    // CartoDB Dark Matter tiles
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 18 }
    ).addTo(map);

    const locatedBooks = books.filter((b) => b.latitude && b.longitude);
    const bounds = [];

    locatedBooks.forEach((book, index) => {
      const latlng = [book.latitude, book.longitude];
      bounds.push(latlng);

      const icon = L.divIcon({
        className: 'voyage-world-pin',
        html: goldPinHTML(),
        iconSize: [24, 34],
        iconAnchor: [12, 34],
        popupAnchor: [0, -36],
      });

      const marker = L.marker(latlng, { icon }).addTo(map);

      // Staggered animation delay
      setTimeout(() => {
        const el = marker.getElement();
        if (el) {
          el.style.animationDelay = `${index * 150}ms`;
        }
      }, 50);

      // Tooltip with city/country
      const label = [book.city, book.country].filter(Boolean).join(', ') || `Location ${index + 1}`;
      marker.bindTooltip(label, {
        className: 'voyage-world-tooltip',
        direction: 'top',
        offset: [0, -8],
        opacity: 1,
      });

      // Click handler
      if (onBookClick) {
        marker.on('click', () => onBookClick(book.id));
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }

    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [books, onBookClick]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        border: '1px solid #C9A96E',
        boxShadow: '0 0 20px rgba(201,169,110,0.15), inset 0 0 20px rgba(201,169,110,0.05)',
        overflow: 'hidden',
        backgroundColor: '#0A0A0A',
      }}
    >
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
