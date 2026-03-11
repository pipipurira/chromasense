# ChromaSense 🎨

> Real-Time Color Detection Web Application

Tunjuk kamera ke objek apapun. Klik. Ketahui nama, kode HEX, RGB, dan HSL-nya seketika.

[![Status](https://img.shields.io/badge/status-Fase%200-yellow)](https://github.com/)
[![Platform](https://img.shields.io/badge/platform-Web%20Browser-blue)](https://chromasense.pages.dev)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Demo

🔗 [chromasense.pages.dev](https://chromasense.pages.dev) *(deploy setelah Fase 0)*

---

## Fitur

| Fitur | Status |
|---|---|
| Akses webcam & live preview | 🚧 Fase 1 |
| Sampling warna via klik/tap | 🚧 Fase 1 |
| Nama warna (ID & EN) | 🚧 Fase 2 |
| Kode HEX, RGB, HSL | 🚧 Fase 2 |
| Freeze frame | 🚧 Fase 3 |
| Copy HEX ke clipboard | 🚧 Fase 3 |
| Histori warna | 🚧 Fase 3 |

---

## Tech Stack

- **Frontend**: HTML5 + Vanilla JavaScript (ES Modules)
- **Styling**: CSS3 + Tailwind CSS (CDN)
- **Kamera**: `MediaDevices.getUserMedia()` Web API
- **Image Processing**: HTML5 Canvas API
- **Color Database**: [meodai/color-names](https://github.com/meodai/color-names) (bestof subset)
- **Deployment**: Cloudflare Pages

---

## Cara Pakai

1. Buka aplikasi di browser (pastikan HTTPS atau localhost)
2. Klik **"Aktifkan Kamera"** dan izinkan akses kamera
3. Arahkan kamera ke objek yang ingin diketahui warnanya
4. **Klik/tap** area manapun pada layar kamera
5. Info warna tampil: nama, HEX, RGB, HSL
6. Klik **"Salin HEX"** untuk menyalin kode warna ke clipboard

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
│   │   ├── colorEngine.js  # RGB↔HSL↔HEX, nearest color
│   │   ├── colorDB.js      # Color database loader
│   │   ├── state.js        # AppState management
│   │   ├── ui.js           # DOM update functions
│   │   └── utils.js        # Helpers: clipboard, debounce, sampling
│   └── data/
│       └── colors.json     # Database nama warna (ID + EN + HEX)
└── README.md
```

---

## Development

```bash
# Clone repo
git clone https://github.com/username/chromasense.git
cd chromasense

# Jalankan lokal (butuh HTTP server, bukan file://)
# Gunakan VS Code Live Server, atau:
npx serve .

# Buka di browser
# http://localhost:3000
```

> ⚠️ `getUserMedia()` hanya berfungsi di **HTTPS** atau **localhost**.  
> Jangan buka langsung via `file://` — kamera tidak akan bisa diakses.

---

## Privasi

- ✅ Semua pemrosesan dilakukan **sepenuhnya di browser** (client-side only)
- ✅ **Tidak ada data** yang dikirimkan ke server apapun
- ✅ **Video tidak direkam** atau disimpan
- ✅ Stream kamera otomatis dihentikan saat tab ditutup

---

## Roadmap

- **Fase 0** ✅ — Setup project, struktur file, deploy awal
- **Fase 1** 🚧 — Webcam access, live feed, pixel sampling
- **Fase 2** ⏳ — Color naming system (ID & EN), HEX, HSL
- **Fase 3** ⏳ — Freeze, Copy HEX, history strip, responsive polish
- **Fase 4** ⏳ — Cross-browser testing, bug fix, dokumentasi, blog post

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

*ChromaSense — learning project by pipipurira*
