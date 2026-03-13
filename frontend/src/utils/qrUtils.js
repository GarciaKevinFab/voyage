import QRCode from 'qrcode';

/**
 * Generate a QR code as a data URL image.
 * @param {string} url - The URL to encode.
 * @param {object} options - Optional QRCode options.
 * @returns {Promise<string>} Data URL (PNG) of the QR code.
 */
export async function generateQRDataURL(url, options = {}) {
  const defaults = {
    width: 256,
    margin: 2,
    color: {
      dark: '#0A0A0A',
      light: '#F5F0E8',
    },
    ...options,
  };

  return QRCode.toDataURL(url, defaults);
}
