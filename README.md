<div align="center">

# 📚 PustakaKita
### Platform Perpustakaan Digital Siswa Berbasis AI, 3D FlipBook, dan Privasi Terenkripsi (UU PDP)

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Rust WASM](https://img.shields.io/badge/Rust_WASM-HMAC_SHA256-DEA584?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Database](https://img.shields.io/badge/Database-Neon_PostgreSQL-00E599?logo=postgresql&logoColor=black)](https://neon.tech/)
[![Storage](https://img.shields.io/badge/Storage-S3_Compatible-FF9900?logo=amazon-s3&logoColor=white)](https://aws.amazon.com/s3/)

<p align="center">
  Solusi perpustakaan digital resmi sekolah untuk jenjang <b>SD, SMP, dan SMA</b>.<br />
  Menghadirkan pengalaman membaca layaknya buku cetak asli melalui visual 3D interaktif, Text-to-Speech AI, dan perlindungan data pribadi tingkat tinggi.
</p>

</div>

---

## 🌟 Fitur Utama

### 1. 📖 Interactive 3D FlipBook Reader (Ala FlipHTML5)
- **Tampilan 2 Halaman Berdampingan (*Spread Mode*):** Pengalaman membaca buku pelajaran dan literasi yang imersif dan proporsional.
- **Efek Suara Lembaran Kertas Realistis:** Menggunakan Web Audio API (100% lokal & offline tanpa dependensi file eksternal).
- **Double-Buffering Anti-Glitch:** Rendering dokumen PDF via PDF.js di memori kanvas latar (*offscreen*) untuk mencegah kedipan layar putih atau *tearing*.
- **Kontrol Baca Lengkap:** Navigasi cepat `|<<` `<` `>` `>>|`, galeri thumbnail miniatur halaman, zoom responsif (75%–135%), mode layar penuh (*fullscreen*), serta auto-flip slideshow.

### 2. 🛡️ Keamanan & Kepatuhan Privasi (UU PDP No. 27/2022)
- **NISN Tidak Disimpan Mentah:** Nomor Induk Siswa Nasional di-hash satu arah menggunakan modul kriptografi **Rust WebAssembly HMAC-SHA256**.
- **Enkripsi Kredensial:** PIN 6 digit siswa di-hash dengan Bcrypt.
- **Watermark Dinamis Anti-Pirasi:** Menampilkan watermark hash NISN dan nama sekolah secara transparan untuk melindungi hak cipta koleksi sekolah.

### 3. 🏫 Sinkronisasi Identitas Sekolah Otomatis
- **First-Time Setup Modal:** Ketika aplikasi pertama kali dipasang, sistem meminta pengisian biodata sekolah (Nama Sekolah, NPSN, Alamat, Guru Pustakawan, dan Kepala Sekolah).
- **Sinkronisasi Menyeluruh:** Seluruh komponen, kop laporan, dashboard, formulir login NISN, dan footer buku langsung menyesuaikan identitas sekolah secara dinamis.

### 4. 📊 Dashboard Pengelola & Analitik Literasi
- **Manajemen Siswa & Akun:** Kelola akun siswa dengan tabel rapi, avatar inisial, filter kelas, reset PIN mandiri, dan pencarian cepat.
- **Impor Massal Excel/CSV:** Unggah ribuan siswa sekaligus menggunakan file Excel (`.xlsx`, `.xls`) atau CSV.
- **Katalog Buku & Upload Cloud:** Unggah berkas buku digital (PDF) dan gambar sampul ke Object Storage S3 / Neon DB.
- **Manajemen Kategori:** Tambah dan kelola klasifikasi rak (Fiksi, Sains, Sejarah, Agama, Komik, BSE).
- **Ekspor & Backup Data:** Ekspor data dalam format CSV serta backup arsip JSON sistem perpustakaan.

### 5. 🎧 Literasi Digital Interaktif untuk Siswa
- **Text-to-Speech (TTS) Bahasa Indonesia:** Dengarkan isi buku dengan intonasi natural dan kecepatan suara yang dapat disesuaikan.
- **Kamus Kontekstual Sains:** Ketuk istilah sains bergaris bawah untuk memunculkan definisi dan contoh penerapan.
- **Gamifikasi XP Literasi:** Dapatkan poin XP setiap membaca lembaran buku, menyelesaikan bab, dan membuat catatan rangkuman.
- **Buku Tamu / Baca Cepat:** Akses langsung katalog buku perpustakaan bagi siswa yang belum memiliki atau belum hafal NISN.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| **Framework Frontend** | [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Client Components) |
| **Library UI** | [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), Radix UI Primitives |
| **Ikon & Desain** | Lucide React, Tailwind CSS Animate, Next Themes |
| **PDF & 3D Canvas** | [PDF.js](https://mozilla.github.io/pdf.js/), HTML5 Canvas, Web Audio API, Three.js / Drei |
| **Keamanan & Kriptografi** | Rust WebAssembly (`crates/pustakakita_crypto`), Bcrypt.js, Jose (JWT) |
| **Database** | [Neon PostgreSQL Serverless](https://neon.tech/) |
| **Object Storage** | S3-Compatible Cloud Storage (`@aws-sdk/client-s3`) |
| **Parser Spreadsheet** | SheetJS (xlsx) |

---

## 📁 Struktur Direktori Proyek

```text
PerpustakaanDigitalSiswa/
├── app/                        # Next.js App Router (Halaman & API Routes)
│   ├── admin/                  # Dashboard Admin Pengelola Perpustakaan
│   ├── api/                    # API Endpoints (Auth, Books, Students, Backup, S3)
│   ├── library/                # Rak & Katalog Koleksi Buku Digital
│   ├── login/                  # Halaman Masuk Siswa (NISN) & Pustakawan
│   ├── read/[bookId]/          # Halaman Pembaca Buku (FlipHTML5 3D & Audio Mode)
│   ├── icon.tsx                # Dynamic Favicon Tab Generator (Next.js OG)
│   └── layout.tsx              # Root Layout, Metadata & Font Configuration
├── components/                 # Komponen Reusable UI
│   ├── AdminAnalyticsPanel.tsx # Panel Admin Lengkap (Analitik, Buku, Kategori, Siswa)
│   ├── Bookshelf.tsx           # Rak Buku 2D Visual
│   ├── FlipHtml5Viewer.tsx     # Viewer Buku 3D FlipHTML5 (PDF.js + Web Audio)
│   ├── NISNLoginForm.tsx       # Form Login Siswa (Keypad NISN & PIN)
│   ├── ReaderToolbar.tsx       # Toolbar Kontrol Membaca & Audio AI
│   └── SchoolSetupModal.tsx    # Modal Pengisian Biodata Sekolah Pertama Kali
├── context/                    # React Context (LibraryContext, State Management)
├── crates/
│   └── pustakakita_crypto/     # Modul Rust untuk Hashing NISN HMAC-SHA256 (WASM)
├── lib/                        # Utilitas, Koneksi Database (db.ts), S3 Client, Mock Data
├── public/                     # Aset Statis Publik (favicon.svg, uploads)
├── scripts/                    # Skrip Migrasi, Seed Database, & Uji Beban K6
├── .env.example                # Template Konfigurasi Environment Variables
├── package.json
└── tailwind.config.ts
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat Sistem
- **Node.js** v18.17.0 atau lebih baru
- **Package Manager:** `pnpm` (disarankan) atau `npm`

### 2. Kloning Repositori
```bash
git clone https://github.com/KingRovs771/PustakaKita.git
cd PustakaKita
```

### 3. Instalasi Dependensi
```bash
pnpm install
```

### 4. Konfigurasi Environment Variables
Salin berkas `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Sesuaikan variabel di `.env.local`:
```env
# Database Neon PostgreSQL
DATABASE_URL="postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require"

# JWT Auth Secret
JWT_SECRET="ganti-dengan-string-rahasia-minimal-32-karakter"

# S3 Compatible Object Storage (Cloudflare R2 / AWS S3 / MinIO)
S3_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_ACCESS_KEY_ID="your_access_key_id"
S3_SECRET_ACCESS_KEY="your_secret_access_key"
S3_BUCKET_NAME="pustakakita"
S3_PUBLIC_DOMAIN="https://pub-sample.r2.dev"
```

### 5. Inisialisasi Database
Jalankan migrasi skema tabel dan data awal:
```bash
pnpm exec tsx scripts/migrate.ts
pnpm exec tsx scripts/seed.ts
```

### 6. Menjalankan Server Pengembangan
```bash
pnpm dev
```
Buka browser dan akses **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Kredensial Default (Testing / Demo)

| Role | Username / NISN | Password / PIN | Deskripsi |
|---|---|---|---|
| **Guru Pustakawan** | Akses via Tab *Admin Pustakawan* | Sandi Admin Terdaftar | Hak akses penuh CRUD buku, siswa, dan backup |
| **Siswa Contoh** | Masuk via NISN terdaftar | PIN 6 digit | Akses rak buku, membaca, dan koleksi pribadi |
| **Mode Tamu** | Langsung pilih jenjang (SD / SMP / SMA) | Tanpa Sandi | Pratinjau katalog perpustakaan sekolah |

---

## 📄 Lisensi
Proyek ini didistribusikan di bawah lisensi **MIT License**. Hak Cipta &copy; 2026 PustakaKita.

