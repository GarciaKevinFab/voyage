import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Books ──────────────────────────────────────────────

export function getBooks() {
  return api.get('/api/books/').then((r) => r.data);
}

export function createBook(data) {
  return api.post('/api/books/', data).then((r) => r.data);
}

export function getBook(id) {
  return api.get(`/api/books/${id}`).then((r) => r.data);
}

export function updateBook(id, data) {
  return api.put(`/api/books/${id}`, data).then((r) => r.data);
}

export function deleteBook(id) {
  return api.delete(`/api/books/${id}`);
}

export function reorderBooks(orderedIds) {
  return api.patch('/api/books/reorder', { order: orderedIds }).then((r) => r.data);
}

// ── Pages ──────────────────────────────────────────────

export function getPages(bookId) {
  return api.get('/api/pages/', { params: { book_id: bookId } }).then((r) => r.data);
}

export function createPage(bookId, formData) {
  // Ensure book_id is in the formData
  if (formData instanceof FormData) {
    formData.set('book_id', bookId);
  }
  return api
    .post('/api/pages/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}

export function updatePage(pageId, data) {
  return api.put(`/api/pages/${pageId}`, data).then((r) => r.data);
}

export function deletePage(pageId) {
  return api.delete(`/api/pages/${pageId}`);
}

export function reorderPages(orderedIds) {
  return api.patch('/api/pages/reorder', { order: orderedIds }).then((r) => r.data);
}

// ── AI Content Generation ──────────────────────────────

export function getCover(city, country) {
  return api.get(`/api/cover/${encodeURIComponent(city)}/${encodeURIComponent(country)}`).then((r) => r.data);
}

export function getIntro(data) {
  return api.post('/api/claude/intro', data).then((r) => r.data);
}

export function getCaption(data) {
  return api.post('/api/claude/caption', data).then((r) => r.data);
}

export function getEpilogue(data) {
  return api.post('/api/claude/epilogue', data).then((r) => r.data);
}

// ── Music ──────────────────────────────────────────────

export function searchMusic(query, limit = 8) {
  return api.get('/api/music/search', { params: { q: query, limit } }).then((r) => r.data);
}

// ── Export / Import ────────────────────────────────────

export function exportPDF(bookId) {
  return api
    .post('/api/export/pdf', { book_id: bookId }, { responseType: 'blob' })
    .then((r) => r.data);
}

export function exportAssouline(bookId) {
  return api
    .get(`/api/books/${bookId}/export`)
    .then((r) => r.data);
}

export function importAssouline(file) {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post('/api/books/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}

export default api;
