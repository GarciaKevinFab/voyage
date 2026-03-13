import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const shimmerKeyframes = `
@keyframes spine-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes book-open {
  0% { transform: perspective(800px) rotateY(0deg); }
  50% { transform: perspective(800px) rotateY(-90deg); }
  100% { transform: perspective(800px) rotateY(-180deg); }
}
`;

export default function BookSpine({ book, onClick, onContextMenu }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const pagesCount = book.pages_count || book.pages?.length || 5;
  const width = Math.min(90, Math.max(40, 20 + pagesCount * 4));

  const year = book.start_date
    ? new Date(book.start_date).getFullYear()
    : '';

  const handleClick = (e) => {
    if (isDragging) return;
    setIsOpening(true);
    setTimeout(() => {
      onClick?.(book);
      setIsOpening(false);
    }, 500);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, book);
  };

  const spineColor = book.spine_color || '#C9A96E';

  // Darken the spine color for depth
  const darkenColor = (hex, amount) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
    const b = Math.max(0, (num & 0x0000ff) - amount);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  };

  const spineColorDark = darkenColor(spineColor, 40);

  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div
        ref={setNodeRef}
        style={sortableStyle}
        {...attributes}
        {...listeners}
      >
        <div
          style={{
            perspective: '800px',
            cursor: 'pointer',
            paddingBottom: '12px',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        >
          <div
            style={{
              width: `${width}px`,
              height: '70vh',
              background: `linear-gradient(135deg, ${spineColor} 0%, ${spineColorDark} 100%)`,
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: isOpening
                ? 'perspective(800px) rotateY(-30deg)'
                : isHovered
                  ? 'translateZ(30px) rotateY(-8deg)'
                  : 'translateZ(0) rotateY(0deg)',
              transition: isOpening
                ? 'transform 500ms cubic-bezier(0.645, 0.045, 0.355, 1.000)'
                : 'transform 300ms cubic-bezier(0.645, 0.045, 0.355, 1.000)',
              boxShadow: isHovered
                ? `8px 8px 24px rgba(0,0,0,0.6), 2px 2px 8px rgba(0,0,0,0.3)`
                : '2px 2px 8px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              opacity: isDragging ? 0.5 : 1,
            }}
          >
            {/* Gold shimmer overlay on hover */}
            {isHovered && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.15) 45%, rgba(232,213,163,0.25) 50%, rgba(201,169,110,0.15) 55%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'spine-shimmer 1.5s ease infinite',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />
            )}

            {/* Top decorative line */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20%',
                right: '20%',
                height: '1px',
                backgroundColor: 'rgba(245,240,232,0.3)',
              }}
            />

            {/* Country (main title) */}
            <div
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 300,
                fontSize: '13px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: '#F5F0E8',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '40px',
                paddingBottom: '40px',
                zIndex: 1,
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {book.country || 'UNTITLED'}
            </div>

            {/* City (secondary) */}
            {book.city && (
              <div
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 200,
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  color: '#8A8478',
                  position: 'absolute',
                  right: width > 55 ? '8px' : '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              >
                {book.city}
              </div>
            )}

            {/* Year at bottom */}
            {year && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 200,
                  fontSize: '9px',
                  letterSpacing: '0.2em',
                  color: 'rgba(245,240,232,0.5)',
                  zIndex: 1,
                }}
              >
                {year}
              </div>
            )}

            {/* Bottom decorative line */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '20%',
                right: '20%',
                height: '1px',
                backgroundColor: 'rgba(245,240,232,0.2)',
              }}
            />

            {/* 3D side face */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: '-15px',
                width: '15px',
                height: '100%',
                background: `linear-gradient(90deg, ${spineColorDark}, ${darkenColor(spineColor, 70)})`,
                transformOrigin: 'left center',
                transform: 'rotateY(90deg)',
              }}
            />

            {/* 3D top face */}
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                left: 0,
                width: '100%',
                height: '8px',
                background: darkenColor(spineColor, 20),
                transformOrigin: 'bottom center',
                transform: 'rotateX(90deg)',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
