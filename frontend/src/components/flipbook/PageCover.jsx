import React from 'react';

/**
 * Cover page: full-bleed photo + dark gradient overlay + text.
 *
 * Props:
 *   - book: { city, country, start_date, end_date, cover_photo }
 *   - parallaxStyle: CSS transform object from useParallax
 */
export default function PageCover({ book, parallaxStyle = {} }) {
  if (!book) return null;

  const formatDates = () => {
    const opts = { day: 'numeric', month: 'long', year: 'numeric' };
    const start = book.start_date
      ? new Date(book.start_date).toLocaleDateString('es-ES', opts)
      : '';
    const end = book.end_date
      ? new Date(book.end_date).toLocaleDateString('es-ES', opts)
      : '';
    if (start && end) return `${start} \u2014 ${end}`;
    return start || end;
  };

  // Use the first page photo or a cover_photo field as the cover image
  const coverImage = book.cover_photo || book.photo || '';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#0A0A0A',
      }}
    >
      {/* Photo with parallax */}
      {coverImage && (
        <div style={{ ...parallaxStyle, position: 'absolute', inset: '-20px' }}>
          <img
            src={coverImage}
            alt={book.city || ''}
            style={{
              width: 'calc(100% + 40px)',
              height: 'calc(100% + 40px)',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* Dark gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, transparent 60%)',
          zIndex: 1,
        }}
      />

      {/* Text content */}
      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          left: '40px',
          right: '40px',
          zIndex: 2,
        }}
      >
        {/* Country */}
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 300,
            fontSize: '11px',
            letterSpacing: '0.5em',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          {book.country || ''}
        </p>

        {/* City */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '36px',
            color: '#FFFFFF',
            lineHeight: 1.3,
            marginBottom: '12px',
          }}
        >
          {book.city || ''}
        </h1>

        {/* Dates */}
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 200,
            fontSize: '11px',
            color: '#C9A96E',
            letterSpacing: '0.15em',
          }}
        >
          {formatDates()}
        </p>
      </div>
    </div>
  );
}
