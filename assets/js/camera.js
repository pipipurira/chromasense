/**
 * camera.js — MediaDevices API wrapper
 * Mengelola lifecycle kamera: request, stream, stop, switch, error.
 */

/**
 * Mulai stream kamera ke elemen video.
 * @param {HTMLVideoElement} videoElement
 * @param {string|null} deviceId - deviceId spesifik (null = default)
 * @returns {Promise<MediaStream>}
 */
async function startCamera(videoElement, deviceId = null) {
  const constraints = {
    video: {
      facingMode: deviceId ? undefined : 'environment',
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width:  { ideal: 1280 },
      height: { ideal: 720 },
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    return stream;
  } catch (err) {
    // Re-throw dengan pesan yang lebih deskriptif
    throw categorizeError(err);
  }
}

/**
 * Stop semua track pada MediaStream.
 * @param {MediaStream} stream
 */
function stopCamera(stream) {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
}

/**
 * Ambil daftar kamera yang tersedia.
 * Note: Label hanya tersedia setelah izin diberikan.
 * @returns {Promise<MediaDeviceInfo[]>}
 */
async function getAvailableCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(d => d.kind === 'videoinput');
}

/**
 * Cek apakah MediaDevices API tersedia di browser ini.
 * @returns {boolean}
 */
function isMediaDevicesSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Kategorisasi error kamera menjadi pesan ramah pengguna.
 * @param {DOMException} err
 * @returns {Error} dengan properti .friendlyMessage
 */
function categorizeError(err) {
  const messages = {
    NotAllowedError:
      'Akses kamera ditolak. Izinkan akses kamera di pengaturan browser Anda.',
    PermissionDeniedError:
      'Akses kamera ditolak. Izinkan akses kamera di pengaturan browser Anda.',
    NotFoundError:
      'Kamera tidak ditemukan. Pastikan perangkat memiliki webcam.',
    DevicesNotFoundError:
      'Kamera tidak ditemukan. Pastikan perangkat memiliki webcam.',
    NotReadableError:
      'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut dan coba lagi.',
    TrackStartError:
      'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut dan coba lagi.',
    OverconstrainedError:
      'Resolusi kamera tidak didukung. Mencoba dengan pengaturan default...',
    TypeError:
      'Terjadi kesalahan konfigurasi kamera. Pastikan halaman dibuka melalui HTTPS.',
  };

  const friendly = messages[err.name] || `Kesalahan tidak dikenal: ${err.message}`;
  const error = new Error(friendly);
  error.originalError = err;
  error.friendlyMessage = friendly;
  error.isOverconstrained = err.name === 'OverconstrainedError';
  return error;
}

// Export global — konsisten dengan modul lain (window.X pattern)
// main.js memanggil Camera.start(), Camera.stop(), dll.
window.Camera = {
  start: startCamera,
  stop: stopCamera,
  getAvailableCameras,
  startWithDeviceId: (videoElement, deviceId) => startCamera(videoElement, deviceId),
  isSupported: isMediaDevicesSupported
};
