import { jsPDF } from 'jspdf';

/**
 * Generate a client-side PDF from book data as a fallback
 * when the server-side PDF export is unavailable.
 *
 * @param {object} book - Book metadata (title, destination, dates, etc.)
 * @param {Array} pages - Array of page objects with image_url, caption, layout, etc.
 * @returns {Promise<Blob>} PDF blob ready for download.
 */
export async function generateClientPDF(book, pages) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // --- Title Page ---
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(36);
  pdf.setTextColor(201, 169, 110); // gold
  pdf.text(book.title || 'VOYAGE', pageWidth / 2, pageHeight / 2 - 20, {
    align: 'center',
  });

  if (book.destination) {
    pdf.setFontSize(14);
    pdf.setTextColor(138, 132, 120); // warm-gray
    pdf.text(book.destination, pageWidth / 2, pageHeight / 2 + 5, {
      align: 'center',
    });
  }

  if (book.date_start && book.date_end) {
    pdf.setFontSize(10);
    pdf.text(
      `${book.date_start} — ${book.date_end}`,
      pageWidth / 2,
      pageHeight / 2 + 15,
      { align: 'center' }
    );
  }

  // --- Content Pages ---
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    pdf.addPage();

    // Try to load the image
    if (page.image_url) {
      try {
        const img = await loadImageAsDataURL(page.image_url);
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = pageHeight - margin * 2 - 20; // leave room for caption
        pdf.addImage(img, 'JPEG', margin, margin, imgWidth, imgHeight);
      } catch {
        // If image fails to load, show placeholder text
        pdf.setFontSize(12);
        pdf.setTextColor(180, 180, 180);
        pdf.text('[Image unavailable]', pageWidth / 2, pageHeight / 2, {
          align: 'center',
        });
      }
    }

    // Caption at bottom
    if (page.caption) {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      const captionY = pageHeight - margin;
      const lines = pdf.splitTextToSize(page.caption, pageWidth - margin * 2);
      pdf.text(lines, pageWidth / 2, captionY - lines.length * 4, {
        align: 'center',
      });
    }
  }

  return pdf.output('blob');
}

/**
 * Load an image URL as a base64 data URL for jsPDF.
 * @param {string} url
 * @returns {Promise<string>}
 */
function loadImageAsDataURL(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}
