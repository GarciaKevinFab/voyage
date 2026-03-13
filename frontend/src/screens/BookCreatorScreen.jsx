import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';
import { TRAVEL_QUOTES, SPINE_COLORS } from '../utils/constants';
import * as api from '../services/api';

const dotsKeyframes = `
@keyframes dot-wave-1 {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}
@keyframes dot-wave-2 {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}
@keyframes dot-wave-3 {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}
@keyframes quote-fade {
  0% { opacity: 0; transform: translateY(8px); }
  15% { opacity: 1; transform: translateY(0); }
  85% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-8px); }
}
`;

const inputStyle = {
  width: '100%',
  padding: '12px 0',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid #C9A96E',
  outline: 'none',
  fontFamily: "'Josefin Sans', sans-serif",
  fontWeight: 300,
  fontSize: '14px',
  letterSpacing: '0.1em',
  color: '#0A0A0A',
  transition: 'border-color 300ms ease',
};

const labelStyle = {
  fontFamily: "'Josefin Sans', sans-serif",
  fontWeight: 300,
  fontSize: '10px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: '#8A8478',
  marginBottom: '4px',
  display: 'block',
};

export default function BookCreatorScreen({ isOpen, onClose, onBookCreated }) {
  const { addToast } = useAppStore();

  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);

  const quoteInterval = useRef(null);

  useEffect(() => {
    if (isCreating) {
      setCurrentQuote(Math.floor(Math.random() * TRAVEL_QUOTES.length));
      quoteInterval.current = setInterval(() => {
        setCurrentQuote((prev) => (prev + 1) % TRAVEL_QUOTES.length);
      }, 4000);
    }
    return () => {
      if (quoteInterval.current) clearInterval(quoteInterval.current);
    };
  }, [isCreating]);

  const resetForm = () => {
    setCountry('');
    setCity('');
    setStartDate('');
    setEndDate('');
    setSubtitle('');
    setIsCreating(false);
  };

  const handleClose = () => {
    if (isCreating) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!country.trim() || !city.trim() || !startDate) {
      addToast({ type: 'error', message: 'Please fill in required fields' });
      return;
    }

    setIsCreating(true);

    try {
      const spineColor =
        SPINE_COLORS[Math.floor(Math.random() * SPINE_COLORS.length)];

      const bookData = {
        country: country.trim(),
        city: city.trim(),
        start_date: startDate,
        end_date: endDate || startDate,
        subtitle: subtitle.trim() || undefined,
        spine_color: spineColor,
      };

      // 1. Create the book
      const newBook = await api.createBook(bookData);

      // 2. Generate cover and intro in parallel
      try {
        const [coverResult, introResult] = await Promise.allSettled([
          api.getCover(newBook.city, newBook.country),
          api.getIntro({
            city: newBook.city,
            country: newBook.country,
            start_date: newBook.start_date,
            end_date: newBook.end_date,
            subtitle: newBook.subtitle,
          }),
        ]);

        // Update book with generated cover/intro
        const updates = {};
        if (coverResult.status === 'fulfilled' && coverResult.value?.url) {
          updates.cover_url = coverResult.value.url;
        }
        if (introResult.status === 'fulfilled' && introResult.value?.text) {
          updates.intro = introResult.value.text;
        }
        if (Object.keys(updates).length > 0) {
          await api.updateBook(newBook.id, updates);
        }
      } catch (genErr) {
        console.warn('AI generation partial failure:', genErr);
      }

      addToast({ type: 'success', message: 'Book created successfully' });
      resetForm();
      onBookCreated?.(newBook);
    } catch (err) {
      console.error('Failed to create book:', err);
      addToast({ type: 'error', message: 'Failed to create book' });
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>{dotsKeyframes}</style>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(10, 10, 10, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Modal box */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.645, 0.045, 0.355, 1.0] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#F5F0E8',
                border: '1px solid #C9A96E',
                borderRadius: '2px',
                maxWidth: '540px',
                width: '90%',
                padding: '48px 40px',
                position: 'relative',
              }}
            >
              {/* Close button */}
              {!isCreating && (
                <button
                  onClick={handleClose}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Josefin Sans', sans-serif",
                    fontSize: '20px',
                    color: '#8A8478',
                    padding: '4px 8px',
                    transition: 'color 300ms ease',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#0A0A0A')}
                  onMouseLeave={(e) => (e.target.style.color = '#8A8478')}
                >
                  {'\u00D7'}
                </button>
              )}

              {isCreating ? (
                /* ── Loading state ── */
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '280px',
                    gap: '32px',
                  }}
                >
                  {/* Three gold dots */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#C9A96E',
                          animation: `dot-wave-${i + 1} 1.2s ${i * 0.15}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Rotating quote */}
                  <div
                    style={{
                      textAlign: 'center',
                      maxWidth: '380px',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <p
                      key={currentQuote}
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: 'italic',
                        fontWeight: 300,
                        fontSize: '15px',
                        lineHeight: 1.8,
                        color: '#8A8478',
                        animation: 'quote-fade 4s ease forwards',
                      }}
                    >
                      {TRAVEL_QUOTES[currentQuote]}
                    </p>
                  </div>

                  <p
                    style={{
                      fontFamily: "'Josefin Sans', sans-serif",
                      fontWeight: 200,
                      fontSize: '10px',
                      letterSpacing: '0.4em',
                      textTransform: 'uppercase',
                      color: '#8A8478',
                    }}
                  >
                    CREATING YOUR BOOK
                  </p>
                </div>
              ) : (
                /* ── Form ── */
                <form onSubmit={handleSubmit}>
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 300,
                      fontSize: '28px',
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      color: '#0A0A0A',
                      textAlign: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    NEW JOURNEY
                  </h2>
                  <div
                    style={{
                      width: '40px',
                      height: '1px',
                      backgroundColor: '#C9A96E',
                      margin: '0 auto 36px',
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Country */}
                    <div>
                      <label style={labelStyle}>Country *</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. Japan"
                        required
                        style={inputStyle}
                        onFocus={(e) =>
                          (e.target.style.borderBottomColor = '#A07840')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderBottomColor = '#C9A96E')
                        }
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label style={labelStyle}>City *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Kyoto"
                        required
                        style={inputStyle}
                        onFocus={(e) =>
                          (e.target.style.borderBottomColor = '#A07840')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderBottomColor = '#C9A96E')
                        }
                      />
                    </div>

                    {/* Date row */}
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Start Date *</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                          style={inputStyle}
                          onFocus={(e) =>
                            (e.target.style.borderBottomColor = '#A07840')
                          }
                          onBlur={(e) =>
                            (e.target.style.borderBottomColor = '#C9A96E')
                          }
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          style={inputStyle}
                          onFocus={(e) =>
                            (e.target.style.borderBottomColor = '#A07840')
                          }
                          onBlur={(e) =>
                            (e.target.style.borderBottomColor = '#C9A96E')
                          }
                        />
                      </div>
                    </div>

                    {/* Subtitle */}
                    <div>
                      <label style={labelStyle}>Subtitle (optional)</label>
                      <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="e.g. A spring awakening"
                        style={inputStyle}
                        onFocus={(e) =>
                          (e.target.style.borderBottomColor = '#A07840')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderBottomColor = '#C9A96E')
                        }
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      marginTop: '40px',
                      padding: '14px 0',
                      backgroundColor: 'transparent',
                      border: '1px solid #C9A96E',
                      borderRadius: '1px',
                      cursor: 'pointer',
                      fontFamily: "'Josefin Sans', sans-serif",
                      fontWeight: 300,
                      fontSize: '12px',
                      letterSpacing: '0.4em',
                      textTransform: 'uppercase',
                      color: '#C9A96E',
                      transition: 'all 300ms cubic-bezier(0.645, 0.045, 0.355, 1.000)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#C9A96E';
                      e.target.style.color = '#F5F0E8';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#C9A96E';
                    }}
                  >
                    CREATE BOOK
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
