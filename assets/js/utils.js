/**
 * utils.js
 * ChromaSense - Fase 2
 * Stateless utility functions. Tidak ada side effects selain memanggil UI.showToast.
 */

/**
 * Salin teks ke clipboard dengan fallback untuk browser lama.
 * Menampilkan toast notifikasi setelah berhasil.
 * @param {string} text - Teks yang akan disalin
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback untuk browser yang tidak support Clipboard API
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    UI.showToast(`${text} berhasil disalin!`);
  } catch (err) {
    console.error('[Utils] Gagal menyalin ke clipboard:', err);
    UI.showToast('Gagal menyalin. Coba lagi.');
  }
}

/**
 * Clamp nilai numerik antara min dan max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Debounce — tunda eksekusi fungsi hingga N ms setelah panggilan terakhir.
 * @param {Function} fn - Fungsi yang di-debounce
 * @param {number} delay - Delay dalam ms
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

window.Utils = {
  copyToClipboard,
  clamp,
  debounce
};
