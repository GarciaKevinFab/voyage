import { create } from 'zustand';

/**
 * Global music state store.
 *
 * Track shape:
 *   { id, name, artist, album, album_art, preview_url, duration_ms }
 */
const useMusicStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────
  currentTrack: null,
  queue: [],
  isPlaying: false,
  isPlaylistOpen: false,

  // ── Actions ────────────────────────────────────────────

  play: (track) =>
    set((state) => {
      // If the track is already in the queue we don't duplicate it
      const alreadyQueued = state.queue.some((t) => t.id === track.id);
      return {
        currentTrack: track,
        isPlaying: true,
        queue: alreadyQueued ? state.queue : [...state.queue, track],
      };
    }),

  pause: () => set({ isPlaying: false }),

  resume: () => set({ isPlaying: true }),

  next: () =>
    set((state) => {
      if (state.queue.length === 0) return {};
      const idx = state.queue.findIndex(
        (t) => t.id === state.currentTrack?.id,
      );
      const nextIdx = idx + 1;
      if (nextIdx >= state.queue.length) {
        // End of queue — stop playback
        return { isPlaying: false };
      }
      return { currentTrack: state.queue[nextIdx], isPlaying: true };
    }),

  prev: () =>
    set((state) => {
      if (state.queue.length === 0) return {};
      const idx = state.queue.findIndex(
        (t) => t.id === state.currentTrack?.id,
      );
      const prevIdx = idx - 1;
      if (prevIdx < 0) return {};
      return { currentTrack: state.queue[prevIdx], isPlaying: true };
    }),

  setQueue: (tracks) =>
    set({ queue: Array.isArray(tracks) ? tracks : [] }),

  addToQueue: (track) =>
    set((state) => {
      if (state.queue.some((t) => t.id === track.id)) return {};
      return { queue: [...state.queue, track] };
    }),

  togglePlaylist: () =>
    set((state) => ({ isPlaylistOpen: !state.isPlaylistOpen })),

  clearQueue: () =>
    set({ currentTrack: null, queue: [], isPlaying: false }),
}));

export default useMusicStore;
