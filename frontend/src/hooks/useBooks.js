import { useEffect, useCallback } from 'react';
import useBookStore from '../store/bookStore';
import useAppStore from '../store/appStore';
import * as api from '../services/api';
import {
  cacheBooks,
  getCachedBooks,
  cacheBook,
  removeCachedBook,
} from '../services/storageService';

/**
 * Hook that manages the books collection.
 * Loads from API on mount, falls back to IndexedDB cache,
 * and provides create / delete / reorder helpers.
 */
export default function useBooks() {
  const { books, setBooks, addBook, removeBook: removeBookFromStore } = useBookStore();
  const { setLoading, addToast } = useAppStore();

  // ── Load books on mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true, 'Loading your library...');
      try {
        const data = await api.getBooks();
        if (!cancelled) {
          setBooks(data);
          await cacheBooks(data);
        }
      } catch (err) {
        // Offline fallback — load from cache
        console.warn('API unavailable, loading from cache', err);
        const cached = await getCachedBooks().catch(() => []);
        if (!cancelled) {
          setBooks(Array.isArray(cached) ? cached : []);
          if (cached.length > 0) {
            addToast({ type: 'info', message: 'Loaded from offline cache' });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Create a new book ────────────────────────────────
  const createNewBook = useCallback(
    async (bookData) => {
      setLoading(true, 'Creating book...');
      try {
        const newBook = await api.createBook(bookData);
        addBook(newBook);
        await cacheBook(newBook);
        addToast({ type: 'success', message: 'Book created' });
        return newBook;
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to create book' });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addBook, addToast, setLoading]
  );

  // ── Delete a book ────────────────────────────────────
  const deleteExistingBook = useCallback(
    async (id) => {
      try {
        await api.deleteBook(id);
        removeBookFromStore(id);
        await removeCachedBook(id);
        addToast({ type: 'success', message: 'Book deleted' });
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to delete book' });
        throw err;
      }
    },
    [removeBookFromStore, addToast]
  );

  // ── Reorder books ────────────────────────────────────
  const reorderExistingBooks = useCallback(
    async (orderedIds) => {
      try {
        const updated = await api.reorderBooks(orderedIds);
        setBooks(updated);
        await cacheBooks(updated);
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to reorder books' });
        throw err;
      }
    },
    [setBooks, addToast]
  );

  return {
    books,
    createBook: createNewBook,
    deleteBook: deleteExistingBook,
    reorderBooks: reorderExistingBooks,
  };
}
