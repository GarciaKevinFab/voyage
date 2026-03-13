import { useEffect, useCallback } from 'react';
import useBookStore from '../store/bookStore';
import useAppStore from '../store/appStore';
import * as api from '../services/api';
import { compressImage } from '../utils/imageUtils';
import {
  cachePages,
  getCachedPages,
  cachePage,
  removeCachedPage,
} from '../services/storageService';

/**
 * Hook that manages pages for a given book.
 * Loads pages on mount, provides CRUD + reorder + auto-caption.
 *
 * @param {string|number} bookId
 */
export default function usePages(bookId) {
  const {
    pages,
    setPages,
    addPage,
    removePage: removePageFromStore,
    updatePageInStore,
    currentBook,
  } = useBookStore();
  const { setLoading, addToast } = useAppStore();

  // ── Load pages when bookId changes ───────────────────
  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;

    async function load() {
      setLoading(true, 'Loading pages...');
      try {
        const data = await api.getPages(bookId);
        if (!cancelled) {
          setPages(data);
          await cachePages(bookId, data);
        }
      } catch (err) {
        console.warn('API unavailable for pages, loading cache', err);
        const cached = await getCachedPages(bookId);
        if (!cancelled) setPages(cached);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [bookId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Create page (compress + upload + generate caption) ─
  const createNewPage = useCallback(
    async (file, extraData = {}) => {
      setLoading(true, 'Uploading photo...');
      try {
        // Compress image before upload
        const compressed = await compressImage(file);
        const formData = new FormData();
        formData.append('image', compressed, file.name);

        // Attach any extra fields (layout, filter, etc.)
        Object.entries(extraData).forEach(([key, value]) => {
          formData.append(key, value);
        });

        const newPage = await api.createPage(bookId, formData);
        addPage(newPage);
        await cachePage(newPage);

        // Try to auto-generate a caption in the background
        try {
          const reader = new FileReader();
          const base64 = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(compressed);
          });
          const captionResult = await api.getCaption({
            image_base64: base64,
            city: currentBook?.city || '',
            country: currentBook?.country || '',
          });
          if (captionResult?.caption) {
            const captionUpdate = { caption: captionResult.caption };
            await api.updatePage(newPage.id, captionUpdate);
            updatePageInStore(newPage.id, captionUpdate);
            await cachePage({ ...newPage, ...captionUpdate });
          }
        } catch {
          // Caption generation is non-critical
          console.warn('Caption generation failed, skipping');
        }

        addToast({ type: 'success', message: 'Photo added' });
        return newPage;
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to upload photo' });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [bookId, addPage, updatePageInStore, addToast, setLoading]
  );

  // ── Update page ──────────────────────────────────────
  const updateExistingPage = useCallback(
    async (pageId, data) => {
      try {
        const updated = await api.updatePage(pageId, data);
        updatePageInStore(pageId, updated);
        await cachePage(updated);
        return updated;
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to update page' });
        throw err;
      }
    },
    [bookId, updatePageInStore, addToast]
  );

  // ── Delete page ──────────────────────────────────────
  const deleteExistingPage = useCallback(
    async (pageId) => {
      try {
        await api.deletePage(pageId);
        removePageFromStore(pageId);
        await removeCachedPage(pageId);
        addToast({ type: 'success', message: 'Page removed' });
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to delete page' });
        throw err;
      }
    },
    [bookId, removePageFromStore, addToast]
  );

  // ── Reorder pages ────────────────────────────────────
  const reorderExistingPages = useCallback(
    async (orderedIds) => {
      try {
        const updated = await api.reorderPages(orderedIds);
        setPages(updated);
        await cachePages(bookId, updated);
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to reorder pages' });
        throw err;
      }
    },
    [bookId, setPages, addToast]
  );

  return {
    pages,
    createPage: createNewPage,
    updatePage: updateExistingPage,
    deletePage: deleteExistingPage,
    reorderPages: reorderExistingPages,
  };
}
