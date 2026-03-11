/**
 * colorDB.js
 * ChromaSense - Fase 2
 * Loader dan interface untuk database warna (colors.json).
 * Menyediakan akses ke color database dengan caching built-in.
 */

const ColorDB = (() => {
  let _database = null;
  let _isLoaded = false;

  /**
   * Load colors.json dari path relatif.
   * Database di-cache setelah load pertama — tidak perlu fetch ulang.
   * @returns {Promise<Array>} Array of color objects
   */
  async function load() {
    if (_isLoaded && _database) {
      return _database;
    }

    try {
      const response = await fetch('./assets/data/colors.json');
      if (!response.ok) {
        throw new Error(`Gagal load colors.json: HTTP ${response.status}`);
      }
      _database = await response.json();
      _isLoaded = true;
      console.log(`[ColorDB] Database dimuat: ${_database.length} warna`);
      return _database;
    } catch (error) {
      console.error('[ColorDB] Error loading color database:', error);
      throw error;
    }
  }

  /**
   * Kembalikan database yang sudah di-load.
   * Harus memanggil load() terlebih dahulu.
   * @returns {Array | null}
   */
  function getAll() {
    return _database;
  }

  /**
   * Cari warna berdasarkan HEX (exact match).
   * @param {string} hex - contoh: '#FF5733'
   * @returns {Object | undefined}
   */
  function findByHex(hex) {
    if (!_database) return undefined;
    return _database.find(c => c.hex.toUpperCase() === hex.toUpperCase());
  }

  /**
   * Cek apakah database sudah di-load.
   * @returns {boolean}
   */
  function isLoaded() {
    return _isLoaded;
  }

  /**
   * Kembalikan jumlah warna di database.
   * @returns {number}
   */
  function count() {
    return _database ? _database.length : 0;
  }

  return { load, getAll, findByHex, isLoaded, count };
})();

window.ColorDB = ColorDB;
