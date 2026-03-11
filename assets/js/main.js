/**
 * main.js
 * ChromaSense - Fase 2 Integration
 * Entry point aplikasi. Mengorkestrasi semua modul:
 * camera.js, colorEngine.js, colorDB.js, state.js, ui.js, utils.js
 *
 * Fase 1: Webcam access, pixel sampling, nilai RGB mentah ✅
 * Fase 2: Color naming (nameId, nameEn), HEX, HSL, Color Panel UI ← sekarang
 */

// ─────────────────────────────────────────────
// INISIALISASI
// ─────────────────────────────────────────────

/**
 * Fungsi init utama — dipanggil saat DOM siap.
 * Urutan: load DB → start camera → bind events
 */
async function init() {
  console.log('[ChromaSense] Inisialisasi Fase 2...');

  // 1. Load color database terlebih dahulu
  try {
    await ColorDB.load();
    console.log(`[ChromaSense] Color DB siap: ${ColorDB.count()} warna`);
  } catch (err) {
    console.error('[ChromaSense] Gagal load color database:', err);
    UI.showCameraError('Gagal memuat database warna. Coba refresh halaman.');
    return;
  }

  // 2. Setup referensi elemen DOM
  const videoEl = document.getElementById('video-feed');
  const crosshairCanvas = document.getElementById('crosshair-overlay');

  if (!videoEl) {
    console.error('[ChromaSense] Elemen #video-feed tidak ditemukan');
    return;
  }

  // 3. Setup btn-start-camera (placeholder button dari Fase 1)
  const btnStart = document.getElementById('btn-start-camera');
  if (btnStart) {
    btnStart.addEventListener('click', () => startCameraFlow(videoEl, crosshairCanvas));
  } else {
    // Jika tidak ada placeholder, langsung start
    await startCameraFlow(videoEl, crosshairCanvas);
  }

  // 4. Bind event lainnya
  bindEvents(videoEl, crosshairCanvas);

  // 5. Sembunyikan color panel sampai ada warna pertama
  UI.setColorPanelVisible(false);

  // 6. Render history strip kosong
  UI.updateHistoryStrip(AppState.history, (colorObj) => {
    UI.updateColorPanel(colorObj);
  });

  console.log('[ChromaSense] Siap.');
}

/**
 * Flow start kamera — dipisah agar bisa dipanggil dari tombol.
 */
async function startCameraFlow(videoEl, crosshairCanvas) {
  try {
    const stream = await Camera.start(videoEl);
    AppState.activeStream = stream;
    UI.hideCameraError();

    // Sembunyikan placeholder, tampilkan video
    const placeholder = document.getElementById('camera-placeholder');
    if (placeholder) placeholder.hidden = true;

    // Enable tombol controls
    const btnFreeze = document.getElementById('btn-freeze');
    const btnSwitch = document.getElementById('btn-switch-camera');
    if (btnFreeze) btnFreeze.disabled = false;
    if (btnSwitch) btnSwitch.disabled = false;

    videoEl.addEventListener('loadedmetadata', () => {
      UI.resizeCrosshairCanvas(crosshairCanvas, videoEl);
    });

    console.log('[ChromaSense] Kamera aktif');
  } catch (err) {
    console.error('[ChromaSense] Gagal start kamera:', err);
  }
}

// ─────────────────────────────────────────────
// EVENT BINDING
// ─────────────────────────────────────────────

function bindEvents(videoEl, crosshairCanvas) {
  // Klik pada video → sample warna
  videoEl.addEventListener('click', (e) => handleVideoClick(e, videoEl, crosshairCanvas));

  // Touch support untuk mobile
  videoEl.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    handleVideoClick(touch, videoEl, crosshairCanvas);
  }, { passive: false });

  // Tombol Retry (dari error overlay Fase 1)
  const btnRetry = document.getElementById('btn-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      UI.hideCameraError();
      startCameraFlow(videoEl, crosshairCanvas);
    });
  }

  // Tombol Freeze
  const btnFreeze = document.getElementById('btn-freeze');
  if (btnFreeze) {
    btnFreeze.addEventListener('click', handleFreezeToggle);
  }

  // Tombol Switch Camera
  const btnSwitch = document.getElementById('btn-switch-camera');
  if (btnSwitch) {
    btnSwitch.addEventListener('click', handleSwitchCamera);
  }

  // Tombol Copy HEX
  const btnCopy = document.getElementById('btn-copy-hex');
  if (btnCopy) {
    btnCopy.addEventListener('click', handleCopyHex);
  }

  // Resize handler untuk crosshair canvas
  window.addEventListener('resize', () => {
    UI.resizeCrosshairCanvas(crosshairCanvas, videoEl);
  });

  // Stop stream saat halaman ditutup
  window.addEventListener('beforeunload', () => {
    if (AppState.activeStream) {
      Camera.stop(AppState.activeStream);
    }
  });
}

// ─────────────────────────────────────────────
// HANDLER: VIDEO CLICK / TAP
// ─────────────────────────────────────────────

/**
 * Handler utama saat pengguna klik/tap area video.
 * Mengambil pixel → konversi → update UI.
 */
function handleVideoClick(event, videoEl, crosshairCanvas) {
  // Jika freeze aktif, tetap bisa sample dari frame yang dibekukan
  const { r, g, b } = samplePixelFromVideo(event, videoEl);

  // Gambar crosshair di posisi klik
  const rect = videoEl.getBoundingClientRect();
  const clickX = (event.clientX || event.pageX) - rect.left;
  const clickY = (event.clientY || event.pageY) - rect.top;
  UI.drawCrosshair(crosshairCanvas, clickX, clickY);

  // Bangun ColorObject menggunakan Color Engine + Database
  const colorObj = ColorEngine.buildColorObject(
    r, g, b,
    ColorDB.getAll()
  );

  // Update state
  AppState.setColor(colorObj);

  // Update UI
  UI.updateColorPanel(colorObj);
  UI.updateHistoryStrip(AppState.history, (histColorObj) => {
    UI.updateColorPanel(histColorObj);
  });

  console.log(`[ChromaSense] Warna: ${colorObj.nameId} (${colorObj.hex})`);
}

// ─────────────────────────────────────────────
// PIXEL SAMPLING
// ─────────────────────────────────────────────

/**
 * Ambil nilai pixel RGBA dari video element pada koordinat event.
 * Menggunakan canvas offscreen — tidak di-append ke DOM.
 *
 * @param {MouseEvent|Touch} event
 * @param {HTMLVideoElement} videoEl
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
function samplePixelFromVideo(event, videoEl) {
  const rect = videoEl.getBoundingClientRect();
  const clientX = event.clientX || event.pageX;
  const clientY = event.clientY || event.pageY;

  // Scale koordinat klik ke dimensi aktual video
  const scaleX = videoEl.videoWidth / rect.width;
  const scaleY = videoEl.videoHeight / rect.height;
  const videoX = Math.round((clientX - rect.left) * scaleX);
  const videoY = Math.round((clientY - rect.top) * scaleY);

  // Canvas offscreen untuk sampling
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0);

  const pixel = ctx.getImageData(
    Math.max(0, Math.min(videoX, videoEl.videoWidth - 1)),
    Math.max(0, Math.min(videoY, videoEl.videoHeight - 1)),
    1, 1
  ).data;

  return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] };
}

// ─────────────────────────────────────────────
// HANDLER: FREEZE
// ─────────────────────────────────────────────

function handleFreezeToggle() {
  const videoEl = document.getElementById('video-feed');
  if (!videoEl) return;

  const isFrozen = AppState.toggleFreeze();

  if (isFrozen) {
    videoEl.pause();
  } else {
    videoEl.play();
  }

  UI.updateFreezeButton(isFrozen);
  UI.showToast(isFrozen ? 'Frame dibekukan' : 'Live preview dilanjutkan');
}

// ─────────────────────────────────────────────
// HANDLER: SWITCH CAMERA
// ─────────────────────────────────────────────

async function handleSwitchCamera() {
  const videoEl = document.getElementById('video-feed');
  if (!videoEl) return;

  try {
    const cameras = await Camera.getAvailableCameras();
    if (cameras.length < 2) {
      UI.showToast('Hanya ada satu kamera tersedia');
      return;
    }

    // Toggle antara kamera yang tersedia
    const currentId = AppState.activeCameraId;
    const next = cameras.find(c => c.deviceId !== currentId) || cameras[0];

    // Stop stream lama
    if (AppState.activeStream) {
      Camera.stop(AppState.activeStream);
    }

    // Start stream baru dengan kamera yang dipilih
    const stream = await Camera.startWithDeviceId(videoEl, next.deviceId);
    AppState.activeStream = stream;
    AppState.activeCameraId = next.deviceId;

    UI.showToast('Kamera diganti');
  } catch (err) {
    console.error('[ChromaSense] Gagal ganti kamera:', err);
    UI.showToast('Gagal mengganti kamera');
  }
}

// ─────────────────────────────────────────────
// HANDLER: COPY HEX
// ─────────────────────────────────────────────

async function handleCopyHex() {
  if (!AppState.currentColor) {
    UI.showToast('Pilih warna terlebih dahulu');
    return;
  }

  await Utils.copyToClipboard(AppState.currentColor.hex);
  // Toast ditampilkan dari dalam copyToClipboard via UI.showToast
}

// ─────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────

// Jalankan init setelah DOM selesai dimuat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
