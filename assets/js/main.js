/**
 * main.js
 * ChromaSense v1.0 — Fase 4 (Final)
 * Entry point aplikasi. Mengorkestrasi semua modul:
 * camera.js, colorEngine.js, colorDB.js, state.js, ui.js, utils.js
 *
 * Fase 1: Webcam access, pixel sampling, nilai RGB mentah ✅
 * Fase 2: Color naming (nameId, nameEn), HEX, HSL, Color Panel UI ✅
 * Fase 3: Freeze mode, Copy HEX, History strip, responsive polish ✅
 * Fase 4: Bug fixes, JSDoc, cross-browser hardening ✅
 */

// ─────────────────────────────────────────────
// INISIALISASI
// ─────────────────────────────────────────────

/**
 * Fungsi init utama — dipanggil saat DOM siap.
 * Urutan: load DB → bind events → tunggu user klik tombol kamera
 */
async function init() {
  console.log('[ChromaSense] Inisialisasi...');

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

  // 3. Setup btn-start-camera
  const btnStart = document.getElementById('btn-start-camera');
  if (btnStart) {
    btnStart.addEventListener('click', () => startCameraFlow(videoEl, crosshairCanvas));
  } else {
    await startCameraFlow(videoEl, crosshairCanvas);
  }

  // 4. Bind semua event listener
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
 * Flow start kamera — dipisah agar bisa dipanggil dari tombol maupun retry.
 * Menyimpan deviceId kamera pertama ke AppState.activeCameraId.
 *
 * @param {HTMLVideoElement} videoEl
 * @param {HTMLCanvasElement} crosshairCanvas
 */
async function startCameraFlow(videoEl, crosshairCanvas) {
  try {
    const stream = await Camera.start(videoEl);
    AppState.activeStream = stream;

    // FIX: Simpan deviceId kamera aktif sejak awal (bukan hanya saat switch)
    const tracks = stream.getVideoTracks();
    if (tracks.length > 0) {
      const settings = tracks[0].getSettings();
      AppState.activeCameraId = settings.deviceId || null;
    }

    UI.hideCameraError();

    // Sembunyikan placeholder, tampilkan video
    const placeholder = document.getElementById('camera-placeholder');
    if (placeholder) placeholder.hidden = true;

    // Enable tombol controls
    const btnFreeze = document.getElementById('btn-freeze');
    const btnSwitch = document.getElementById('btn-switch-camera');
    if (btnFreeze) btnFreeze.disabled = false;
    if (btnSwitch) btnSwitch.disabled = false;

    // { once: true } — listener otomatis dihapus setelah dipanggil sekali
    videoEl.addEventListener('loadedmetadata', () => {
      UI.resizeCrosshairCanvas(crosshairCanvas, videoEl);
    }, { once: true });

    console.log('[ChromaSense] Kamera aktif');
  } catch (err) {
    console.error('[ChromaSense] Gagal start kamera:', err);
    UI.showCameraError(err.friendlyMessage || 'Gagal mengakses kamera.');
  }
}

// ─────────────────────────────────────────────
// EVENT BINDING
// ─────────────────────────────────────────────

/**
 * Bind semua event listener ke elemen DOM.
 * Dipanggil sekali saat init.
 *
 * @param {HTMLVideoElement} videoEl
 * @param {HTMLCanvasElement} crosshairCanvas
 */
function bindEvents(videoEl, crosshairCanvas) {
  // Klik pada video → sample warna
  videoEl.addEventListener('click', (e) => handleVideoClick(e, videoEl, crosshairCanvas));

  // Touch support untuk mobile
  videoEl.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (touch) handleVideoClick(touch, videoEl, crosshairCanvas);
  }, { passive: false });

  // Tombol Retry
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
    btnFreeze.addEventListener('click', () => handleFreezeToggle(videoEl));
  }

  // Tombol Switch Camera
  const btnSwitch = document.getElementById('btn-switch-camera');
  if (btnSwitch) {
    btnSwitch.addEventListener('click', () => handleSwitchCamera(videoEl));
  }

  // Tombol Copy HEX
  const btnCopy = document.getElementById('btn-copy-hex');
  if (btnCopy) {
    btnCopy.addEventListener('click', handleCopyHex);
  }

  // FIX: Debounce resize handler — mencegah spam rekalkulasi saat resize window
  window.addEventListener('resize', Utils.debounce(() => {
    UI.resizeCrosshairCanvas(crosshairCanvas, videoEl);
  }, 150));

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
 * Guard: tidak proses jika video belum ready (videoWidth === 0).
 *
 * @param {MouseEvent|Touch} event
 * @param {HTMLVideoElement} videoEl
 * @param {HTMLCanvasElement} crosshairCanvas
 */
function handleVideoClick(event, videoEl, crosshairCanvas) {
  // FIX: Guard — video belum memiliki dimensi (stream belum aktif atau metadata belum ready)
  if (!videoEl.videoWidth || !videoEl.videoHeight) {
    console.warn('[ChromaSense] Video belum siap, sampling dibatalkan.');
    return;
  }

  const { r, g, b } = samplePixelFromVideo(event, videoEl);

  // Gambar crosshair di posisi klik (koordinat relatif ke elemen video)
  const rect = videoEl.getBoundingClientRect();
  const clickX = (event.clientX !== undefined ? event.clientX : event.pageX) - rect.left;
  const clickY = (event.clientY !== undefined ? event.clientY : event.pageY) - rect.top;
  UI.drawCrosshair(crosshairCanvas, clickX, clickY);

  // Bangun ColorObject lengkap
  const colorObj = ColorEngine.buildColorObject(r, g, b, ColorDB.getAll());

  // Update state dan UI
  AppState.setColor(colorObj);
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
 * Menggunakan canvas offscreen — tidak di-append ke DOM untuk menghindari layout reflow.
 * Koordinat di-scale dari ukuran tampilan ke resolusi asli video.
 *
 * @param {MouseEvent|Touch} event - Event klik atau sentuh
 * @param {HTMLVideoElement} videoEl - Elemen video aktif
 * @returns {{ r: number, g: number, b: number, a: number }} Nilai RGBA (0–255)
 */
function samplePixelFromVideo(event, videoEl) {
  const rect = videoEl.getBoundingClientRect();
  const clientX = event.clientX !== undefined ? event.clientX : event.pageX;
  const clientY = event.clientY !== undefined ? event.clientY : event.pageY;

  // Scale koordinat tampilan → koordinat resolusi asli video
  const scaleX = videoEl.videoWidth / rect.width;
  const scaleY = videoEl.videoHeight / rect.height;
  // Video di-mirror (scaleX(-1)), jadi koordinat X perlu di-flip agar
  // pixel yang diambil sesuai dengan posisi yang terlihat di layar
  const rawX = Math.round((clientX - rect.left) * scaleX);
  const videoX = videoEl.videoWidth - 1 - rawX;
  const videoY = Math.round((clientY - rect.top) * scaleY);

  // Canvas offscreen — tidak ditambahkan ke DOM
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

/**
 * Toggle freeze/resume pada video stream.
 * FIX: video.play() mengembalikan Promise — di-handle untuk mencegah
 * unhandled rejection di Safari dan Firefox.
 *
 * @param {HTMLVideoElement} videoEl
 */
function handleFreezeToggle(videoEl) {
  if (!videoEl) return;

  const isFrozen = AppState.toggleFreeze();

  if (isFrozen) {
    videoEl.pause();
  } else {
    // play() return Promise di semua browser modern — tangani rejection-nya
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[ChromaSense] video.play() gagal:', err.message);
        // Rollback state freeze jika play gagal
        AppState.isFrozen = true;
        UI.updateFreezeButton(true);
      });
    }
  }

  UI.updateFreezeButton(isFrozen);
  UI.showToast(isFrozen ? 'Frame dibekukan' : 'Live preview dilanjutkan');
}

// ─────────────────────────────────────────────
// HANDLER: SWITCH CAMERA
// ─────────────────────────────────────────────

/**
 * Ganti ke kamera lain yang tersedia.
 * Menghentikan stream lama sebelum memulai stream baru.
 * Reset freeze state setelah ganti kamera.
 *
 * @param {HTMLVideoElement} videoEl
 */
async function handleSwitchCamera(videoEl) {
  if (!videoEl) return;

  try {
    const cameras = await Camera.getAvailableCameras();
    if (cameras.length < 2) {
      UI.showToast('Hanya ada satu kamera tersedia');
      return;
    }

    // Cari kamera berikutnya
    const currentId = AppState.activeCameraId;
    const next = cameras.find(c => c.deviceId !== currentId) || cameras[0];

    // Stop stream lama terlebih dahulu
    if (AppState.activeStream) {
      Camera.stop(AppState.activeStream);
      AppState.activeStream = null;
    }

    const stream = await Camera.startWithDeviceId(videoEl, next.deviceId);
    AppState.activeStream = stream;
    AppState.activeCameraId = next.deviceId;

    // FIX: Reset freeze state saat ganti kamera — video baru selalu berjalan
    if (AppState.isFrozen) {
      AppState.isFrozen = false;
      UI.updateFreezeButton(false);
    }

    UI.showToast('Kamera diganti');
  } catch (err) {
    console.error('[ChromaSense] Gagal ganti kamera:', err);
    UI.showToast('Gagal mengganti kamera');
  }
}

// ─────────────────────────────────────────────
// HANDLER: COPY HEX
// ─────────────────────────────────────────────

/**
 * Salin kode HEX warna aktif ke clipboard.
 * Toast notifikasi ditampilkan oleh Utils.copyToClipboard.
 */
async function handleCopyHex() {
  if (!AppState.currentColor) {
    UI.showToast('Pilih warna terlebih dahulu');
    return;
  }
  await Utils.copyToClipboard(AppState.currentColor.hex);
}

// ─────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
