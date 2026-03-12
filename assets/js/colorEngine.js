/**
 * colorEngine.js
 * ChromaSense v1.0 — Fase 4 (Final)
 *
 * Pure functions untuk konversi warna dan nearest color matching.
 * Tidak ada side effects — semua fungsi aman untuk di-unit test.
 *
 * Fungsi yang tersedia (via window.ColorEngine):
 *   - rgbToHex(r, g, b) → string HEX
 *   - rgbToHsl(r, g, b) → { h, s, l }
 *   - findNearestColor(r, g, b, colorDatabase) → color object
 *   - buildColorObject(r, g, b, colorDatabase) → ColorObject lengkap
 */

/**
 * Konversi nilai RGB ke format HEX uppercase.
 *
 * @param {number} r - Red (0–255)
 * @param {number} g - Green (0–255)
 * @param {number} b - Blue (0–255)
 * @returns {string} HEX string dengan prefix #, contoh: '#FF5733'
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => Math.min(255, Math.max(0, Math.round(v)))
      .toString(16).padStart(2, '0'))
    .join('').toUpperCase();
}

/**
 * Konversi nilai RGB ke HSL.
 * FIX: inisialisasi h = 0 untuk mencegah undefined pada edge case
 * floating-point di mana switch(max) tidak match secara exact.
 *
 * @param {number} r - Red (0–255)
 * @param {number} g - Green (0–255)
 * @param {number} b - Blue (0–255)
 * @returns {{ h: number, s: number, l: number }} HSL — h: 0–360, s/l: 0–100
 */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // FIX: default h = 0 (bukan undefined) untuk achromatic dan edge case
  let h = 0, s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else                h = ((r - g) / d + 4) / 6;
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
 *
 * Formula ini memperhitungkan sensitivitas mata manusia yang berbeda
 * terhadap komponen R, G, dan B.
 * Referensi: http://www.compuphase.com/cmetric.htm
 *
 * @param {number} r - Red (0–255)
 * @param {number} g - Green (0–255)
 * @param {number} b - Blue (0–255)
 * @param {Array<{hex: string, nameId: string, nameEn: string}>} colorDatabase
 * @returns {{hex: string, nameId: string, nameEn: string} | null} Warna terdekat, atau null jika DB kosong
 */
function findNearestColor(r, g, b, colorDatabase) {
  if (!colorDatabase || colorDatabase.length === 0) return null;

  let nearestColor = null;
  let minDistance = Infinity;

  for (const color of colorDatabase) {
    const cr = parseInt(color.hex.slice(1, 3), 16);
    const cg = parseInt(color.hex.slice(3, 5), 16);
    const cb = parseInt(color.hex.slice(5, 7), 16);

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
 * Buat ColorObject lengkap dari nilai RGB.
 * Menggabungkan semua konversi: HEX, HSL, dan nearest color name.
 *
 * Struktur ColorObject yang dihasilkan:
 * {
 *   r, g, b,           // Integer 0–255
 *   hex,               // String '#RRGGBB'
 *   hsl: { h, s, l },  // h: 0–360, s/l: 0–100
 *   nameId,            // Nama warna Bahasa Indonesia
 *   nameEn,            // Nama warna Bahasa Inggris
 *   timestamp          // Unix timestamp (detik)
 * }
 *
 * @param {number} r - Red (0–255)
 * @param {number} g - Green (0–255)
 * @param {number} b - Blue (0–255)
 * @param {Array} colorDatabase - Array color objects dari colors.json
 * @param {number} [timestamp] - Unix timestamp override (opsional)
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

window.ColorEngine = {
  rgbToHex,
  rgbToHsl,
  findNearestColor,
  buildColorObject
};
