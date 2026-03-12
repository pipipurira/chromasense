/**
 * ui.js
 * ChromaSense - Fase 2
 * Semua fungsi DOM manipulation untuk update Color Info Panel,
 * History Strip, crosshair, dan toast notification.
 *
 * Fungsi-fungsi ini dipanggil dari main.js setelah color engine
 * menghasilkan ColorObject.
 */

// ─────────────────────────────────────────────
// COLOR INFO PANEL
// ─────────────────────────────────────────────

/**
 * Update seluruh Color Info Panel berdasarkan ColorObject.
 * Memanggil semua sub-fungsi update secara berurutan.
 *
 * @param {Object} colorObj - ColorObject dari buildColorObject()
 */
function updateColorPanel(colorObj) {
  if (!colorObj) return;

  updateColorPreview(colorObj.hex);
  updateColorNames(colorObj.nameId, colorObj.nameEn);
  updateColorValues(colorObj.hex, colorObj.r, colorObj.g, colorObj.b, colorObj.hsl);
  setColorPanelVisible(true);
}

/**
 * Update kotak preview warna besar.
 * @param {string} hex - HEX string, contoh: '#FF5733'
 */
function updateColorPreview(hex) {
  const el = document.getElementById('color-preview');
  if (!el) return;
  el.style.backgroundColor = hex;

  // Auto-switch text color untuk kontras (hitam/putih)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  el.style.color = luminance > 0.5 ? '#111111' : '#FFFFFF';

  // Update label HEX di bawah preview (struktur Fase 1)
  const label = document.getElementById('color-preview-label');
  if (label) label.textContent = hex;
}

/**
 * Update nama warna Bahasa Indonesia dan Inggris.
 * @param {string} nameId - Nama dalam Bahasa Indonesia
 * @param {string} nameEn - Nama dalam Bahasa Inggris
 */
function updateColorNames(nameId, nameEn) {
  const elId = document.getElementById('name-id');
  const elEn = document.getElementById('name-en');
  if (elId) elId.textContent = nameId;
  if (elEn) elEn.textContent = nameEn;
}

/**
 * Update nilai HEX, RGB, dan HSL.
 * @param {string} hex
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {{ h: number, s: number, l: number }} hsl
 */
function updateColorValues(hex, r, g, b, hsl) {
  const elHex = document.getElementById('val-hex');
  const elRgb = document.getElementById('val-rgb');
  const elHsl = document.getElementById('val-hsl');

  if (elHex) elHex.textContent = hex;
  if (elRgb) elRgb.textContent = `R:${r} G:${g} B:${b}`;
  if (elHsl) elHsl.textContent = `H:${hsl.h}° S:${hsl.s}% L:${hsl.l}%`;
}

/**
 * Tampilkan atau sembunyikan color panel.
 * @param {boolean} visible
 */
function setColorPanelVisible(visible) {
  const el = document.getElementById('color-panel');
  if (!el) return;
  el.classList.toggle('panel-hidden', !visible);
  el.classList.toggle('panel-visible', visible);

  // Enable tombol yang awalnya disabled di HTML Fase 1
  if (visible) {
    const btnCopy = document.getElementById('btn-copy-hex');
    if (btnCopy) btnCopy.disabled = false;
  }
}

// ─────────────────────────────────────────────
// HISTORY STRIP
// ─────────────────────────────────────────────

/**
 * Render ulang History Strip berdasarkan array histori warna.
 * Dipanggil setiap kali AppState.history berubah.
 *
 * @param {Array<Object>} history - Array ColorObject (max 8)
 * @param {Function} onSwatchClick - Callback saat swatch diklik, menerima ColorObject
 */
function updateHistoryStrip(history, onSwatchClick) {
  const container = document.getElementById('history-swatches');
  if (!container) return;

  container.innerHTML = '';

  if (!history || history.length === 0) {
    container.innerHTML = '<span class="history-empty">Belum ada warna tersimpan</span>';
    return;
  }

  history.forEach((colorObj, index) => {
    const swatch = document.createElement('button');
    swatch.className = 'history-swatch';
    swatch.style.backgroundColor = colorObj.hex;

    // Data attributes untuk custom tooltip CSS
    swatch.setAttribute('data-tooltip', `${colorObj.nameId}\n${colorObj.hex}`);
    swatch.setAttribute('aria-label', `Warna ${index + 1}: ${colorObj.nameId} ${colorObj.hex}`);

    swatch.addEventListener('click', () => {
      if (typeof onSwatchClick === 'function') {
        onSwatchClick(colorObj);
      }
    });

    container.appendChild(swatch);
  });
}

// ─────────────────────────────────────────────
// CROSSHAIR OVERLAY
// ─────────────────────────────────────────────

/**
 * Gambar crosshair di atas video pada koordinat yang diklik.
 * Canvas crosshair di-overlay di atas elemen video.
 *
 * @param {HTMLCanvasElement} canvas - Elemen canvas overlay
 * @param {number} x - Koordinat X relatif terhadap canvas
 * @param {number} y - Koordinat Y relatif terhadap canvas
 */
function drawCrosshair(canvas, x, y) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x + 20, y);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x, y + 20);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center circle dengan outline kontras
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.95)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Inner dot
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255, 255, 0, 0.95)';
  ctx.fill();
}

/**
 * Hapus crosshair dari canvas overlay.
 * @param {HTMLCanvasElement} canvas
 */
function clearCrosshair(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Resize canvas crosshair agar sesuai dengan dimensi video yang ditampilkan.
 * Dipanggil saat video mulai play atau window resize.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLVideoElement} video
 */
function resizeCrosshairCanvas(canvas, video) {
  if (!canvas || !video) return;
  canvas.width = video.offsetWidth;
  canvas.height = video.offsetHeight;
}

// ─────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────

let _toastTimer = null;

/**
 * Tampilkan toast notification sementara.
 * @param {string} message - Pesan yang ditampilkan
 * @param {number} [duration=2000] - Durasi dalam ms sebelum toast hilang
 */
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.removeAttribute('hidden');
  toast.classList.add('toast-visible');

  // Clear timer sebelumnya jika ada
  if (_toastTimer) clearTimeout(_toastTimer);

  _toastTimer = setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => {
      toast.setAttribute('hidden', '');
      toast.textContent = '';
    }, 300); // Beri waktu untuk CSS transition fade-out
  }, duration);
}

// ─────────────────────────────────────────────
// ERROR OVERLAY
// ─────────────────────────────────────────────

/**
 * Tampilkan pesan error kamera di overlay.
 * @param {string} message - Pesan error yang ditampilkan ke user
 */
function showCameraError(message) {
  const overlay = document.getElementById('error-overlay');
  if (!overlay) return;

  // Isi hanya elemen #error-message, jangan timpa seluruh struktur HTML overlay
  const msgEl = document.getElementById('error-message');
  if (msgEl) {
    msgEl.textContent = message;
  } else {
    overlay.textContent = message;
  }

  overlay.removeAttribute('hidden');
}

/**
 * Sembunyikan error overlay kamera.
 */
function hideCameraError() {
  const overlay = document.getElementById('error-overlay');
  if (!overlay) return;
  overlay.setAttribute('hidden', '');

  // Reset teks pesan tapi pertahankan struktur HTML
  const msgEl = document.getElementById('error-message');
  if (msgEl) msgEl.textContent = 'Terjadi kesalahan kamera.';
}

// ─────────────────────────────────────────────
// TOMBOL FREEZE
// ─────────────────────────────────────────────

/**
 * Update label tombol Freeze/Resume sesuai state.
 * @param {boolean} isFrozen
 */
function updateFreezeButton(isFrozen) {
  const btn = document.getElementById('btn-freeze');
  if (!btn) return;

  // Update teks span
  const span = btn.querySelector('span');
  if (span) span.textContent = isFrozen ? 'Resume' : 'Freeze';

  // Swap ikon pause ↔ play
  const iconPause = document.getElementById('icon-pause');
  const iconPlay  = document.getElementById('icon-play');
  if (iconPause) iconPause.hidden = isFrozen;
  if (iconPlay)  iconPlay.hidden  = !isFrozen;

  // Toggle aria-pressed untuk aksesibilitas
  btn.setAttribute('aria-pressed', isFrozen ? 'true' : 'false');
  btn.classList.toggle('btn-active', isFrozen);

  // Tampilkan / sembunyikan badge FROZEN di video
  const badge = document.getElementById('frozen-badge');
  if (badge) badge.hidden = !isFrozen;
}

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────

window.UI = {
  updateColorPanel,
  updateColorPreview,
  updateColorNames,
  updateColorValues,
  setColorPanelVisible,
  updateHistoryStrip,
  drawCrosshair,
  clearCrosshair,
  resizeCrosshairCanvas,
  showToast,
  showCameraError,
  hideCameraError,
  updateFreezeButton
};
