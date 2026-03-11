/**
 * utils.js — Stateless utility functions.
 * Tidak ada side effects. Tidak ada dependency ke modul lain.
 */

/**
 * Salin teks ke clipboard dengan fallback untuk browser lama.
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback execCommand
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

/**
 * Debounce: menunda eksekusi fungsi hingga setelah jeda waktu tertentu.
 * @param {Function} fn
 * @param {number} delay - milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Clamp nilai di antara min dan max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Ambil sampel pixel RGBA dari video element di koordinat (clickX, clickY).
 * Membuat offscreen canvas sementara — tidak ditambahkan ke DOM.
 *
 * @param {HTMLVideoElement} videoElement
 * @param {number} clickX - koordinat klik terhadap viewport
 * @param {number} clickY - koordinat klik terhadap viewport
 * @returns {{ r: number, g: number, b: number, a: number } | null}
 */
export function sampleColorFromVideo(videoElement, clickX, clickY) {
  if (!videoElement || !videoElement.videoWidth) return null;

  const rect = videoElement.getBoundingClientRect();

  // Scale koordinat klik ke resolusi native video
  const scaleX = videoElement.videoWidth  / rect.width;
  const scaleY = videoElement.videoHeight / rect.height;

  const videoX = Math.round((clickX - rect.left) * scaleX);
  const videoY = Math.round((clickY - rect.top)  * scaleY);

  // Offscreen canvas — tidak ditambahkan ke DOM
  const canvas = document.createElement('canvas');
  canvas.width  = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0);

  const pixel = ctx.getImageData(videoX, videoY, 1, 1).data;
  return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] };
}

/**
 * Sinkronisasi ukuran canvas overlay dengan elemen referensi.
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} referenceEl
 */
export function syncCanvasSize(canvas, referenceEl) {
  const rect = referenceEl.getBoundingClientRect();
  canvas.width  = rect.width;
  canvas.height = rect.height;
}
