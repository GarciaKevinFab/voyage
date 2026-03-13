/**
 * Spine colors for book covers on the bookshelf.
 * Gold and brown tones matching the VOYAGE palette.
 */
export const SPINE_COLORS = [
  '#C9A96E', // gold
  '#A07840', // gold-dark
  '#8B6914', // deep gold
  '#6B4226', // warm brown
  '#3E2723', // dark brown
];

/**
 * CSS filter presets for photo pages.
 */
export const FILTERS = {
  original: 'none',
  noir: 'grayscale(100%) contrast(1.2) brightness(0.9)',
  vintage: 'sepia(0.6) saturate(0.8) contrast(1.1) brightness(1.05)',
  fade: 'saturate(0.5) brightness(1.1) contrast(0.9)',
};

/**
 * Layout options for interior pages.
 * A = full bleed image
 * B = image left, text right
 * C = image right, text left
 * D = two images side by side
 */
export const LAYOUTS = ['A', 'B', 'C', 'D'];

/**
 * Literary travel quotes shown during loading states.
 */
export const TRAVEL_QUOTES = [
  '"The world is a book and those who do not travel read only one page." — Saint Augustine',
  '"Not all those who wander are lost." — J.R.R. Tolkien',
  '"A journey of a thousand miles begins with a single step." — Lao Tzu',
  '"Travel is fatal to prejudice, bigotry, and narrow-mindedness." — Mark Twain',
  '"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes." — Marcel Proust',
  '"Once a year, go someplace you have never been before." — Dalai Lama',
];
