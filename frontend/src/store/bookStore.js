import { create } from 'zustand';

/**
 * Data store for books and pages.
 */
const useBookStore = create((set) => ({
  // ── Books ────────────────────────────────────────────
  books: [],
  setBooks: (books) => set({ books: Array.isArray(books) ? books : [] }),

  addBook: (book) =>
    set((state) => ({ books: [...state.books, book] })),

  removeBook: (id) =>
    set((state) => ({
      books: state.books.filter((b) => b.id !== id),
    })),

  updateBookInStore: (id, data) =>
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...data } : b)),
    })),

  // ── Current book ─────────────────────────────────────
  currentBook: null,
  setCurrentBook: (book) => set({ currentBook: book }),

  // ── Pages ────────────────────────────────────────────
  pages: [],
  setPages: (pages) => set({ pages: Array.isArray(pages) ? pages : [] }),

  addPage: (page) =>
    set((state) => ({ pages: [...state.pages, page] })),

  removePage: (id) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
    })),

  updatePageInStore: (id, data) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  // ── Current page (for editing) ───────────────────────
  currentPage: null,
  setCurrentPage: (page) => set({ currentPage: page }),
}));

export default useBookStore;
