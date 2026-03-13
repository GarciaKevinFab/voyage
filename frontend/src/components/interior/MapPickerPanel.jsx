import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * MapPickerPanel uses Leaflet for map rendering with CartoDB Voyager tiles.
 * Leaflet must be installed: npm install leaflet
 * CSS import: import 'leaflet/dist/leaflet.css' should be in main.jsx or index.css
 */

// Dynamic Leaflet import to avoid SSR issues
let L = null;
const loadLeaflet = async () => {
  if (L) return L;
  const leaflet = await import('leaflet');
  L = leaflet.default || leaflet;
  return L;
};

/* ── Gold marker icon (SVG data URI) ──────────────── */
const GOLD_MARKER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
  <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#C9A96E"/>
  <circle cx="12" cy="12" r="5" fill="#FAFAF7"/>
</svg>
`)}`;

export default function MapPickerPanel({ page, onUpdatePage, onSetCurrentPage, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentLabel, setCurrentLabel] = useState(page?.location?.label || '');
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    loadLeaflet().then(() => setLeafletLoaded(true));
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const defaultLat = page?.location?.lat || 48.8566;
    const defaultLng = page?.location?.lng || 2.3522;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: false,
    });

    // CartoDB Voyager tiles (editorial, light style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create custom icon
    const goldIcon = L.icon({
      iconUrl: GOLD_MARKER_SVG,
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      popupAnchor: [0, -36],
    });

    // If page already has location, place marker
    if (page?.location?.lat && page?.location?.lng) {
      const marker = L.marker([page.location.lat, page.location.lng], { icon: goldIcon }).addTo(map);
      markerRef.current = marker;
      setCurrentLabel(page.location.label || '');
    }

    // Click handler to place pin
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      placeMarker(map, goldIcon, lat, lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [leafletLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeMarker = useCallback(async (map, icon, lat, lng) => {
    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    const goldIcon = icon || L.icon({
      iconUrl: GOLD_MARKER_SVG,
      iconSize: [24, 36],
      iconAnchor: [12, 36],
    });

    const marker = L.marker([lat, lng], { icon: goldIcon }).addTo(map);
    markerRef.current = marker;

    // Reverse geocode
    let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      if (data.display_name) {
        // Shorten to city-level
        const parts = data.display_name.split(', ');
        label = parts.slice(0, 3).join(', ');
      }
    } catch {
      // Use coordinate fallback
    }

    setCurrentLabel(label);

    // Save to page
    const locationData = { lat, lng, label };
    try {
      await onUpdatePage(page.id, { location: locationData });
      onSetCurrentPage({ ...page, location: locationData });
    } catch {
      // Error handled in hook
    }
  }, [page, onUpdatePage, onSetCurrentPage]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      setSearchResults(data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleSelectResult = useCallback((result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([lat, lng], 14, { animate: true, duration: 0.8 });

    const goldIcon = L.icon({
      iconUrl: GOLD_MARKER_SVG,
      iconSize: [24, 36],
      iconAnchor: [12, 36],
    });

    placeMarker(map, goldIcon, lat, lng);
    setSearchResults([]);
    setSearchQuery('');
  }, [placeMarker]);

  const handleRemoveLocation = useCallback(async () => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setCurrentLabel('');
    try {
      await onUpdatePage(page.id, { location: null });
      onSetCurrentPage({ ...page, location: null });
    } catch {
      // Error handled in hook
    }
  }, [page, onUpdatePage, onSetCurrentPage]);

  return (
    <div
      style={{
        width: '400px',
        height: '100%',
        backgroundColor: '#FAFAF7',
        borderLeft: '1px solid #E8D5A3',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid #E8D5A3',
        }}
      >
        <h3
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 300,
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            color: '#8A8478',
            textTransform: 'uppercase',
          }}
        >
          Location
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: '1rem',
            color: '#8A8478',
            padding: '0 4px',
            transition: 'color 300ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#0A0A0A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8478'; }}
        >
          &times;
        </button>
      </div>

      {/* Current location */}
      {currentLabel && (
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid #E8D5A3',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: '#C9A96E', fontSize: '0.8rem' }}>&#128205;</span>
          <p
            style={{
              flex: 1,
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 400,
              fontSize: '0.8rem',
              color: '#0A0A0A',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentLabel}
          </p>
          <button
            onClick={handleRemoveLocation}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#8A8478',
              transition: 'color 300ms',
              padding: '2px 6px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#c0392b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8478'; }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #E8D5A3' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search location..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #E8D5A3',
              background: 'transparent',
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 200,
              fontSize: '0.75rem',
              color: '#0A0A0A',
              outline: 'none',
              letterSpacing: '0.05em',
              transition: 'border-color 300ms',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#C9A96E'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8D5A3'; }}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0A0A0A',
              color: '#FAFAF7',
              border: 'none',
              cursor: searching ? 'wait' : 'pointer',
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 300,
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              transition: 'background-color 300ms',
            }}
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div
            style={{
              marginTop: '4px',
              border: '1px solid #E8D5A3',
              backgroundColor: '#FAFAF7',
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            {searchResults.map((result, i) => (
              <button
                key={i}
                onClick={() => handleSelectResult(result)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: i < searchResults.length - 1 ? '1px solid #E8D5A3' : 'none',
                  cursor: 'pointer',
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 200,
                  fontSize: '0.65rem',
                  color: '#0A0A0A',
                  lineHeight: 1.5,
                  transition: 'background-color 300ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(232, 213, 163, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {result.display_name?.split(', ').slice(0, 4).join(', ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map container */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {!leafletLoaded && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid #E8D5A3',
                borderTop: '2px solid #C9A96E',
                borderRadius: '50%',
              }}
            />
          </div>
        )}
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      {/* Hint */}
      <div
        style={{
          padding: '10px 20px',
          borderTop: '1px solid #E8D5A3',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 200,
            fontSize: '0.55rem',
            color: '#8A8478',
            letterSpacing: '0.1em',
          }}
        >
          Click on the map to place a pin
        </p>
      </div>
    </div>
  );
}
