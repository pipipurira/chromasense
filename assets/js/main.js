/**
 * main.js — Entry point ChromaSense.
 * Inisialisasi app, binding event listener, orkestrasi modul.
 *
 * Fase 1: Webcam access, pixel sampling, color detection aktif.
 */

import AppState from './state.js';
import { startCamera, stopCamera, getAvailableCameras, isMediaDevicesSupported } from './camera.js';
import { loadColorDatabase, getDatabase } from './colorDB.js';
import { findNearestColor, buildColorObject } from './colorEngine.js';
import { copyToClipboard, sampleColorFromVideo, syncCanvasSize } from './utils.js';
import {
  updateColorPanel,
  updateHistoryStrip,
  drawCrosshair,
  showToast,
  onCameraStarted,
  showCameraError,
  hideCameraError,
  updateSwitchCameraButton,
  updateFreezeButton,
} from './ui.js';

/* ---- Elemen DOM ---- */
const $video          = document.getElementById('video-feed');
const $crosshairCanvas = document.getElementById('crosshair-overlay');
const $cameraZone     = document.getElementById('camera-zone');
const $btnStartCamera = document.getElementById('btn-start-camera');
const $btnFreeze      = document.getElementById('btn-freeze');
const $btnSwitchCamera = document.getElementById('btn-switch-camera');
const $btnCopyHex     = document.getElementById('btn-copy-hex');
const $btnRetry       = document.getElementById('btn-retry');

/* ---- State lokal ---- */
let availableCameras = [];

/* ============================================
   INIT
   ============================================ */

async function init() {
  console.log('[ChromaSense] Initializing...');

  // Load color database
  await loadColorDatabase();

  // Cek dukungan browser
  if (!isMediaDevicesSupported()) {
    showCameraError(
      'Browser kamu tidak mendukung akses kamera. ' +
      'Gunakan Chrome, Firefox, atau Safari versi terbaru melalui HTTPS.'
    );
    return;
  }

  // Bind events
  bindEvents();

  // Sync ukuran canvas ke video zone
  syncCanvasSize($crosshairCanvas, $cameraZone);

  console.log('[ChromaSense] Ready.');
}

/* ============================================
   EVENT BINDING
   ============================================ */

function bindEvents() {
  // Tombol mulai kamera
  $btnStartCamera.addEventListener('click', handleStartCamera);

  // Tombol retry setelah error
  $btnRetry.addEventListener('click', () => {
    hideCameraError();
    handleStartCamera();
  });

  // Klik / tap pada video zone untuk sampling warna
  $cameraZone.addEventListener('click', handleVideoClick);
  // Touch support untuk mobile
  $cameraZone.addEventListener('touchend', handleVideoClick, { passive: true });

  // Tombol Freeze / Resume
  $btnFreeze.addEventListener('click', handleFreeze);

  // Tombol Switch Camera
  $btnSwitchCamera.addEventListener('click', handleSwitchCamera);

  // Tombol Copy HEX
  $btnCopyHex.addEventListener('click', handleCopyHex);

  // Resize: sync canvas size
  window.addEventListener('resize', () => {
    syncCanvasSize($crosshairCanvas, $cameraZone);
  });

  // Stop kamera saat halaman ditutup
  window.addEventListener('beforeunload', () => {
    if (AppState.activeStream) stopCamera(AppState.activeStream);
  });
}

/* ============================================
   HANDLERS
   ============================================ */

/**
 * Aktifkan kamera.
 */
async function handleStartCamera() {
  try {
    const stream = await startCamera($video, AppState.activeCameraId);
    AppState.activeStream    = stream;
    AppState.isCameraActive  = true;

    // Ambil daftar kamera tersedia
    availableCameras = await getAvailableCameras();
    updateSwitchCameraButton(availableCameras.length > 1);

    onCameraStarted();
    // Sync canvas size setelah placeholder tersembunyi
    syncCanvasSize($crosshairCanvas, $cameraZone);
    console.log('[ChromaSense] Kamera aktif.');
  } catch (err) {
    console.error('[ChromaSense] Kamera gagal:', err);

    // Jika OverconstrainedError, coba tanpa constraint resolusi
    if (err.isOverconstrained) {
      try {
        const stream = await startCamera($video, null);
        AppState.activeStream   = stream;
        AppState.isCameraActive = true;
        onCameraStarted();
        return;
      } catch (fallbackErr) {
        showCameraError(fallbackErr.friendlyMessage || fallbackErr.message);
      }
    }

    showCameraError(err.friendlyMessage || err.message);
  }
}

/**
 * Sampling warna dari titik yang diklik pada video.
 * @param {MouseEvent|TouchEvent} e
 */
function handleVideoClick(e) {
  if (!AppState.isCameraActive) return;

  const touch = e.touches ? e.touches[0] : e;
  const clickX = touch.clientX;
  const clickY = touch.clientY;

  // Pastikan ukuran canvas selalu sinkron
  syncCanvasSize($crosshairCanvas, $cameraZone);

  // Gambar crosshair di posisi klik (koordinat relatif canvas)
  const rect = $cameraZone.getBoundingClientRect();
  const canvasX = clickX - rect.left;
  const canvasY = clickY - rect.top;
  drawCrosshair($crosshairCanvas, canvasX, canvasY);

  // Jika freeze, sampling dari frame terakhir yang di-pause
  // Jika tidak freeze, sampling dari frame live
  const pixel = sampleColorFromVideo($video, clickX, clickY);
  if (!pixel) return;

  // Cari nama warna terdekat
  const db = getDatabase();
  const nearest = findNearestColor(pixel.r, pixel.g, pixel.b, db);

  const color = buildColorObject(
    pixel.r, pixel.g, pixel.b,
    nearest ? nearest.nameId : 'Tidak Diketahui',
    nearest ? nearest.nameEn : 'Unknown',
  );

  // Simpan ke state
  AppState.setColor(color);

  // Update UI
  updateColorPanel(color);
  updateHistoryStrip(handleHistorySwatchClick);
}

/**
 * Toggle freeze / resume video.
 */
function handleFreeze() {
  const isFrozen = AppState.toggleFreeze();

  if (isFrozen) {
    $video.pause();
  } else {
    $video.play();
  }

  updateFreezeButton(isFrozen);
}

/**
 * Switch ke kamera berikutnya.
 */
async function handleSwitchCamera() {
  if (availableCameras.length <= 1) return;

  // Cari index kamera aktif, lalu ambil yang berikutnya
  const currentIndex = availableCameras.findIndex(
    cam => cam.deviceId === AppState.activeCameraId
  );
  const nextIndex = (currentIndex + 1) % availableCameras.length;
  const nextCamera = availableCameras[nextIndex];

  // Stop stream lama
  if (AppState.activeStream) stopCamera(AppState.activeStream);

  AppState.activeCameraId = nextCamera.deviceId;

  try {
    const stream = await startCamera($video, nextCamera.deviceId);
    AppState.activeStream = stream;
    showToast('Kamera berhasil diganti');
  } catch (err) {
    showCameraError(err.friendlyMessage || err.message);
  }
}

/**
 * Salin HEX ke clipboard.
 */
async function handleCopyHex() {
  if (!AppState.currentColor) return;

  try {
    await copyToClipboard(AppState.currentColor.hex);
    showToast(`✓ ${AppState.currentColor.hex} disalin ke clipboard`);
  } catch (err) {
    showToast('Gagal menyalin. Coba manual.');
    console.error(err);
  }
}

/**
 * Klik pada swatch histori — tampilkan kembali warna tersebut.
 * @param {Object} color - ColorObject dari histori
 */
function handleHistorySwatchClick(color) {
  AppState.currentColor = color;
  updateColorPanel(color);
  showToast(`${color.nameId} — ${color.hex}`);
}

/* ============================================
   RUN
   ============================================ */

init();
