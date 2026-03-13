import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useBookStore from '../store/bookStore';
import usePageFlip from '../hooks/usePageFlip';
import useAudio from '../hooks/useAudio';
import useNarration from '../hooks/useNarration';
import useParallax from '../hooks/useParallax';
import { getBook, getPages } from '../services/api';
import { FILTERS } from '../utils/constants';
import FlipPage from '../components/flipbook/FlipPage';
import DustParticles from '../components/flipbook/DustParticles';
import PageCover from '../components/flipbook/PageCover';
import PageMap from '../components/flipbook/PageMap';
import PageEpilogue from '../components/flipbook/PageEpilogue';
import LoadingOverlay from '../components/shared/LoadingOverlay';
import { TRAVEL_QUOTES } from '../utils/constants';

/* ── luxury easing ─────────────────────────────────────── */
const LUXURY_EASE = [0.645, 0.045, 0.355, 1];

/* ── Letter-by-letter text reveal ─────────────────────── */
function RevealText({ text, style, delay = 0 }) {
  if (!text) return null;
  return (
    <span style={{ ...style, display: 'inline' }}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            opacity: 0,
            animation: `charReveal 300ms ${delay + i * 18}ms forwards`,
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

/* ── Styles ────────────────────────────────────────────── */
const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#0A0A0A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 50,
  },
  bookContainer: {
    perspective: '2000px',
    transformStyle: 'preserve-3d',
    display: 'flex',
    width: 'min(90vw, 1200px)',
    height: 'min(68vh, 700px)',
    position: 'relative',
  },
  leftPage: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  rightPage: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F5F0E8',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 48px',
  },
  photo: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  caption: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic',
    fontSize: '18px',
    lineHeight: 2.2,
    color: '#0A0A0A',
    textAlign: 'center',
    maxWidth: '85%',
  },
  songCredit: {
    position: 'absolute',
    bottom: '24px',
    left: '32px',
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 200,
    fontSize: '10px',
    color: '#8A8478',
    letterSpacing: '0.1em',
  },
  pageNumber: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 200,
    fontSize: '9px',
    color: '#C9A96E',
    letterSpacing: '0.15em',
  },
  controls: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 20,
    transition: 'opacity 400ms',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#C9A96E',
    fontSize: '28px',
    cursor: 'pointer',
    opacity: 0.4,
    transition: 'opacity 400ms, transform 300ms',
    pointerEvents: 'auto',
    padding: '20px',
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 200,
  },
  topControls: {
    position: 'absolute',
    top: '20px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    pointerEvents: 'auto',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    color: '#C9A96E',
    cursor: 'pointer',
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 200,
    fontSize: '12px',
    letterSpacing: '0.15em',
    opacity: 0.6,
    transition: 'opacity 400ms',
    padding: '6px 10px',
    textTransform: 'uppercase',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 200,
    fontSize: '10px',
    color: '#C9A96E',
    letterSpacing: '0.2em',
    pointerEvents: 'auto',
    opacity: 0.6,
  },
  introPage: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 48px',
  },
};

/* ── Keyframes (injected once) ─────────────────────────── */
const KEYFRAMES_ID = 'voyage-flipbook-keyframes';

function injectKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const sheet = document.createElement('style');
  sheet.id = KEYFRAMES_ID;
  sheet.textContent = `
    @keyframes charReveal {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pageTurnForward {
      0%   { transform: rotateY(0deg); }
      40%  { box-shadow: -8px 0 24px rgba(0,0,0,0.4); }
      100% { transform: rotateY(-180deg); }
    }
    @keyframes pageTurnBackward {
      0%   { transform: rotateY(-180deg); }
      40%  { box-shadow: 8px 0 24px rgba(0,0,0,0.4); }
      100% { transform: rotateY(0deg); }
    }
  `;
  document.head.appendChild(sheet);
}

export default function FlipbookScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentBook, setCurrentBook, pages, setPages } = useBookStore();

  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef(null);
  const [dustActive, setDustActive] = useState(false);
  const [dustDirection, setDustDirection] = useState('forward');
  const [touchStart, setTouchStart] = useState(null);

  /* ── Build spread data ────────────────────────────────── */
  const spreads = useMemo(() => {
    if (!currentBook || !pages) return [];
    const result = [];

    // 0: Cover spread — left: cover photo, right: blank or title
    result.push({ type: 'cover', data: currentBook });

    // 1: Intro spread — both pages cream with intro text
    if (currentBook.intro) {
      result.push({ type: 'intro', data: currentBook });
    }

    // Regular page spreads
    pages.forEach((page, idx) => {
      result.push({ type: 'page', data: page, pageNum: idx + 1 });
    });

    // Map spread (penultimate)
    const pagesWithCoords = pages.filter((p) => p.latitude && p.longitude);
    if (pagesWithCoords.length > 0) {
      result.push({ type: 'map', data: pagesWithCoords });
    }

    // Epilogue spread (last)
    if (currentBook.epilogue) {
      result.push({ type: 'epilogue', data: currentBook });
    }

    return result;
  }, [currentBook, pages]);

  const totalSpreads = spreads.length;

  const handleFlip = useCallback(
    (nextSpread) => {
      setDustDirection(
        nextSpread > flipRef.current ? 'forward' : 'backward'
      );
      setDustActive(true);
      setTimeout(() => setDustActive(false), 950);
    },
    []
  );

  const flipRef = useRef(0);

  const {
    currentSpread,
    totalSpreads: ts,
    goNext,
    goPrev,
    isTurning,
  } = usePageFlip(totalSpreads * 2, {
    onFlip: (next) => {
      handleFlip(next);
      flipRef.current = next;
    },
    onExit: () => navigate(-1),
  });

  const { playPageTurn, toggleSound, isSoundEnabled } = useAudio();
  const { narratePage, stopNarration, toggleNarration, isNarrating } = useNarration();
  const parallax = useParallax({ intensity: 12, smoothing: 0.06 });

  /* ── Load data ────────────────────────────────────────── */
  useEffect(() => {
    injectKeyframes();
    let cancelled = false;

    async function load() {
      try {
        const [book, pagesData] = await Promise.all([
          getBook(id),
          getPages(id),
        ]);
        if (!cancelled) {
          setCurrentBook(book);
          setPages(pagesData);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, setCurrentBook, setPages]);

  /* ── Entry animation ──────────────────────────────────── */
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setEntered(true), 100);
      return () => clearTimeout(t);
    }
  }, [loading]);

  /* ── Controls auto-hide ───────────────────────────────── */
  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2000);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', showControls);
    return () => window.removeEventListener('mousemove', showControls);
  }, [showControls]);

  /* ── Navigation helpers ───────────────────────────────── */
  const handleNext = useCallback(() => {
    goNext();
    playPageTurn();
  }, [goNext, playPageTurn]);

  const handlePrev = useCallback(() => {
    goPrev();
    playPageTurn();
  }, [goPrev, playPageTurn]);

  const handleClickArea = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 2) {
        handlePrev();
      } else {
        handleNext();
      }
    },
    [handleNext, handlePrev]
  );

  /* ── Touch swipe ──────────────────────────────────────── */
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStart(null);
  };

  /* ── Current spread content ───────────────────────────── */
  const spread = spreads[currentSpread] || null;

  const getCurrentCaption = () => {
    if (!spread) return '';
    if (spread.type === 'page') return spread.data.caption || '';
    if (spread.type === 'intro') return spread.data.intro || '';
    if (spread.type === 'epilogue') return spread.data.epilogue || '';
    return '';
  };

  /* ── Render spread content ───────────────────────────── */
  const renderSpread = () => {
    if (!spread) return null;

    switch (spread.type) {
      case 'cover':
        return (
          <>
            <div style={styles.leftPage}>
              <PageCover book={spread.data} parallaxStyle={parallax.style} />
            </div>
            <div style={{ ...styles.rightPage, backgroundColor: '#0A0A0A' }}>
              <div
                style={{
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '1px',
                    backgroundColor: '#C9A96E',
                    marginBottom: '8px',
                  }}
                />
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontSize: '28px',
                    color: '#F5F0E8',
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                  }}
                >
                  {spread.data.city || 'VOYAGE'}
                </h2>
                <p
                  style={{
                    fontFamily: "'Josefin Sans', sans-serif",
                    fontWeight: 200,
                    fontSize: '11px',
                    color: '#C9A96E',
                    letterSpacing: '0.3em',
                  }}
                >
                  {spread.data.country || ''}
                </p>
                <div
                  style={{
                    width: '40px',
                    height: '1px',
                    backgroundColor: '#C9A96E',
                    marginTop: '8px',
                  }}
                />
              </div>
            </div>
          </>
        );

      case 'intro':
        return (
          <>
            <div style={styles.introPage}>
              <div style={{ width: '80px', height: '1px', backgroundColor: '#C9A96E', marginBottom: '40px' }} />
              <div style={styles.caption}>
                <RevealText text={spread.data.intro} style={{}} />
              </div>
              <div style={{ width: '80px', height: '1px', backgroundColor: '#C9A96E', marginTop: '40px' }} />
            </div>
            <div style={styles.introPage}>
              {/* Right page of intro is intentionally blank / decorative */}
              <p
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 200,
                  fontSize: '9px',
                  color: '#C9A96E',
                  letterSpacing: '0.5em',
                  textTransform: 'uppercase',
                }}
              >
                {spread.data.city}
              </p>
            </div>
          </>
        );

      case 'page': {
        const page = spread.data;
        const filterCSS = page.filter ? FILTERS[page.filter] || 'none' : 'none';
        return (
          <>
            <div style={styles.leftPage} onClick={handleClickArea}>
              <div style={parallax.style}>
                <img
                  src={page.photo}
                  alt={page.caption || ''}
                  style={{
                    ...styles.photo,
                    filter: filterCSS,
                    transform: 'scale(1.08)',
                    transition: 'transform 700ms cubic-bezier(0.645, 0.045, 0.355, 1)',
                  }}
                />
              </div>
            </div>
            <div style={styles.rightPage}>
              <div style={styles.caption}>
                <RevealText text={page.caption || ''} style={{}} key={currentSpread} />
              </div>
              {page.song_artist && page.song_title && (
                <span style={styles.songCredit}>
                  &#9833; {page.song_artist} &middot; {page.song_title}
                </span>
              )}
              <span style={styles.pageNumber}>{spread.pageNum}</span>
            </div>
          </>
        );
      }

      case 'map':
        return (
          <>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <PageMap locations={spread.data} />
            </div>
            <div style={styles.rightPage}>
              <p
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 200,
                  fontSize: '11px',
                  letterSpacing: '0.5em',
                  color: '#8A8478',
                  textTransform: 'uppercase',
                }}
              >
                Recorrido
              </p>
            </div>
          </>
        );

      case 'epilogue':
        return (
          <>
            <div style={styles.introPage}>
              <PageEpilogue text={spread.data.epilogue} />
            </div>
            <div
              style={{
                ...styles.introPage,
                justifyContent: 'flex-end',
                paddingBottom: '48px',
              }}
            >
              <p
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 200,
                  fontSize: '9px',
                  color: '#8A8478',
                  letterSpacing: '0.3em',
                }}
              >
                VOYAGE
              </p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  /* ── Loading state ────────────────────────────────────── */
  if (loading) {
    return <LoadingOverlay isVisible quotes={TRAVEL_QUOTES} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={styles.root}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Book ──────────────────────────────────────────── */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={entered ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, ease: LUXURY_EASE }}
        style={styles.bookContainer}
        onClick={handleClickArea}
      >
        {/* Page turn overlay (3D flip layer) */}
        <AnimatePresence>
          {isTurning && (
            <FlipPage
              direction={dustDirection}
              isTurning={isTurning}
            />
          )}
        </AnimatePresence>

        {/* Spread content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSpread}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'flex', width: '100%', height: '100%' }}
          >
            {renderSpread()}
          </motion.div>
        </AnimatePresence>

        {/* Spine shadow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '12px',
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.08) 30%, transparent 50%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.3) 100%)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />

        {/* Dust particles */}
        <DustParticles isActive={dustActive} direction={dustDirection} />
      </motion.div>

      {/* ── Controls overlay ──────────────────────────────── */}
      <div
        style={{
          ...styles.controls,
          opacity: controlsVisible ? 1 : 0,
        }}
      >
        {/* Left arrow */}
        {currentSpread > 0 && (
          <button
            style={{ ...styles.arrow, left: '16px' }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-50%) translateX(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.4';
              e.currentTarget.style.transform = 'translateY(-50%)';
            }}
          >
            &#8592;
          </button>
        )}

        {/* Right arrow */}
        {currentSpread < totalSpreads - 1 && (
          <button
            style={{ ...styles.arrow, right: '16px' }}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-50%) translateX(3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.4';
              e.currentTarget.style.transform = 'translateY(-50%)';
            }}
          >
            &#8594;
          </button>
        )}

        {/* Top controls */}
        <div style={styles.topControls}>
          <button
            style={{
              ...styles.iconButton,
              color: isSoundEnabled ? '#C9A96E' : '#8A8478',
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggleSound();
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            {isSoundEnabled ? '♪ ON' : '♪ OFF'}
          </button>

          <button
            style={{
              ...styles.iconButton,
              color: isNarrating ? '#C9A96E' : '#8A8478',
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggleNarration(getCurrentCaption());
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            {isNarrating ? 'NARRAR ■' : 'NARRAR ▶'}
          </button>

          <button
            style={{ ...styles.iconButton, fontSize: '18px' }}
            onClick={(e) => {
              e.stopPropagation();
              stopNarration();
              navigate(-1);
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            &times;
          </button>
        </div>

        {/* Page indicator */}
        <div style={styles.pageIndicator}>
          {currentSpread + 1} / {totalSpreads}
        </div>
      </div>
    </motion.div>
  );
}
