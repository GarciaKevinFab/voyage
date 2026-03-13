import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useBookStore from '../store/bookStore';
import { getBooks } from '../services/api';
import LoadingOverlay from '../components/shared/LoadingOverlay';
import { TRAVEL_QUOTES, SPINE_COLORS } from '../utils/constants';

/* ── Easing ────────────────────────────────────────────── */
const LUXURY_EASE = [0.645, 0.045, 0.355, 1];

/* ── Count-up hook ─────────────────────────────────────── */
function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    }

    ref.current = requestAnimationFrame(tick);
  }, [target, duration]);

  useEffect(() => {
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, []);

  return { value, start };
}

/* ── Stat item ─────────────────────────────────────────── */
function StatItem({ number, label, delay = 0 }) {
  const counter = useCountUp(number, 1500);

  useEffect(() => {
    const t = setTimeout(() => counter.start(), delay);
    return () => clearTimeout(t);
  }, [delay]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay / 1000, ease: LUXURY_EASE }}
      style={{ textAlign: 'center' }}
    >
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 300,
          fontSize: '80px',
          lineHeight: 1,
          color: '#0A0A0A',
        }}
      >
        {counter.value}
      </div>
      <div
        style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 200,
          fontSize: '10px',
          letterSpacing: '0.3em',
          color: '#8A8478',
          marginTop: '12px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </motion.div>
  );
}

/* ── Mini book spine ───────────────────────────────────── */
function BookSpine({ book, index, onClick }) {
  const color = SPINE_COLORS[index % SPINE_COLORS.length];
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.8 + index * 0.15, ease: LUXURY_EASE }}
      onClick={onClick}
      style={{
        width: '48px',
        height: '240px',
        backgroundColor: color,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'transform 500ms cubic-bezier(0.645, 0.045, 0.355, 1)',
        boxShadow: '2px 2px 8px rgba(0,0,0,0.15)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-12px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 300,
          fontSize: '9px',
          letterSpacing: '0.25em',
          color: '#FAFAF7',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxHeight: '200px',
        }}
      >
        {book.city || 'VOYAGE'}
      </span>
    </motion.div>
  );
}

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { books, setBooks } = useBookStore();
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  /* ── Load books ──────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getBooks();
        if (!cancelled) {
          setBooks(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [setBooks]);

  /* ── Compute stats ───────────────────────────────────── */
  const stats = useMemo(() => {
    const countries = new Set();
    const cities = new Set();
    let photos = 0;
    let songs = 0;
    let days = 0;
    let pageCount = 0;

    books.forEach((book) => {
      if (book.country) countries.add(book.country);
      if (book.city) cities.add(book.city);
      photos += book.page_count || 0;
      songs += book.song_count || 0;
      pageCount += (book.page_count || 0) + 2; // cover + epilogue

      if (book.start_date && book.end_date) {
        const start = new Date(book.start_date);
        const end = new Date(book.end_date);
        days += Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      }
    });

    return {
      countries: countries.size,
      cities: cities.size,
      photos,
      songs,
      days,
      pages: pageCount,
    };
  }, [books]);

  /* ── Map markers ─────────────────────────────────────── */
  const markers = useMemo(() => {
    return books
      .filter((b) => b.latitude && b.longitude)
      .map((b) => ({
        lat: b.latitude,
        lng: b.longitude,
        label: b.city || b.country || '',
      }));
  }, [books]);

  /* ── Leaflet map ─────────────────────────────────────── */
  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return;
    if (typeof window === 'undefined' || !window.L) return;

    const L = window.L;
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false,
    }).setView([20, 0], 2);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { maxZoom: 18 }
    ).addTo(map);

    const goldIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 10px; height: 10px;
        background: #C9A96E;
        border: 2px solid #A07840;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(201,169,110,0.5);
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const bounds = [];
    markers.forEach((m) => {
      const latlng = [m.lat, m.lng];
      bounds.push(latlng);
      L.marker(latlng, { icon: goldIcon })
        .bindTooltip(m.label, {
          className: 'voyage-tooltip',
          direction: 'top',
          offset: [0, -10],
        })
        .addTo(map);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loading, markers]);

  /* ── Render ──────────────────────────────────────────── */
  if (loading) {
    return <LoadingOverlay isVisible quotes={TRAVEL_QUOTES} />;
  }

  const recentBooks = [...books]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 3);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F0E8',
        padding: '60px 40px 80px',
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: LUXURY_EASE }}
        style={{ textAlign: 'center', marginBottom: '64px' }}
      >
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontSize: '2.5rem',
            letterSpacing: '0.6em',
            color: '#0A0A0A',
            textTransform: 'uppercase',
            lineHeight: 1.6,
          }}
        >
          TUS VIAJES
        </h1>
        <div
          style={{
            width: '60px',
            height: '1px',
            backgroundColor: '#C9A96E',
            margin: '20px auto 0',
          }}
        />
      </motion.header>

      {/* ── Stats grid ─────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '48px',
          maxWidth: '900px',
          margin: '0 auto 80px',
        }}
      >
        <StatItem number={stats.countries} label="Pa\u00edses visitados" delay={100} />
        <StatItem number={stats.cities} label="Ciudades exploradas" delay={200} />
        <StatItem number={stats.photos} label="Fotograf\u00edas" delay={300} />
        <StatItem number={stats.songs} label="Canciones asignadas" delay={400} />
        <StatItem number={stats.days} label="D\u00edas de viaje" delay={500} />
        <StatItem number={stats.pages} label="P\u00e1ginas escritas" delay={600} />
      </div>

      {/* ── World map ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        style={{
          maxWidth: '1000px',
          margin: '0 auto 80px',
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '350px',
            backgroundColor: '#FAFAF7',
          }}
        />
      </motion.div>

      {/* ── Recent books ───────────────────────────────── */}
      {recentBooks.length > 0 && (
        <div style={{ maxWidth: '600px', margin: '0 auto 60px' }}>
          <h2
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 200,
              fontSize: '10px',
              letterSpacing: '0.4em',
              color: '#8A8478',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            Recientes
          </h2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              alignItems: 'flex-end',
            }}
          >
            {recentBooks.map((book, i) => (
              <BookSpine
                key={book.id}
                book={book}
                index={i}
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Back button ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        style={{ textAlign: 'center' }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 200,
            fontSize: '11px',
            letterSpacing: '0.3em',
            color: '#8A8478',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '12px 24px',
            transition: 'color 400ms',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0A0A0A')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8A8478')}
        >
          &#8592; Volver a la estanter&iacute;a
        </button>
      </motion.div>
    </div>
  );
}
