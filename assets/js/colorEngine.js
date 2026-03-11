/**
 * colorEngine.js — Pure color conversion functions & nearest color matcher.
 * Tidak ada side effects. Mudah di-unit test.
 */

/**
 * Konversi RGB ke HEX string.
 * @param {number} r - 0–255
 * @param {number} g - 0–255
 * @param {number} b - 0–255
 * @returns {string} HEX uppercase, e.g. '#FF5733'
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => Math.min(255, Math.max(0, Math.round(v)))
      .toString(16).padStart(2, '0'))
    .join('').toUpperCase();
}

/**
 * Konversi RGB ke HSL.
 * @param {number} r - 0–255
 * @param {number} g - 0–255
 * @param {number} b - 0–255
 * @returns {{ h: number, s: number, l: number }}
 */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6;               break;
      case b: h = ((r - g) / d + 4) / 6;               break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Cari warna terdekat dari database menggunakan Weighted Euclidean Distance
 * (redmean approximation — memperhitungkan sensitivitas mata manusia).
 *
 * @param {number} r - 0–255
 * @param {number} g - 0–255
 * @param {number} b - 0–255
 * @param {Array<{hex: string, nameId: string, nameEn: string}>} colorDatabase
 * @returns {{hex: string, nameId: string, nameEn: string}|null}
 */
export function findNearestColor(r, g, b, colorDatabase) {
  if (!colorDatabase || colorDatabase.length === 0) return null;

  let nearestColor = null;
  let minDistance = Infinity;

  for (const color of colorDatabase) {
    const cr = parseInt(color.hex.slice(1, 3), 16);
    const cg = parseInt(color.hex.slice(3, 5), 16);
    const cb = parseInt(color.hex.slice(5, 7), 16);

    // Weighted Euclidean (redmean formula)
    const rMean = (r + cr) / 2;
    const dr = r - cr, dg = g - cg, db = b - cb;
    const distance = Math.sqrt(
      (2 + rMean / 256) * dr * dr +
       4 * dg * dg +
      (2 + (255 - rMean) / 256) * db * db
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestColor = color;
    }
  }

  return nearestColor;
}

/**
 * Bangun ColorObject lengkap dari raw RGB + nama warna.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {string} nameId - Nama Bahasa Indonesia
 * @param {string} nameEn - Nama Bahasa Inggris
 * @returns {Object} ColorObject
 */
export function buildColorObject(r, g, b, nameId = '—', nameEn = '—') {
  return {
    r, g, b,
    hex: rgbToHex(r, g, b),
    hsl: rgbToHsl(r, g, b),
    nameId,
    nameEn,
    timestamp: Math.floor(Date.now() / 1000),
  };
}
