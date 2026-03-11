/**
 * state.js
 * ChromaSense - Fase 2
 * AppState singleton — satu-satunya sumber kebenaran (single source of truth)
 * untuk status aplikasi saat ini.
 *
 * Tidak ada persistence — state reset saat tab ditutup/refresh.
 */

const AppState = {
  /** ColorObject aktif saat ini: { r, g, b, hex, hsl, nameId, nameEn, timestamp } */
  currentColor: null,

  /** Array ColorObject, max 8 item, urutan terbaru di depan */
  history: [],

  /** Boolean: apakah video sedang di-freeze */
  isFrozen: false,

  /** MediaStream aktif dari getUserMedia */
  activeStream: null,

  /** deviceId kamera yang sedang aktif */
  activeCameraId: null,

  /**
   * Set warna aktif dan tambahkan ke histori.
   * Histori dibatasi 8 item, entry duplikat (HEX sama) tidak ditambahkan ulang.
   * @param {Object} colorObj
   */
  setColor(colorObj) {
    this.currentColor = colorObj;

    // Hindari duplikat HEX berurutan
    if (this.history.length > 0 && this.history[0].hex === colorObj.hex) {
      return;
    }

    this.history = [colorObj, ...this.history].slice(0, 8);
  },

  /**
   * Toggle freeze state.
   * @returns {boolean} State freeze setelah toggle
   */
  toggleFreeze() {
    this.isFrozen = !this.isFrozen;
    return this.isFrozen;
  },

  /**
   * Reset semua state ke kondisi awal.
   * Berguna untuk testing atau reset manual.
   */
  reset() {
    this.currentColor = null;
    this.history = [];
    this.isFrozen = false;
    // activeStream dan activeCameraId TIDAK di-reset di sini
    // karena stream harus di-stop secara eksplisit via Camera.stop()
  }
};

window.AppState = AppState;
