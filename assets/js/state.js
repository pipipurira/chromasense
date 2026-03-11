/**
 * state.js — AppState singleton
 * Menyimpan seluruh runtime state ChromaSense.
 * Tidak ada side effects. Diakses oleh modul lain.
 */

const AppState = {
  /** @type {Object|null} ColorObject aktif */
  currentColor: null,

  /** @type {Object[]} Histori warna, max 8 item */
  history: [],

  /** @type {boolean} Apakah video sedang di-freeze */
  isFrozen: false,

  /** @type {MediaStream|null} Stream kamera aktif */
  activeStream: null,

  /** @type {string|null} deviceId kamera aktif */
  activeCameraId: null,

  /** @type {boolean} Apakah kamera sudah aktif */
  isCameraActive: false,

  /**
   * Simpan warna baru dan tambahkan ke histori.
   * @param {Object} color - ColorObject
   */
  setColor(color) {
    this.currentColor = color;
    // Tambahkan di awal, batasi 8 item
    this.history = [color, ...this.history].slice(0, 8);
  },

  /**
   * Toggle freeze state.
   * @returns {boolean} isFrozen setelah toggle
   */
  toggleFreeze() {
    this.isFrozen = !this.isFrozen;
    return this.isFrozen;
  },

  /**
   * Reset semua state ke kondisi awal.
   */
  reset() {
    this.currentColor = null;
    this.history = [];
    this.isFrozen = false;
    this.isCameraActive = false;
  }
};

export default AppState;
