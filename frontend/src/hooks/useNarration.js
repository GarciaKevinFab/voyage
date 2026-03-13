import { useState, useCallback, useRef } from 'react';

/**
 * Web Speech API hook for reading page captions aloud.
 *
 * Returns { narratePage, stopNarration, toggleNarration, isNarrating }
 */
export default function useNarration() {
  const [isNarrating, setIsNarrating] = useState(false);
  const utteranceRef = useRef(null);

  /**
   * Narrate the given text using SpeechSynthesis.
   * @param {string} text - Text to speak.
   * @param {string} lang - BCP-47 language tag (default 'es-ES').
   */
  const narratePage = useCallback((text, lang = 'es-ES') => {
    if (!text || !('speechSynthesis' in window)) return;

    // Stop any ongoing narration first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // Try to pick a voice for the requested language
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
    if (match) utterance.voice = match;

    utterance.onstart = () => setIsNarrating(true);
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  /**
   * Stop any ongoing narration.
   */
  const stopNarration = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsNarrating(false);
  }, []);

  /**
   * Toggle narration on/off for the given text.
   * @param {string} text
   * @param {string} lang
   */
  const toggleNarration = useCallback(
    (text, lang = 'es-ES') => {
      if (isNarrating) {
        stopNarration();
      } else {
        narratePage(text, lang);
      }
    },
    [isNarrating, narratePage, stopNarration]
  );

  return { narratePage, stopNarration, toggleNarration, isNarrating };
}
