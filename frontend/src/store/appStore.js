import { create } from 'zustand';

/**
 * Global UI state store.
 */
const useAppStore = create((set) => ({
  // Current screen identifier (for transition effects)
  currentScreen: 'bookshelf',
  setCurrentScreen: (screen) => set({ currentScreen: screen }),

  // Loading overlay
  isLoading: false,
  loadingMessage: '',
  setLoading: (isLoading, loadingMessage = '') =>
    set({ isLoading, loadingMessage }),

  // Toast notifications
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: Date.now(), ...toast },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Side panel (null = closed, 'music' = music panel, 'map' = map panel)
  sidePanel: null,
  setSidePanel: (panel) =>
    set((state) => ({
      sidePanel: state.sidePanel === panel ? null : panel,
    })),
  closeSidePanel: () => set({ sidePanel: null }),
}));

export default useAppStore;
