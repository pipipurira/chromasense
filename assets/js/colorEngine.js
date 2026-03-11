/**
 * colorEngine.js
 * ChromaSense - Fase 2
 * Pure functions untuk konversi warna dan nearest color matching.
 * Tidak ada side effects — semua fungsi aman untuk di-unit test.
 */

/**
 * Konversi nilai RGB ke format HEX uppercase.
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} HEX string, contoh: '#FF5733'
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => Math.min(255, Math.max(0, Math.round(v)))
      .toString(16).padStart(2, '0'))
    .join('').toUpperCase();
}

/**
 * Konversi nilai RGB ke HSL.
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {{ h: number, s: number, l: number }} HSL object
 */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  let l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Cari nama warna terdekat dari database menggunakan
 * Weighted Euclidean Distance (redmean approximation).
 * Formula ini memperhitungkan sensitivitas mata manusia
 * yang berbeda terhadap komponen R, G, dan B.
 *
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @param {Array<{hex: string, nameId: string, nameEn: string}>} colorDatabase
 * @returns {{hex: string, nameId: string, nameEn: string} | null}
 */
function findNearestColor(r, g, b, colorDatabase) {
  if (!colorDatabase || colorDatabase.length === 0) return null;

  let nearestColor = null;
  let minDistance = Infinity;

  for (const color of colorDatabase) {
    const cr = parseInt(color.hex.slice(1, 3), 16);
    const cg = parseInt(color.hex.slice(3, 5), 16);
    const cb = parseInt(color.hex.slice(5, 7), 16);

    // Weighted Euclidean distance (redmean approximation)
    // Referensi: http://www.compuphase.com/cmetric.htm
    const rMean = (r + cr) / 2;
    const dr = r - cr;
    const dg = g - cg;
    const db = b - cb;

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
 * Fungsi utama: ambil semua info warna dari nilai RGB.
 * Menggabungkan semua konversi dan nearest color matching.
 *
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @param {Array} colorDatabase - Array color objects dari colors.json
 * @param {number} [timestamp] - Unix timestamp (opsional, default: now)
 * @returns {Object} ColorObject lengkap
 */
function buildColorObject(r, g, b, colorDatabase, timestamp) {
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const nearest = findNearestColor(r, g, b, colorDatabase);

  return {
    r,
    g,
    b,
    hex,
    hsl,
    nameId: nearest ? nearest.nameId : 'Warna Tidak Diketahui',
    nameEn: nearest ? nearest.nameEn : 'Unknown Color',
    timestamp: timestamp || Math.floor(Date.now() / 1000)
  };
}

// Export untuk digunakan di modul lain
// Menggunakan pattern global agar kompatibel dengan vanilla JS tanpa bundler
window.ColorEngine = {
  rgbToHex,
  rgbToHsl,
  findNearestColor,
  buildColorObject
};
