# ChromaSense 🎨

> Real-Time Color Detection Web Application

Tunjuk kamera ke objek apapun. Klik. Ketahui nama, kode HEX, RGB, dan HSL-nya seketika.

[![Status](https://img.shields.io/badge/status-v1.0%20Final-brightgreen)](https://github.com/)
[![Platform](https://img.shields.io/badge/platform-Web%20Browser-blue)](https://chromasense.pages.dev)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Demo

🔗 [chromasense.pages.dev](https://chromasense.pages.dev)

---

## Fitur

| Fitur | Status |
|---|---|
| Akses webcam & live preview | ✅ Selesai |
| Sampling warna via klik/tap | ✅ Selesai |
| Nama warna (Bahasa Indonesia & Inggris) | ✅ Selesai |
| Kode HEX, RGB, HSL | ✅ Selesai |
| Freeze frame | ✅ Selesai |
| Copy HEX ke clipboard | ✅ Selesai |
| Histori warna (8 warna terakhir) | ✅ Selesai |
| Ganti kamera (multi-camera) | ✅ Selesai |
| Responsif (mobile, tablet, desktop) | ✅ Selesai |

---

## Tech Stack

- **Frontend**: HTML5 + Vanilla JavaScript
- **Styling**: CSS3 + Tailwind CSS (CDN)
- **Kamera**: `MediaDevices.getUserMedia()` Web API
- **Image Processing**: HTML5 Canvas API
- **Color Database**: [meodai/color-names](https://github.com/meodai/color-names) (469 warna dikurasi)
- **Deployment**: Cloudflare Pages

---

## Cara Pakai

1. Buka aplikasi di browser (pastikan HTTPS atau localhost)
2. Klik **"Aktifkan Kamera"** dan izinkan akses kamera
3. Arahkan kamera ke objek yang ingin diketahui warnanya
4. **Klik/tap** area manapun pada layar kamera
5. Info warna tampil: nama (ID & EN), HEX, RGB, HSL
6. Klik **"Salin HEX"** untuk menyalin kode warna ke clipboard
7. Gunakan tombol **Freeze** untuk membekukan frame dan memilih warna dengan lebih presisi

---

## Struktur Proyek

```
chromasense/
├── index.html              # Entry point SPA
├── _headers                # Cloudflare Pages HTTP security headers
├── wrangler.toml           # Cloudflare Pages config
├── assets/
│   ├── css/
│   │   └── style.css       # Custom styles
│   ├── js/
│   │   ├── main.js         # Inisialisasi & event binding
│   │   ├── camera.js       # MediaDevices API wrapper
│   │   ├── colorEngine.js  # RGB↔HSL↔HEX, nearest color matching
│   │   ├── colorDB.js      # Color database loader & cache
│   │   ├── state.js        # AppState — single source of truth
│   │   ├── ui.js           # DOM update functions
│   │   └── utils.js        # Helpers: clipboard, debounce, clamp
│   └── data/
│       └── colors.json     # Database 469 nama warna (ID + EN + HEX)
└── README.md
```

---

## Development

```bash
# Clone repo
git clone https://github.com/username/chromasense.git
cd chromasense

# Jalankan lokal (butuh HTTP server, bukan file://)
npx serve .

# Atau gunakan VS Code Live Server
# Buka http://localhost:3000
```

> ⚠️ `getUserMedia()` hanya berfungsi di **HTTPS** atau **localhost**.  
> Jangan buka langsung via `file://` — kamera tidak akan bisa diakses.

---

## Kompatibilitas Browser

| Browser | Status |
|---|---|
| Chrome 80+ | ✅ Full support |
| Firefox 75+ | ✅ Full support |
| Safari 14+ (iOS & macOS) | ✅ Full support |
| Edge 80+ | ✅ Full support |
| Chrome Android | ✅ Termasuk rear camera |

---

## Privasi

- ✅ Semua pemrosesan dilakukan **sepenuhnya di browser** (client-side only)
- ✅ **Tidak ada data** yang dikirimkan ke server apapun
- ✅ **Video tidak direkam** atau disimpan — hanya satu frame di-snapshot saat klik
- ✅ Stream kamera otomatis dihentikan saat tab ditutup

---

## Roadmap

- **Fase 0** ✅ — Setup project, struktur file, deploy awal ke Cloudflare Pages
- **Fase 1** ✅ — Webcam access, live feed, pixel sampling, nilai RGB
- **Fase 2** ✅ — Color naming (ID & EN), HEX, HSL, Color Info Panel
- **Fase 3** ✅ — Freeze mode, Copy HEX, history strip, responsive polish
- **Fase 4** ✅ — Bug fixes, JSDoc, cross-browser hardening, dokumentasi final

---

## Referensi

- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [meodai/color-names](https://github.com/meodai/color-names)
- [Redmean color distance formula](http://www.compuphase.com/cmetric.htm)

---

## License

MIT — bebas digunakan untuk belajar dan berkarya.

---

*ChromaSense v1.0 — learning project by pipipurira*
