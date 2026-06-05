# Kan-Ji-Kan

> Belajar Kanji JLPT N4 dan lulus JLPT dengan cepat — aplikasi belajar Jepang offline-first berbasis web.

---

## Tentang Aplikasi

**Kan-Ji-Kan** adalah aplikasi belajar bahasa Jepang yang dirancang khusus untuk pelajar Indonesia yang ingin lulus **JLPT N4** secepat mungkin. Aplikasi ini berjalan sepenuhnya di browser dan mendukung mode offline (PWA), sehingga bisa digunakan kapan saja dan di mana saja tanpa koneksi internet.

Semua data kanji, kosakata, dan radikal tertanam langsung di aplikasi — tidak bergantung pada server untuk fitur belajar inti.

---

## Fitur Utama

- 📖 **1.175+ Kanji N5–N4** dengan onyomi, kunyomi, arti, dan level JLPT
- 📚 **11.711+ Kosakata** dari 20 batch Minna no Nihongo N4 + N5
- 🈳 **40+ Radikal** lengkap dengan relasi radikal → kanji → kosakata
- 🧠 **Adaptive Quiz** dengan distribusi 80% N4 / 20% N5
- 🎯 **Kanji Quiz** (5 mode: Kanji→Hiragana, Hiragana→Kanji, Kanji→Arti, Arti→Kanji, Konteks)
- 📜 **Radical Quiz** (7 level, termasuk Odd One Out dan Dokkai Based)
- 📖 **Reading / Dokkai** (Learning Reading, JLPT Reading, Adaptive Weakness Reading)
- 🔗 **Smart Vocabulary Link** — klik kata di bacaan untuk melihat arti dari database
- 📊 **Mastery Tracking** per kanji, kosakata, dan radikal
- 🔍 **Kanji & Radical Weakness Engine** — deteksi otomatis kelemahan user
- 🗂️ **Review Session** dengan antrian berulang untuk item yang belum dikuasai
- 💾 **Offline-First** — semua fitur belajar berjalan tanpa internet
- 📱 **PWA-Ready** — bisa diinstall di Android/iOS/Desktop

---

## Cara Install

```bash
# 1. Clone repository
git clone https://github.com/yarmaruli/JLPTN4-LEARNING-BY-YARMARULI.git

# 2. Masuk ke folder frontend
cd JLPTN4-LEARNING-BY-YARMARULI/src/frontend

# 3. Install dependencies
pnpm install
# atau jika menggunakan npm:
npm install
```

---

## Cara Menjalankan

```bash
# Dari folder src/frontend
pnpm dev
# atau:
npm run dev
```

Aplikasi akan berjalan di **http://localhost:5173**

> Buka browser dan akses `http://localhost:5173` untuk mulai belajar.

---

## Cara Build Produksi

```bash
# Dari folder src/frontend
pnpm build
# atau:
npm run build
```

Hasil build akan tersimpan di folder `dist/`. Folder ini berisi file statis yang siap di-deploy ke server atau platform hosting mana pun.

---

## Cara Deploy

Aplikasi ini dirancang untuk di-deploy di **Internet Computer (ICP)** menggunakan platform **Caffeine**.

```bash
# Dari root project (membutuhkan akses Caffeine platform)
# Deploy dilakukan otomatis melalui Caffeine build pipeline
# atau gunakan perintah:
deploy.sh
```

URL canister frontend setelah deploy:
- Frontend: `https://<canister-id>.icp0.io`

Untuk deployment mandiri, upload folder `dist/` ke hosting statis pilihan Anda (Netlify, Vercel, GitHub Pages, dll.).

---

## Cara Menggunakan PWA

### Di Desktop (Chrome / Edge / Brave)

1. Buka aplikasi di browser
2. Klik ikon **Install** (berbentuk komputer/unduh) di pojok kanan address bar
3. Klik **Install** pada dialog yang muncul
4. Aplikasi akan terbuka sebagai window tersendiri dan bisa diakses dari desktop

### Di Android (Chrome)

1. Buka aplikasi di Chrome
2. Tap menu titik tiga (⋮) di pojok kanan atas
3. Pilih **"Tambahkan ke Layar Utama"** atau **"Add to Home Screen"**
4. Konfirmasi dan ikon aplikasi akan muncul di home screen

### Di iOS (Safari)

1. Buka aplikasi di Safari
2. Tap ikon **Share** (kotak dengan panah ke atas)
3. Pilih **"Tambahkan ke Layar Utama"** / **"Add to Home Screen"**
4. Tap **Tambahkan** / **Add**

> Setelah diinstall, aplikasi berjalan offline. Semua data kanji dan kosakata tersimpan lokal di perangkat Anda.

---

## Tech Stack

| Teknologi | Keterangan |
|---|---|
| **React 19** | UI framework utama |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first CSS framework |
| **Vite** | Build tool & dev server (port 5173) |
| **Internet Computer (ICP)** | Platform deployment decentralized |
| **Motoko** | Backend canister language |
| **TanStack Query** | Server state management |
| **LocalStorage** | Offline persistence untuk progress user |
| **Service Worker** | PWA offline caching |

---

## Copyright

© 2025 **Dibuat oleh Kevin Year (Yar Maruli)**

Built with ❤️ using [caffeine.ai](https://caffeine.ai)

