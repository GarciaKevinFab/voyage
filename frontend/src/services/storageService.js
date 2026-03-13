import Dexie from 'dexie';

/**
 * IndexedDB database for offline caching and pending-action queue.
 *
 * Stores:
 *   books  — cached book objects keyed by id
 *   pages  — cached page objects keyed by id, indexed by bookId
 *   pending — queue of mutations to replay when back online
 */
const db = new Dexie('VoyageDB');

db.version(1).stores({
  books: 'id, order',
  pages: 'id, book_id, order',
  pending: '++id, type, entity, entityId, timestamp',
});

// ── Books cache ────────────────────────────────────────

export async function cacheBooks(books) {
  await db.books.clear();
  await db.books.bulkPut(books);
}

export async function getCachedBooks() {
  return db.books.orderBy('order').toArray().catch(() => []);
}

export async function cacheBook(book) {
  await db.books.put(book);
}

export async function removeCachedBook(id) {
  await db.books.delete(id);
}

// ── Pages cache ────────────────────────────────────────

export async function cachePages(bookId, pages) {
  // Remove old pages for this book, then insert fresh ones
  await db.pages.where('book_id').equals(bookId).delete();
  await db.pages.bulkPut(pages);
}

export async function getCachedPages(bookId) {
  return db.pages.where('book_id').equals(bookId).sortBy('order').catch(() => []);
}

export async function cachePage(page) {
  await db.pages.put(page);
}

export async function removeCachedPage(id) {
  await db.pages.delete(id);
}

// ── Pending action queue (offline mutations) ───────────

/**
 * Queue a mutation to be replayed when back online.
 * @param {'create'|'update'|'delete'|'reorder'} type
 * @param {'book'|'page'} entity
 * @param {string|number} entityId
 * @param {object} payload - The data needed to replay the action.
 */
export async function queuePending(type, entity, entityId, payload) {
  await db.pending.add({
    type,
    entity,
    entityId,
    payload,
    timestamp: Date.now(),
  });
}

/**
 * Get all pending actions in chronological order.
 */
export async function getPending() {
  return db.pending.orderBy('timestamp').toArray();
}

/**
 * Remove a single pending action after successful replay.
 */
export async function removePending(id) {
  await db.pending.delete(id);
}

/**
 * Flush all pending actions (call after successful bulk sync).
 */
export async function flushPending() {
  await db.pending.clear();
}

export default db;
