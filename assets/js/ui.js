/**
 * ui.js — DOM manipulation & rendering functions.
 * Semua interaksi dengan DOM ada di sini.
 * Tidak ada business logic. Dipanggil oleh main.js.
 */

import AppState from './state.js';

/* ---- Referensi elemen DOM ---- */
const $colorPreview    = document.getElementById('color-preview');
const $colorLabel      = document.getElementById('color-preview-label');
const $nameId          = document.getElementById('name-id');
const $nameEn          = document.getElementById('name-en');
const $valHex          = document.getElementById('val-hex');
const $valRgb          = document.getElementById('val-rgb');
const $valHsl          = document.getElementById('val-hsl');
const $btnCopyHex      = document.getElementById('btn-copy-hex');
const $btnFreeze       = document.getElementById('btn-freeze');
const $btnSwitchCamera = document.getElementById('btn-switch-camera');
const $historySwatches = document.getElementById('history-swatches');
const $toast           = document.getElementById('toast');
const $errorOverlay    = document.getElementById('error-overlay');
const $errorMessage    = document.getElementById('error-message');
const $cameraPlaceholder = document.getElementById('camera-placeholder');
const $logoDot         = document.getElementById('logo-dot');

let toastTimeout = null;

/* ============================================
   COLOR PANEL
   ============================================ */

/**
 * Update seluruh color info panel dengan ColorObject baru.
 * @param {Object} color - ColorObject
 */
export function updateColorPanel(color) {
  if (!color) return;

  // Preview box
  $colorPreview.style.background = color.hex;
  $colorLabel.textContent = color.hex;

  // Names
  $nameId.textContent = color.nameId;
  $nameEn.textContent = color.nameEn;

  // Values
  $valHex.textContent = color.hex;
  $valRgb.textContent = `${color.r}, ${color.g}, ${color.b}`;
  $valHsl.textContent = `${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%`;

  // Enable copy button
  $btnCopyHex.disabled = false;

  // Animasi subtle
  $colorPreview.style.transition = 'background 0.35s ease';
}

/* ============================================
   HISTORY STRIP
   ============================================ */

/**
 * Update history strip dengan histori warna dari AppState.
 * @param {Function} onSwatchClick - callback(color) saat swatch diklik
 */
export function updateHistoryStrip(onSwatchClick) {
  const history = AppState.history;

  if (history.length === 0) {
    $historySwatches.innerHTML = '<div class="history-empty">Belum ada warna tersimpan</div>';
    return;
  }

  $historySwatches.innerHTML = '';
  history.forEach(color => {
    const swatch = document.createElement('button');
    swatch.className = 'history-swatch';
    swatch.style.background = color.hex;
    swatch.title = `${color.nameId} — ${color.hex}`;
    swatch.setAttribute('aria-label', `Pilih warna ${color.nameId}`);
    swatch.addEventListener('click', () => onSwatchClick(color));
    $historySwatches.appendChild(swatch);
  });
}

/* ============================================
   CROSSHAIR
   ============================================ */

/**
 * Gambar crosshair di atas canvas overlay.
 * @param {HTMLCanvasElement} canvas
 * @param {number} x - posisi X pada canvas
 * @param {number} y - posisi Y pada canvas
 */
export function drawCrosshair(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const size = 20;
  const circleR = 5;

  // Shadow untuk visibilitas
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  // Center circle
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x, y, circleR, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(212, 247, 90, 0.95)'; // accent color
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Hapus crosshair dari canvas.
 * @param {HTMLCanvasElement} canvas
 */
export function clearCrosshair(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/* ============================================
   TOAST NOTIFICATION
   ============================================ */

/**
 * Tampilkan toast notification.
 * @param {string} message
 * @param {number} duration - ms
 */
export function showToast(message, duration = 2200) {
  $toast.textContent = message;
  $toast.removeAttribute('hidden');

  // Force reflow
  $toast.offsetHeight; // eslint-disable-line no-unused-expressions

  $toast.classList.add('visible');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    $toast.classList.remove('visible');
    setTimeout(() => $toast.setAttribute('hidden', ''), 300);
  }, duration);
}

/* ============================================
   CAMERA STATE UI
   ============================================ */

/**
 * Update tampilan saat kamera berhasil aktif.
 */
export function onCameraStarted() {
  $cameraPlaceholder.classList.add('hidden');
  $btnFreeze.disabled = false;
  $logoDot.classList.add('active');
}

/**
 * Tampilkan error kamera.
 * @param {string} message
 */
export function showCameraError(message) {
  $errorMessage.textContent = message;
  $errorOverlay.removeAttribute('hidden');
  $cameraPlaceholder.classList.add('hidden');
}

/**
 * Sembunyikan error overlay.
 */
export function hideCameraError() {
  $errorOverlay.setAttribute('hidden', '');
}

/**
 * Update state tombol switch camera.
 * @param {boolean} hasMultiple
 */
export function updateSwitchCameraButton(hasMultiple) {
  $btnSwitchCamera.disabled = !hasMultiple;
}

/**
 * Update UI tombol Freeze.
 * @param {boolean} isFrozen
 */
export function updateFreezeButton(isFrozen) {
  if (isFrozen) {
    $btnFreeze.classList.add('active');
    $btnFreeze.querySelector('span').textContent = 'Resume';
    $btnFreeze.querySelector('svg').innerHTML = `
      <polygon points="5 3 19 12 5 21 5 3"/>
    `; // Play icon
  } else {
    $btnFreeze.classList.remove('active');
    $btnFreeze.querySelector('span').textContent = 'Freeze';
    $btnFreeze.querySelector('svg').innerHTML = `
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    `; // Pause icon
  }
}
