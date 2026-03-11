/**
 * colorDB.js — Color database loader.
 * Load colors.json dan sediakan interface query ke database.
 *
 * Sumber database (Fase 2):
 * - Basis: meodai/color-names (bestof subset)
 * - Terjemahan ID: manual curation ~500-1000 warna paling umum
 *
 * Untuk Fase 0: placeholder kosong / minimal.
 */

/** @type {Array<{hex: string, nameId: string, nameEn: string}>} */
let _database = [];

/** @type {boolean} */
let _isLoaded = false;

/**
 * Load color database dari file JSON.
 * Dipanggil sekali saat app init.
 * @returns {Promise<void>}
 */
export async function loadColorDatabase() {
  if (_isLoaded) return;

  try {
    const response = await fetch('./assets/data/colors.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    _database = Array.isArray(data) ? data : [];
    _isLoaded = true;
    console.log(`[ChromaSense] Color database loaded: ${_database.length} warna`);
  } catch (err) {
    console.warn('[ChromaSense] Gagal load colors.json, menggunakan fallback minimal.', err);
    _database = getFallbackColors();
    _isLoaded = true;
  }
}

/**
 * Ambil seluruh database warna.
 * @returns {Array}
 */
export function getDatabase() {
  return _database;
}

/**
 * Status load database.
 * @returns {boolean}
 */
export function isDatabaseLoaded() {
  return _isLoaded;
}

/**
 * Fallback warna dasar jika colors.json gagal dimuat.
 * 16 warna primer & sekunder sebagai safety net.
 * @returns {Array}
 */
function getFallbackColors() {
  return [
    { hex: '#FF0000', nameId: 'Merah',         nameEn: 'Red' },
    { hex: '#FF4500', nameId: 'Merah Oranye',   nameEn: 'Orange Red' },
    { hex: '#FF8C00', nameId: 'Oranye Tua',     nameEn: 'Dark Orange' },
    { hex: '#FFA500', nameId: 'Oranye',         nameEn: 'Orange' },
    { hex: '#FFD700', nameId: 'Emas',           nameEn: 'Gold' },
    { hex: '#FFFF00', nameId: 'Kuning',         nameEn: 'Yellow' },
    { hex: '#9ACD32', nameId: 'Hijau Kuning',   nameEn: 'Yellow Green' },
    { hex: '#008000', nameId: 'Hijau',          nameEn: 'Green' },
    { hex: '#00CED1', nameId: 'Hijau Toska',    nameEn: 'Dark Turquoise' },
    { hex: '#0000FF', nameId: 'Biru',           nameEn: 'Blue' },
    { hex: '#4169E1', nameId: 'Biru Royal',     nameEn: 'Royal Blue' },
    { hex: '#8B00FF', nameId: 'Ungu',           nameEn: 'Violet' },
    { hex: '#FF69B4', nameId: 'Merah Muda',     nameEn: 'Hot Pink' },
    { hex: '#FFFFFF', nameId: 'Putih',          nameEn: 'White' },
    { hex: '#808080', nameId: 'Abu-abu',        nameEn: 'Gray' },
    { hex: '#000000', nameId: 'Hitam',          nameEn: 'Black' },
    { hex: '#8B4513', nameId: 'Coklat',         nameEn: 'Saddle Brown' },
    { hex: '#F5DEB3', nameId: 'Krem',           nameEn: 'Wheat' },
  ];
}
