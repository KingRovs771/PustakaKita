# PRD — Perpustakaan Digital Siswa

Nov 4, 2026 · @Rizky Budiarto

---

## 1. Executive Summary

**Perpustakaan Digital Siswa** adalah platform web perpustakaan virtual untuk satu sekolah (single-tenant) yang memungkinkan siswa SD–SMA membaca, melacak progres baca, dan mendapatkan rekomendasi buku berbasis AI — semuanya di atas infrastruktur gratis (Netlify + Neon + Cloudflare R2).

### Visi Produk

Menjadi jembatan literasi digital pertama yang bisa dioperasikan mandiri oleh setiap sekolah di Indonesia tanpa biaya infrastruktur, sambil menghasilkan data membaca yang terukur untuk mendukung kebijakan literasi berbasis bukti.

### Target User

| Segmen | Deskripsi | Jumlah Estimasi |
| --- | --- | --- |
| Siswa (Reader) | SD kelas 4–SMA kelas 12, usia 10–18 tahun | 300–2.000 per sekolah |
| Guru / Admin Perpustakaan | Pengelola koleksi dan pelaporan | 1–5 per sekolah |
| Kepala Sekolah (Stakeholder) | Pemantau KPI dan pelaporan ke dinas | 1 per sekolah |

### Value Proposition vs. Perpustakaan Digital Konvensional

| Dimensi | iPusnas / iJakarta | Perpustakaan Digital Siswa |
| --- | --- | --- |
| Auth | OAuth / registrasi email | NISN + PIN — tanpa email, cocok anak SD |
| Data privasi | Data di server nasional | Data di sekolah sendiri (Neon per-sekolah) |
| Konten | Koleksi nasional generik | Kurasi lokal + BSE + upload guru |
| Analytics siswa | Tidak ada | Per-NISN, real-time, untuk guru |
| Rekomendasi | Tidak ada | Collaborative filtering berbasis histori baca |
| Biaya sekolah | Gratis (tapi tidak customizable) | Gratis + fully customizable + self-hosted |
| Offline support | Tidak ada | PWA + service worker |

### Batasan Desain Utama (Free Tier)

- **Neon Free:** 0,5 GB storage, 10 compute-hours/bulan, auto-suspend setelah 5 menit idle — semua query harus efisien
- **Netlify Free:** 125.000 function invocations/bulan, 100 GB bandwidth — caching agresif di Edge
- **Cloudflare R2 Free:** 10 GB storage, 1 juta Class A ops/bulan (tulis/upload) dan 10 juta Class B ops/bulan (baca) - file buku dikompresi; buku dibaca via pre-signed URL berumur pendek, cover via public bucket + cache CDN
- **AI Embedding:** Hugging Face Inference API free tier (rate-limited) atau model kecil (MiniLM-L6, 22 MB) di Wasm

> &#91;ASUMSI\] Jumlah siswa aktif per sekolah diasumsikan ≤ 1.000 untuk tetap dalam batas free tier Neon. Jika lebih, perlu upgrade ke Neon Launch ($19/bulan). Mohon konfirmasi ukuran sekolah target.

### Keputusan Teknis Final (4 Nov 2026)

Keputusan berikut menyelesaikan ketidakkonsistenan antara PRD dan DESIGN. Jika ada bagian lain yang bertentangan, bagian ini yang berlaku.

| Topik | Keputusan | Alasan |
| --- | --- | --- |
| Format NISN | **10 digit** (format NISN resmi, mengikuti DESIGN) | NISN nyata terdiri dari 10 digit |
| Stack backend | **Next.js 14 (App Router, TypeScript) di Netlify** via `@netlify/plugin-nextjs`. Halaman publik SSG/ISR, API sebagai Route Handlers (Netlify Functions, runtime Node), Edge middleware hanya untuk verifikasi JWT + header keamanan (Web Crypto). **Tanpa Rust/Wasm di MVP.** | Satu bahasa (TypeScript), cocok untuk solo dev, bcrypt butuh runtime Node |
| Rak 3D | **React Three Fiber** (mengikuti DESIGN 4.2 dan 8.2), di-lazy-load via `next/dynamic` (`ssr: false`), hanya desktop >= 1024px, non-reduced-motion, bukan mode hemat data, RAM >= 4 GB; selain itu fallback 2D | Bundle three tidak menyentuh pengguna mobile; tetap Phase 2 (F09, COULD) |
| Hashing NISN | `nisn_hash = HMAC-SHA256(NISN, NISN_PEPPER)` dihitung di server (Web Crypto). Pepper hanya di env var Netlify, bukan di DB | Ruang NISN hanya 10^10; SHA-256 + salt statis bisa di-brute-force offline dalam menit-jam bila DB bocor. HMAC + pepper rahasia tidak bisa diuji tanpa pepper |
| Hashing PIN | `bcrypt` cost 10 (`bcryptjs`, Netlify Function Node) + lockout/rate limit di Neon | PIN 6 digit lemah secara entropi; proteksi utama adalah pembatasan percobaan |
| Pre-signed URL R2 | **Cover:** public bucket + cache immutable 30 hari (tanpa pre-signed). **Buku:** bucket privat, pre-signed GET **TTL 30 menit**, diterbitkan setelah cek JWT + `is_published`. **Upload admin:** pre-signed PUT **TTL 10 menit** + verifikasi `HEAD` | Cover tidak sensitif dan harus ter-cache CDN; buku perlu akses terkontrol; TTL pendek membatasi dampak URL bocor |
| Skema retensi | Kolom baru `students.first_login_at` untuk metrik D7/D30 | Query D7 sebelumnya memakai kolom yang tidak ada |
| Tracking WAR Akurat | Tabel agregat harian `daily_reading_stats` (`student_nisn_hash`, `reading_date`, `read_minutes`) di-upsert saat progres disimpan | Menghitung Weekly Active Readers (WAR) secara presisi berdasarkan akumulasi durasi baca 7 hari terakhir (bukan total seumur hidup) |

## 2. User Personas & Journey Map

### Persona 1 — Siswa (Reader)

**Budi Santoso, 14 tahun, Siswa SMP kelas 8**

- **Goals:** Menemukan buku pelajaran yang bisa dibaca di luar sekolah, menyelesaikan tugas membaca dari guru, dan menemukan buku cerita yang menarik
- **Pain Points:** Perpustakaan fisik tutup di luar jam sekolah, tidak tahu buku apa yang cocok untuknya, PIN terlupa sesekali
- **Tech Literacy:** Menengah — lancar pakai HP Android, belum pernah pakai PDF reader
- **Context:** Sering pakai HP di rumah, koneksi internet kadang lambat

**User Journey — Budi membaca buku pertamanya:**

| Tahap | Aksi Budi | Sistem | Emosi |
| --- | --- | --- | --- |
| 1. Discovery | Dapat info dari guru bahwa ada perpustakaan digital | — | Penasaran |
| 2. Login | Masukkan NISN 10 digit + PIN 6 digit | Verifikasi NISN + PIN di server, set session JWT | Sedikit bingung (perlu cari kartu pelajar) |
| 3. Explore | Lihat rak buku virtual, scroll kategori | Render bookshelf, load covers dari R2 | Tertarik, visual menarik |
| 4. Pilih Buku | Klik buku rekomendasi guru | Load metadata, cek akses | Excited |
| 5. Baca | Buka PDF reader, baca 20 halaman | Auto-save progress setiap 5 halaman | Fokus |
| 6. Interrupt | Koneksi internet terputus | Service worker serve offline cache | Tidak frustrasi (offline works) |
| 7. Resume | Buka kembali besok | Progress tersimpan, lanjut halaman 21 | Senang — progress tidak hilang |
| 8. Selesai | Tandai buku selesai | Update reading\_history, trigger rekomendasi | Bangga, lihat rekomendasi baru |

---

### Persona 2 — Guru / Admin Perpustakaan (Manager)

**Bu Rina Kusuma, 38 tahun, Pustakawan SMP**

- **Goals:** Kelola koleksi buku digital, pantau siswa yang aktif membaca, buat laporan bulanan untuk kepala sekolah
- **Pain Points:** Tidak tahu siswa mana yang sudah/belum membaca buku wajib, proses upload buku ribet, laporan manual memakan waktu
- **Tech Literacy:** Menengah — mahir Word/Excel, belum pernah kelola CMS
- **Context:** Pakai laptop sekolah Windows di ruang perpustakaan

**User Journey — Bu Rina upload buku baru dan cek laporan:**

| Tahap | Aksi Bu Rina | Sistem | Emosi |
| --- | --- | --- | --- |
| 1. Upload | Login admin → klik "Tambah Buku" | Form upload dengan validasi tipe file (PDF/EPUB ≤ 50 MB) | Siap |
| 2. Metadata | Isi judul, pengarang, kategori, sumber (BSE / internal) | Auto-detect cover dari metadata PDF | Mudah |
| 3. Upload File | Drag & drop PDF | Upload ke R2 via pre-signed URL, generate embedding | Menunggu, butuh progress bar |
| 4. Publish | Klik "Terbitkan" | Buku muncul di rak semua siswa | Lega |
| 5. Monitor | Buka halaman Analytics | Dashboard: siswa aktif minggu ini, buku paling dibaca | Informatif |
| 6. Filter | Filter per kelas 8A | Lihat daftar siswa kelas 8A + progres baca masing-masing | Khawatir — 15 siswa belum buka sama sekali |
| 7. Laporan | Klik "Export Laporan" | Generate PDF laporan bulanan otomatis | Lega — tidak perlu buat manual |

---

### Persona 3 — Kepala Sekolah (Stakeholder)

**Pak Hendra Wijaya, 52 tahun, Kepala SMP Negeri**

- **Goals:** Lihat KPI literasi sekolah secara keseluruhan, siapkan data untuk evaluasi dinas pendidikan, tunjukkan dampak program membaca
- **Pain Points:** Data dari Bu Rina selalu terlambat, tidak ada visualisasi trend, susah membandingkan antar kelas
- **Tech Literacy:** Rendah-menengah — lebih suka ringkasan dan grafik daripada tabel panjang
- **Context:** Lihat laporan di tablet atau HP saat rapat

**User Journey — Pak Hendra mempersiapkan presentasi dinas:**

| Tahap | Aksi Pak Hendra | Sistem | Emosi |
| --- | --- | --- | --- |
| 1. Login | Login dengan akun principal | Dashboard kepala sekolah (view-only, no edit) | Langsung ke point |
| 2. Overview | Lihat ringkasan bulan ini | Kartu: Total baca, siswa aktif, buku selesai, rata-rata durasi | Puas — data tersedia |
| 3. Trend | Lihat grafik tren 3 bulan | Line chart: WAR (Weekly Active Readers) | Senang — tren naik |
| 4. Komparasi | Bandingkan kelas 7 vs 8 vs 9 | Bar chart per kelas, sortable | Concern: kelas 9 rendah |
| 5. Export | "Unduh Laporan untuk Dinas" | Generate PDF 2 halaman, A4, siap print | Lega — siap presentasi |

## 3. Feature Specifications (MoSCoW)

### Feature Matrix

| # | Fitur | Prioritas | Phase | Effort |
| --- | --- | --- | --- | --- |
| F01 | Login NISN-PIN + Session | MUST | 1 | M |
| F02 | Rak Buku Virtual (catalog) | MUST | 1 | M |
| F03 | PDF/EPUB Reader + Progress | MUST | 1 | L |
| F04 | Riwayat Baca per User | MUST | 1 | S |
| F05 | Admin Dashboard (basic) | MUST | 1 | M |
| F06 | Visitor Analytics | SHOULD | 2 | M |
| F07 | PWA + Offline Support | SHOULD | 2 | M |
| F08 | Rekomendasi Personal | SHOULD | 2 | L |
| F09 | Rak Buku 3D/2.5D Visual | COULD | 2 | XL |
| F10 | AI Reading Insights | COULD | 3 | XL |
| F11 | DRM / Watermark PDF | COULD | 3 | L |
| F12 | Multi-tenant / multi-sekolah | WON'T | — | — |

> Effort: S = ≤1 minggu, M = 1–2 minggu, L = 2–4 minggu, XL = >4 minggu (estimasi solo dev)

---

### F01 — Login NISN-PIN + Session Management

**Deskripsi:** Autentikasi siswa menggunakan NISN 10-digit dan PIN 6-digit numerik. Session berbasis JWT yang disimpan di httpOnly cookie. Tidak ada OAuth, tidak ada email.

**Acceptance Criteria:**

- **Given** siswa memasukkan NISN dan PIN yang benar **When** menekan tombol Masuk **Then** menerima JWT (access token 15 menit + refresh token 7 hari) dan diarahkan ke halaman beranda
- **Given** PIN salah 5 kali berturut-turut **When** percobaan ke-6 **Then** akun di-lock 15 menit dan pesan error ditampilkan tanpa menyebut NISN valid/invalid
- **Given** access token kadaluarsa **When** siswa melakukan request **Then** sistem otomatis meminta refresh token (`/api/auth/refresh`); jika refresh token juga expired, redirect ke halaman login
- **Given** siswa logout **When** klik Keluar **Then** refresh token di-invalidate di DB (blacklist) dan cookie dihapus

**Technical Constraints:**

- PIN di-hash dengan bcrypt (cost factor 10, `bcryptjs`) di Route Handler Node (Netlify Function) sebelum query ke Neon - jangan hash di client. Edge runtime tidak dipakai untuk bcrypt
- NISN tidak pernah disimpan plaintext; simpan sebagai `HMAC-SHA256(NISN, NISN_PEPPER)` (hex 64 karakter, dihitung di server) di tabel `students`
- Saat login berhasil: isi `students.first_login_at` hanya jika masih NULL, dan selalu update `last_login_at`
- JWT RS256 (asymmetric) — private key sebagai Netlify environment variable, public key untuk verifikasi di Edge
- Neon cold start bisa +500ms pada request pertama — tampilkan skeleton loader, jangan timeout < 3 detik
- Rate limit: 10 request/menit per IP untuk endpoint `/auth/login` via Edge middleware

**Security Considerations:**

- Tidak menyimpan NISN rawnya di mana pun (log, DB, JWT claims) — gunakan `nisn_hash` sebagai identifier
- httpOnly + SameSite=Strict cookie mencegah XSS token theft
- CORS hanya izinkan origin domain Netlify deployment
- Brute-force protection: counter di Neon, bukan in-memory (stateless Edge)

---

### F02 — Rak Buku Virtual dengan Kategori

**Deskripsi:** Halaman beranda menampilkan koleksi buku dalam tampilan rak virtual (grid card dengan cover buku). Siswa dapat filter per kategori, cari judul/pengarang, dan sort. Fase 1 adalah grid 2D responsif; fase 2 opsional upgrade ke rak 3D (React Three Fiber, lazy-loaded) dengan fallback 2D.

**Acceptance Criteria:**

- **Given** siswa login **When** membuka beranda **Then** melihat grid cover buku dengan kategori aktif, load dalam < 2 detik (LCP)
- **Given** siswa klik filter "Fiksi" **When** filter aktif **Then** hanya buku kategori Fiksi ditampilkan, URL terupdate (`?cat=fiksi`) agar bisa di-bookmark
- **Given** siswa mengetik di kotak pencarian **When** ≥ 3 karakter **Then** hasil muncul dalam 300ms (debounced, full-text search via Neon `tsvector`)
- **Given** koleksi > 50 buku **When** halaman di-load **Then** pagination atau infinite scroll — maksimal 20 buku per request

**Technical Constraints:**

- Cover buku di-serve dari Cloudflare R2 public bucket dengan cache-control 30 hari — JANGAN load langsung dari Neon
- Neon query untuk catalog wajib pakai `LIMIT 20 OFFSET n` — tidak boleh `SELECT *` seluruh tabel
- Full-text search pakai PostgreSQL `tsvector` — index GIN wajib ada di kolom `title || ' ' || author`
- 3D bookshelf (fase 2): React Three Fiber (`three` + `@react-three/fiber` + `@react-three/drei`), `<Canvas frameloop="demand">`, di-import via `next/dynamic` (`ssr: false`) hanya jika desktop >= 1024px, tanpa `prefers-reduced-motion`, bukan mode hemat data, dan RAM >= 4 GB; selain itu fallback ke grid/rak 2D. Bundle three (~150 KB gzip) tidak boleh masuk bundle utama

**Security Considerations:**

- Cover buku tidak sensitif: disajikan dari public bucket R2 (custom domain, key berbasis hash konten yang tidak bisa ditebak) dengan cache immutable 30 hari - tanpa pre-signed URL agar cache CDN efektif dan tidak menambah invocation
- Input pencarian di-sanitize (parameterized query, bukan string concat) untuk mencegah SQL injection

---

### F03 — PDF/EPUB Reader + Progress Tracking

**Deskripsi:** Reader berbasis browser menggunakan PDF.js (PDF) dan Foliate-js / epub.js (EPUB). Progress baca (halaman terakhir) di-autosave ke Neon setiap 5 halaman atau saat tab ditutup. Buku di-serve dari R2 via pre-signed URL dengan TTL 30 menit.

**Acceptance Criteria:**

- **Given** siswa klik buku **When** reader terbuka **Then** lanjut dari halaman terakhir yang dibaca (bukan dari halaman 1)
- **Given** siswa membaca dan menutup tab **When** membuka kembali **Then** progres tersimpan (tolerance: ±5 halaman dari posisi sebelumnya)
- **Given** buku berformat EPUB **When** dibuka di reader **Then** siswa dapat resize font (S/M/L) dan ganti mode gelap
- **Given** pre-signed URL R2 hampir kadaluarsa (TTL 30 menit, diperbarui pada 80% TTL) **When** siswa masih membaca **Then** reader otomatis minta URL baru via `/api/books/:id/url` tanpa reload halaman

**Technical Constraints:**

- PDF.js versi terbaru (v4+) — load sebagai Web Worker untuk tidak block main thread
- Pre-signed URL R2 dibuat di Route Handler (server-side, setelah verifikasi JWT dan cek `is_published`) - private key R2 tidak pernah ke client
- Progress save menggunakan `beforeunload` event + `navigator.sendBeacon()` untuk reliability saat tab ditutup
- Neon `upsert` pada `reading_sessions` — gunakan `ON CONFLICT (student_nisn_hash, book_id) DO UPDATE`
- File buku maks. 50 MB per buku - divalidasi di form admin dan diverifikasi ulang server via `HEAD` objek R2 (ukuran + content-type) sebelum buku boleh `is_published`

**Security Considerations:**

- Buku disajikan lewat pre-signed URL privat (bukan public bucket). Catatan jujur: pre-signed URL adalah bearer token - siapa pun yang memegang URL bisa membaca sampai TTL habis. Mitigasi: hanya diterbitkan ke request ber-JWT valid, TTL singkat, tidak di-log, dan tidak pernah dikirim ke `visitor_logs`
- TTL pre-signed GET: 30 menit (diperbarui otomatis oleh reader pada 80% TTL); pre-signed PUT upload admin: 10 menit
- Tidak ada download tombol di UI siswa — URL R2 menggunakan `Content-Disposition: inline` bukan attachment

---

### F04 — Riwayat Baca per User

**Deskripsi:** Halaman riwayat menampilkan semua buku yang pernah dibuka, progres per buku, dan buku yang sudah selesai. Data ini juga menjadi input rekomendasi.

**Acceptance Criteria:**

- **Given** siswa membuka halaman Riwayat **When** halaman load **Then** melihat list buku (cover + judul + % progress + terakhir dibaca), diurutkan paling baru
- **Given** siswa menyelesaikan buku (progres 100%) **When** sesi reading berakhir **Then** entry muncul di tab "Selesai" dengan tanggal selesai
- **Given** admin melihat riwayat siswa tertentu **When** di dashboard admin **Then** melihat data yang sama tapi dengan tambahan total durasi baca (menit)

**Technical Constraints:**

- Query join antara `reading_sessions` dan `books` — pastikan index pada `student_nisn_hash` dan `updated_at`
- Tidak ada pagination yang dibutuhkan untuk ≤ 500 buku per siswa (sangat unlikely di free tier)

**Security Considerations:**

- Siswa hanya bisa lihat riwayat milik sendiri — middleware validasi `nisn_hash` dari JWT
- Admin bisa lihat riwayat semua siswa — role check di Edge Function

---

### F05 — Admin Dashboard (Book Management + Analytics)

**Deskripsi:** Interface terpisah untuk admin perpustakaan dan kepala sekolah. Admin dapat: upload buku, edit metadata, hapus buku, lihat analytics siswa. Kepala sekolah: view-only analytics.

**Acceptance Criteria:**

- **Given** admin upload PDF baru **When** file di-select dan submit **Then** file terupload ke R2, metadata tersimpan di Neon, buku muncul di katalog dalam < 5 menit
- **Given** admin melihat halaman Analytics **When** filter bulan aktif **Then** melihat: total siswa aktif, buku paling dibaca (top 10), rata-rata durasi baca, siswa yang belum login sama sekali
- **Given** kepala sekolah login **When** akses halaman edit buku **Then** mendapat pesan "Akses Ditolak" (role-based access)

**Technical Constraints:**

- Upload ke R2 via pre-signed PUT URL (TTL 10 menit) dari Route Handler - file tidak lewat Netlify Function (bandwidth limit); setelah upload, server memverifikasi objek via `HEAD`
- Analytics query ke Neon harus pakai aggregasi DB-side (`COUNT`, `AVG`, `GROUP BY`) — jangan pull semua rows ke JS
- Dashboard kepala sekolah hanya render komponen read-only dari komponen admin yang sama (prop `readOnly`)
- &#91;ASUMSI\] Admin login pakai username/password biasa (bukan NISN), tabel terpisah `admin_users`

**Security Considerations:**

- Role enum: `librarian`, `principal` — stored di JWT claims
- Delete buku: soft-delete dulu (flag `is_deleted`), hard-delete manual oleh admin super setelah konfirmasi
- Upload validation: tipe file (PDF/EPUB only), ukuran maks 50 MB, scan nama file untuk path traversal

---

### F06 — Visitor Analytics (NISN-based)

**Deskripsi:** Sistem logging aktivitas siswa berbasis NISN hash — halaman dikunjungi, waktu di halaman, event (buka buku, klik kategori). Data digunakan untuk analytics dan rekomendasi.

**Acceptance Criteria:**

- **Given** siswa membuka halaman buku **When** event `book_opened` tercatat **Then** data masuk ke `visitor_logs` dalam < 1 detik
- **Given** admin buka laporan **When** filter per tanggal **Then** melihat unique visitors per hari sebagai chart bar

**Technical Constraints:**

- Event tracking via `navigator.sendBeacon()` ke Edge Function — non-blocking, tidak pengaruhi performa halaman
- Batch insert ke Neon — jangan insert per-event (N+1 problem). Buffer 10 event sebelum flush, atau flush setiap 30 detik
- Retensi log: 90 hari, lalu auto-delete via Neon scheduled job (pg\_cron extension di paid tier) atau cron job Netlify

**Security Considerations:**

- `visitor_logs.student_nisn_hash` adalah hash yang sama dengan tabel students — bukan NISN asli
- Anonymous events (pra-login): tidak di-log atau log dengan `null` untuk nisn\_hash

---

### F07 — PWA + Offline Support

**Deskripsi:** Service Worker untuk cache shell aplikasi, metadata buku, dan sebagian konten buku yang sedang dibaca. Siswa dapat lanjut baca saat offline jika buku sudah pernah dibuka.

**Acceptance Criteria:**

- **Given** siswa sudah membuka buku X sebelumnya **When** offline (airplane mode) **Then** dapat membuka kembali buku X dari halaman terakhir
- **Given** siswa offline dan tutup halaman baca **When** kembali online **Then** progres baca yang tersimpan lokal di-sync ke Neon otomatis

**Technical Constraints:**

- Service Worker cache strategy: Cache-First untuk assets statis (JS/CSS/images), Network-First untuk API, Stale-While-Revalidate untuk katalog buku
- PDF caching di IndexedDB via `idb` library — bukan Cache Storage (ukuran lebih fleksibel)
- Hanya cache 1 buku aktif di IndexedDB (ganti buku = cache lama dihapus) — hemat storage device siswa
- Sync progress via Background Sync API (atau fallback polling saat online kembali)

**Security Considerations:**

- File PDF di IndexedDB terenkripsi dengan AES-GCM menggunakan derived key dari PIN siswa (Web Crypto API) — PDF tidak bisa dibuka jika bukan dari device yang sama

---

### F08 — Personalized Recommendation (Collaborative Filtering)

**Deskripsi:** Rekomendasi buku berbasis histori baca siswa lain yang pola bacanya mirip (user-user collaborative filtering sederhana via pgvector). Embedding buku di-generate oleh Hugging Face Inference API (free tier) saat buku diupload.

**Acceptance Criteria:**

- **Given** siswa telah membaca ≥ 3 buku **When** membuka beranda **Then** melihat section "Rekomendasi untuk Kamu" dengan ≥ 3 buku yang belum pernah dibuka
- **Given** siswa baru (0 buku) **When** beranda load **Then** tampilkan buku terpopuler minggu ini sebagai fallback

**Technical Constraints:**

- Embedding model: `all-MiniLM-L6-v2` (dimension 384) via Hugging Face free API — rate limit 30 req/menit
- pgvector query: `SELECT book_id, embedding <=> $1 AS distance FROM book_embeddings ORDER BY distance LIMIT 5` — butuh `ivfflat` index
- Embedding generation dilakukan saat buku diupload (background job), bukan saat request rekomendasi
- &#91;ASUMSI\] Jika Hugging Face API down/rate-limited, fallback ke rekomendasi popularitas sederhana (no embedding needed)

**Security Considerations:**

- Embedding buku tidak mengandung data siswa — hanya text konten buku
- Rekomendasi tidak di-share antar siswa (tiap siswa compute embedding-nya sendiri)

---

### F09 — Rak Buku 3D/2.5D Visual

**(COULD — Phase 2, effort sangat tinggi untuk solo dev)**

**Deskripsi:** Upgrade visual beranda menjadi rak buku bergaya 3D menggunakan React Three Fiber (WebGL, di-lazy-load). Buku "berdiri" di rak, bisa di-hover untuk lihat judul, klik untuk buka.

**Technical Constraints:**

- Implementasi: React Three Fiber, `frameloop="demand"`, geometri prosedural (BoxGeometry, tanpa model .gltf), lazy-load via `next/dynamic` (`ssr: false`) - mengikuti DESIGN 4.2 dan 8.2
- Hanya desktop (>= 1024px), tanpa reduced-motion, bukan mode hemat data, RAM >= 4 GB; selain itu otomatis fallback ke grid/rak 2D
- Render max 20 buku per "rak" untuk performa (lebih banyak = layout shift)
- Fallback ke grid 2D jika `prefers-reduced-motion: reduce` aktif (accessibility)

> &#91;ASUMSI\] Fitur ini bersifat kosmetik murni. Jika timeline terbatas, skip dan pertahankan grid 2D.

---

### F10 — AI Reading Insights + Dropout Pattern Detection

**(COULD — Phase 3)**

**Deskripsi:** Analisis pola pemberhentian membaca (di halaman berapa siswa biasa berhenti, buku mana yang sering di-abandon, siswa mana yang inaktif >14 hari). Dashboard admin menampilkan insight dalam bahasa natural.

**Technical Constraints:**

- Pattern detection: query SQL murni di Neon (no ML) — `AVG(last_page / total_pages)` per buku untuk dropout rate
- "Bahasa natural" insight: template string berbasis threshold, bukan LLM (too expensive di free tier)
- LLM (via OpenAI/Groq free tier) hanya untuk Q&A buku spesifik (RAG), bukan analytics

---

### F11 — DRM / Watermark Protection

**(COULD — Phase 3, hanya jika ada konten berlisensi)**

**Deskripsi:** Watermark dinamis pada setiap halaman PDF yang di-serve, berisi NISN hash + timestamp. Mencegah screenshot sharing tanpa attribution.

**Acceptance Criteria:**

- **Given** siswa membuka buku berlisensi **When** PDF di-render **Then** setiap halaman memiliki watermark semi-transparan berisi kode unik siswa

**Technical Constraints:**

- Watermark di-inject via PDF.js canvas overlay (client-side) — bukan modifikasi PDF asli di server
- Untuk buku BSE (public domain dari Kemendikbud): TIDAK perlu DRM — bebas distribusi
- Untuk buku internal sekolah: watermark cukup sebagai deterrent, bukan proteksi kriptografis penuh

**Security Considerations:**

- Canvas overlay bisa di-bypass oleh user teknis — ini deterrent, bukan DRM enterprise-grade
- Jika sekolah memiliki konten berlisensi komersial: rekomendasikan tidak hosting sendiri, gunakan platform resmi publisher

## 4. Non-Functional Requirements

### 4.1 Performance Targets

| Metrik | Target | Kondisi | Cara Ukur |
| --- | --- | --- | --- |
| Largest Contentful Paint (LCP) | < 2,0 detik | Koneksi 4G, device mid-range | Lighthouse / Web Vitals |
| First Input Delay (FID) | < 100 ms | Mobile Android entry-level | Chrome DevTools |
| Cumulative Layout Shift (CLS) | < 0,1 | Semua halaman | Web Vitals extension |
| Neon query latency (warm) | < 100 ms | Koneksi sudah ada (warm start) | Edge Function timing log |
| Neon query latency (cold) | < 1.500 ms | Setelah auto-suspend (5 menit idle) | Monitor di Neon console |
| R2 file serve (cover buku) | < 500 ms | Cloudflare CDN edge | Network tab |
| Edge Function response (auth) | < 300 ms | Warm | Netlify analytics |
| PDF first page render | < 3 detik | File PDF ≤ 10 MB | Manual test |

**Strategi mitigasi Neon cold start:**

1. Keep-alive ping setiap 4 menit via Netlify scheduled function (Phase 2)
2. Skeleton loader di semua halaman yang hit DB — user tidak melihat halaman kosong
3. Cache query catalog di Netlify Edge Config (TTL 5 menit) untuk request pertama yang tidak butuh data real-time

---

### 4.2 Security Requirements

| Requirement | Implementasi | Prioritas |
| --- | --- | --- |
| NISN tidak pernah plaintext di DB | HMAC-SHA256(NISN, NISN\_PEPPER) di server; pepper hanya di env var | WAJIB |
| PIN hashed server-side | bcrypt cost factor 10 di Route Handler Node (Netlify Function) | WAJIB |
| JWT asymmetric | RS256, private key di env var, public key verify di Edge | WAJIB |
| HTTPS everywhere | Netlify default + R2 pre-signed HTTPS | WAJIB |
| Rate limiting login | 10 req/menit per IP di Edge middleware | WAJIB |
| SQL injection prevention | Parameterized query (pg library), ORM banned untuk query dinamis | WAJIB |
| XSS prevention | httpOnly cookie, CSP header, sanitize input di server | WAJIB |
| CORS | Whitelist hanya origin Netlify deployment | WAJIB |
| R2 access | Buku: bucket privat + pre-signed GET TTL 30 menit; cover: public bucket + cache; upload: pre-signed PUT TTL 10 menit | WAJIB |
| Audit log admin | Semua aksi admin dicatat: upload, delete, login | SHOULD |
| Enkripsi data at-rest | Neon: AES-256 by default. R2: SSE by default | Otomatis |
| PDP (Perlindungan Data Pribadi) | NISN tidak di-share ke third party, log retention 90 hari | WAJIB |

**Catatan PDP (UU No. 27/2022):** NISN siswa termasuk data pribadi anak di bawah umur. Sekolah selaku pengendali data harus:

- Tidak mentransfer NISN ke layanan third-party tanpa consent (implikasi: Hugging Face API hanya menerima teks buku, bukan data siswa)
- Menyediakan mekanisme hapus data siswa jika diminta (soft-delete, purge dalam 30 hari)
- Menyimpan log akses data minimal 2 tahun (tapi hash only, bukan NISN asli)

---

### 4.3 Scalability Constraints & Migration Path

**Free Tier Limits dan Proyeksi:**

| Resource | Free Limit | Proyeksi @ 500 Siswa Aktif | Proyeksi @ 1.000 Siswa Aktif |
| --- | --- | --- | --- |
| Neon storage | 0,5 GB | \~200 MB (metadata only) | \~400 MB |
| Neon compute hours | 10 jam/bulan | \~6 jam (dengan sleep agresif) | \~15 jam ⚠️ MELEBIHI |
| Netlify invocations | 125.000/bulan | \~50.000 | \~100.000 |
| Netlify bandwidth | 100 GB/bulan | \~20 GB | \~40 GB |
| R2 storage | 10 GB | \~5 GB (20 buku × 20 MB avg) | \~8 GB |
| R2 Class A ops | 1 juta/bulan | \~200.000 | \~400.000 |

**Migration path saat free tier tidak cukup:**

1. **Neon → Neon Launch ($19/bulan):** 10 GB storage, 300 compute hours — cukup untuk 2.000+ siswa aktif
2. **Netlify → Netlify Starter ($19/bulan):** 500 GB bandwidth, 300 build menit — unlock jika traffic meningkat
3. **R2:** Berbayar hanya setelah 10 GB ($0.015/GB/bulan) — sangat murah

**Arsitektur scale-ready dari awal:**

- Database query selalu pakai index (tidak ada full-table scan)
- Semua state di DB atau cookie — tidak ada server-side session (stateless Edge)
- Asset statis di CDN (R2 + Netlify CDN) — tidak hit function

---

### 4.4 Accessibility (WCAG 2.1 AA)

| Kriteria | Implementasi |
| --- | --- |
| Kontras warna | Minimal 4.5:1 untuk teks normal, 3:1 untuk teks besar |
| Keyboard navigation | Semua interaksi bisa via keyboard (Tab, Enter, Arrow keys) |
| Screen reader | Semantic HTML (`<main>`, `<nav>`, `<article>`), aria-label pada ikon |
| Font size | Minimum 16px body text, bisa diubah di EPUB reader |
| Focus indicator | Visible focus ring (outline) di semua interactive elements |
| Alt text | Semua cover buku punya `alt="[Judul Buku] - [Pengarang]"` |
| Reduced motion | `@media (prefers-reduced-motion)` — matikan animasi 3D bookshelf |
| Form labels | Semua input field punya `<label>` terikat (`for` attribute) |
| Error messages | Pesan error spesifik, bukan hanya merah — "PIN salah. Sisa percobaan: 3" |

> &#91;ASUMSI\] Target WCAG AA (bukan AAA) karena keterbatasan solo dev. Prioritaskan kriteria yang langsung berdampak ke siswa dengan keterbatasan visual.

## 5. Data Model Overview

### 5.1 Entity Relationship (Deskriptif)

- **students** adalah entitas utama. Setiap siswa diidentifikasi oleh `nisn_hash` (bukan NISN asli). Satu siswa bisa punya banyak `reading_sessions` dan banyak entri `reading_history`.
- **books** adalah koleksi buku. Setiap buku punya satu `category`, satu file di R2 (referensi via `r2_key`), dan opsional satu entri `book_embeddings` untuk fitur rekomendasi.
- **reading\_sessions** menyimpan progres baca aktif — satu record per kombinasi (siswa, buku), di-upsert setiap ada update halaman. Ini bukan log tiap halaman, tapi state terakhir.
- **reading\_history** menyimpan rekap buku yang sudah selesai. Dibuat dari `reading_sessions` ketika progress = 100%.
- **visitor\_logs** mencatat event navigasi dan interaksi. Loosely coupled — tidak ada FK ke `students` untuk memudahkan purge data.
- **admin\_users** terpisah dari `students` — beda tabel, beda auth flow, beda session JWT.

---

### 5.2 Schema Tabel Utama

**Tabel: `students`**

| Kolom | Tipe | Constraint | Keterangan |
| --- | --- | --- | --- |
| nisn\_hash | VARCHAR(64) | PRIMARY KEY | HMAC-SHA256(NISN, NISN\_PEPPER), hex |
| pin\_hash | VARCHAR(60) | NOT NULL | bcrypt hash |
| full\_name | VARCHAR(100) | NOT NULL | Nama siswa |
| grade | SMALLINT | NOT NULL | Kelas: 1–12 |
| class\_name | VARCHAR(10) | NOT NULL | Contoh: "8A", "7B" |
| is\_active | BOOLEAN | DEFAULT true | Soft-disable akun |
| created\_at | TIMESTAMPTZ | DEFAULT NOW() |  |
| first\_login\_at | TIMESTAMPTZ | NULLABLE | Diisi sekali saat login pertama berhasil; dipakai untuk retensi D7/D30 |
| last\_login\_at | TIMESTAMPTZ | NULLABLE | Update saat login |

> NISN asli TIDAK disimpan. Jika sekolah perlu reset PIN siswa, admin mencari siswa via nama + kelas.

**Tabel: `books`**

| Kolom | Tipe | Constraint | Keterangan |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY DEFAULT gen\_random\_uuid() |  |
| title | VARCHAR(255) | NOT NULL |  |
| author | VARCHAR(255) | NOT NULL |  |
| category\_id | UUID | FK → categories.id |  |
| isbn | VARCHAR(20) | NULLABLE |  |
| r2\_key | VARCHAR(500) | NOT NULL UNIQUE | Path file di R2 bucket |
| cover\_r2\_key | VARCHAR(500) | NULLABLE | Path cover image di R2 |
| source\_type | VARCHAR(20) | CHECK IN ('internal','bse','licensed') | Asal konten |
| total\_pages | INTEGER | NOT NULL |  |
| file\_size\_bytes | INTEGER | NOT NULL |  |
| is\_published | BOOLEAN | DEFAULT false | Harus di-publish setelah upload |
| is\_deleted | BOOLEAN | DEFAULT false | Soft-delete |
| search\_vector | TSVECTOR | GENERATED ALWAYS AS (...) STORED | Untuk full-text search |
| created\_at | TIMESTAMPTZ | DEFAULT NOW() |  |
| uploaded\_by | UUID | FK → admin\_users.id |  |

**Tabel: `categories`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| id | UUID PK |  |
| name | VARCHAR(50) | Contoh: "Fiksi", "Sains", "Pelajaran" |
| icon | VARCHAR(50) | Nama ikon (emoji atau icon name) |
| color\_hex | CHAR(7) | Warna untuk UI |
| sort\_order | SMALLINT | Urutan tampilan |

**Tabel: `reading_sessions`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| id | UUID PK |  |
| student\_nisn\_hash | VARCHAR(64) | FK → students.nisn\_hash |
| book\_id | UUID | FK → books.id |
| current\_page | INTEGER | Halaman terakhir |
| progress\_pct | NUMERIC(5,2) | 0.00 – 100.00 |
| total\_read\_minutes | INTEGER | Akumulasi durasi baca |
| started\_at | TIMESTAMPTZ | Kapan pertama dibuka |
| last\_read\_at | TIMESTAMPTZ | Update tiap save progress |
| UNIQUE | (student\_nisn\_hash, book\_id) | Satu record per siswa per buku |

**Tabel: `daily_reading_stats`**

| Kolom | Tipe | Constraint | Keterangan |
| --- | --- | --- | --- |
| id | BIGSERIAL | PRIMARY KEY | |
| student_nisn_hash | VARCHAR(64) | NOT NULL FK -> students.nisn_hash | Hash identitas siswa |
| reading_date | DATE | NOT NULL | Tanggal aktivitas baca (YYYY-MM-DD) |
| read_minutes | INTEGER | DEFAULT 0 NOT NULL | Akumulasi durasi baca hari tersebut |
| books_opened_count | SMALLINT | DEFAULT 1 NOT NULL | Jumlah variasi buku yang dibuka hari ini |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Waktu update terakhir |
| UNIQUE | (student_nisn_hash, reading_date) | | 1 baris per siswa per hari |

**Tabel: `reading_history`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| id | UUID PK |  |
| student\_nisn\_hash | VARCHAR(64) | FK → students.nisn\_hash |
| book\_id | UUID | FK → books.id |
| completed\_at | TIMESTAMPTZ |  |
| total\_read\_minutes | INTEGER | Copy dari reading\_sessions saat selesai |

**Tabel: `book_embeddings`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| book\_id | UUID PK | FK → books.id |
| embedding | VECTOR(384) | pgvector, model MiniLM-L6-v2 |
| model\_version | VARCHAR(50) | Versi model saat generate |
| generated\_at | TIMESTAMPTZ |  |

> Index wajib: `CREATE INDEX ON book_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`

**Tabel: `visitor_logs`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| id | BIGSERIAL PK |  |
| student\_nisn\_hash | VARCHAR(64) | NULLABLE — anonim jika belum login |
| event\_type | VARCHAR(50) | 'book\_opened', 'page\_view', 'search', 'login' |
| target\_id | UUID | NULLABLE — book\_id atau null |
| path | VARCHAR(255) | URL path |
| metadata | JSONB | Data tambahan (search query, page number, dll) |
| created\_at | TIMESTAMPTZ | DEFAULT NOW() |

> Retensi: DELETE FROM visitor\_logs WHERE created\_at < NOW() - INTERVAL '90 days';

**Tabel: `admin_users`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| id | UUID PK |  |
| username | VARCHAR(50) UNIQUE |  |
| password\_hash | VARCHAR(60) | bcrypt |
| role | VARCHAR(20) | 'librarian' atau 'principal' |
| full\_name | VARCHAR(100) |  |
| is\_active | BOOLEAN |  |

---

### 5.3 Index Strategy

```sql
-- Auth & lookup
CREATE INDEX idx_students_last_login ON students(last_login_at);
CREATE INDEX idx_students_first_login ON students(first_login_at);

-- Catalog search
CREATE INDEX idx_books_search ON books USING GIN(search_vector);
CREATE INDEX idx_books_category ON books(category_id) WHERE is_deleted = false AND is_published = true;

-- Reading progress (paling sering di-query)
CREATE UNIQUE INDEX idx_sessions_student_book ON reading_sessions(student_nisn_hash, book_id);
CREATE INDEX idx_sessions_last_read ON reading_sessions(last_read_at DESC);

-- Daily reading stats (untuk query WAR & Streak)
CREATE UNIQUE INDEX idx_daily_stats_student_date ON daily_reading_stats(student_nisn_hash, reading_date);
CREATE INDEX idx_daily_stats_date ON daily_reading_stats(reading_date);

-- Analytics
CREATE INDEX idx_visitor_logs_created ON visitor_logs(created_at);
CREATE INDEX idx_visitor_logs_nisn ON visitor_logs(student_nisn_hash) WHERE student_nisn_hash IS NOT NULL;

-- Rekomendasi
CREATE INDEX ON book_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

### 5.4 Privacy-by-Design: Strategi Hashing NISN & PIN

```
NISN asli (10 digit) -- dikirim via HTTPS ke Route Handler, tidak pernah disimpan / di-log
        |
HMAC-SHA256(NISN, NISN_PEPPER)      <- Web Crypto, dihitung di server
        |
nisn_hash (64 hex: disimpan di DB, JWT claims, logs)

PIN 6 digit --> bcrypt cost 10 (salt acak per baris, bcryptjs) --> pin_hash
```

- **Kenapa HMAC + pepper, bukan SHA-256 + salt:** ruang NISN hanya 10^10. Satu GPU menghitung miliaran SHA-256 per detik, sehingga hash dengan salt statis yang bocor bersama DB bisa di-brute-force seluruhnya dalam menit-jam. Dengan HMAC dan pepper rahasia yang tidak ada di DB, hash tidak bisa diuji tanpa pepper.
- `NISN_PEPPER`: 32 byte acak, hanya di env var Netlify (scope Functions), tidak di DB dan tidak di repo.
- **DB bocor tanpa pepper:** `nisn_hash` tidak bisa dibalik, `pin_hash` adalah bcrypt per baris. **Pepper juga bocor:** NISN masih bisa di-brute-force, maka insiden = rotasi pepper.
- **Rotasi pepper:** skrip sekali jalan menerima CSV roster (NISN, nama, kelas), menghitung hash lama dan baru, lalu `UPDATE students SET nisn_hash = <baru>`. Semua FK ke `students.nisn_hash` wajib dibuat dengan `ON UPDATE CASCADE`. NISN dibuang dari memori setelah skrip selesai.
- **Pendaftaran siswa:** admin mengimpor CSV roster; server menghitung hash dan membuang NISN asli. PIN awal digenerate dan dicetak untuk dibagikan guru.
- **PIN 6 digit hanya 10^6 kemungkinan:** bcrypt saja tidak cukup. Proteksi utama adalah lockout 5x salah (15 menit) dan rate limit 10 req/menit/IP dengan counter di Neon.
- **Trade-off:** Admin tidak bisa cari siswa via NISN - harus via nama + kelas. Ini disengaja (privacy first)
- **Reset PIN:** Admin generate PIN baru, siswa datang fisik ke perpustakaan untuk minta reset (tidak ada self-service reset via NISN - karena kita tidak simpan NISN)

## 6. MVP Scope & Phased Roadmap

> &#91;ASUMSI\] Solo developer dengan kapasitas 20–25 jam/minggu. Stack sudah familiar (Next.js + TypeScript, PostgreSQL). Tidak ada Golang/Rust/Wasm di MVP. Timeline adalah estimasi, bukan commitment.

### Phase 1 — MVP (Must-Have Only)

**Target: Sekolah bisa operasional membaca buku digital**

| Minggu | Deliverable | Fitur |
| --- | --- | --- |
| 1–2 | Infrastruktur & Auth | Setup Neon, R2, Netlify CI/CD. F01: Login NISN-PIN, JWT |
| 3–4 | Schema & Admin Upload | Migrasi DB (semua tabel Phase 1). F05: upload buku ke R2, tambah metadata |
| 5–6 | Catalog & Reader | F02: Halaman beranda grid buku. F03: PDF.js reader dasar |
| 7 | Progress & Riwayat | F03 (progress save). F04: halaman riwayat baca |
| 8 | Admin Dashboard | F05: list siswa, daftar buku, hapus buku, basic analytics |
| 9 | Polish & Security | Rate limiting, CSP headers, error handling, loading states |
| 10 | Testing & Deploy | UAT dengan 1–2 guru. Bug fix. Soft launch ke 1 kelas pilot |

**MVP Duration: 10 minggu (\~2,5 bulan)**

**MVP Go/No-Go Checklist:**

- [ ] Siswa bisa login dengan NISN + PIN
- [ ] Siswa bisa buka dan baca PDF dari halaman terakhir
- [ ] Admin bisa upload buku baru dalam < 10 menit
- [ ] Progress baca tersimpan saat tab ditutup
- [ ] Tidak ada query ke Neon yang > 2 detik pada warm connection
- [ ] NISN tidak muncul di log manapun

---

### Phase 2 — Engagement

**Target: Siswa kembali lagi, bukan hanya sekali pakai**

| Minggu | Deliverable | Fitur |
| --- | --- | --- |
| 11–12 | PWA + Offline | F07: Service Worker, cache PDF di IndexedDB, offline reading |
| 13–14 | Analytics Dashboard | F06: Visitor analytics per siswa, per kelas, chart tren |
| 15–16 | Embedding Pipeline | F08 prep: Script bulk generate embedding untuk buku existing via HuggingFace API |
| 17–18 | Rekomendasi | F08: Halaman rekomendasi berbasis collaborative filtering + pgvector |
| 19–20 | 3D Bookshelf (optional) | F09: Rak 3D React Three Fiber (lazy-load, fallback 2D) - skip jika timeline ketat |
| 21 | Gamification ringan | Streak membaca harian, badge "Buku Selesai" — COULD di Phase 2 |

**Phase 2 Duration: 10–11 minggu**

---

### Phase 3 — AI Advanced

**Target: Platform menghasilkan insight bermakna untuk guru dan kepala sekolah**

| Minggu | Deliverable | Fitur |
| --- | --- | --- |
| 22–24 | Dropout Pattern Detection | F10: Query analitik SQL untuk dropout rate per buku |
| 25–26 | Natural Language Insight | F10: Template insight berbasis threshold ("20 siswa kelas 8 belum buka buku wajib") |
| 27–29 | RAG Q&A Buku | F10: Siswa bisa tanya konten buku via chat (Groq free tier LLM + pgvector) |
| 30–32 | DRM / Watermark | F11: Canvas watermark untuk buku berlisensi |

**Phase 3 Duration: 10–12 minggu**

---

### Timeline Visual

| Bulan | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Phase 1 MVP** | ████ | ████ | ██── |  |  |  |  |  |
| **Phase 2 Engagement** |  |  | ──██ | ████ | ███─ |  |  |  |
| **Phase 3 AI** |  |  |  |  | ───█ | ████ | ████ | ──── |

---

### Dependencies Kritis

1. **Phase 2 → 3** tidak bisa paralel: embedding buku (Phase 2) adalah prasyarat RAG Q&A (Phase 3)
2. **F07 (PWA)** bisa dikerjakan paralel dengan F06 (analytics) di Phase 2
3. **F11 (DRM)** hanya relevan jika sekolah punya konten berlisensi — bisa di-skip jika semua konten BSE/internal
4. **Neon compute hours**: Monitor ketat di bulan pertama. Jika mendekati 10 jam/bulan, aktifkan sleep mode lebih agresif atau upgrade.

## 7. Risks & Mitigations

| # | Risiko | Probabilitas | Dampak | Mitigasi |
| --- | --- | --- | --- | --- |
| R01 | Bundle JS client / Edge terlalu besar - LCP lambat | Menengah | Tinggi | Tanpa Rust/Wasm di MVP. Edge middleware hanya JWT verify + header via Web Crypto. Bundle `three` hanya via `next/dynamic` pada desktop. Budget: First Load JS halaman utama < 200 KB gzip, dicek tiap deploy via `next build`. |
| R02 | Neon cold start > 2 detik → user churn | Tinggi | Tinggi | Keep-alive ping tiap 4 menit (Phase 2). Skeleton loader untuk semua halaman yang hit DB. Edge Config cache untuk data statis. |
| R03 | Neon free compute (10 jam/bulan) habis | Menengah | Tinggi | Monitor via Neon console + alert. Query harus O(1) atau O(log n). Jika mendekati limit, agresifkan caching. Fallback: upgrade ke $19/bulan. |
| R04 | NISN data breach via DB leak | Rendah | Sangat Tinggi | NISN tidak pernah disimpan plaintext. HMAC-SHA256 + NISN\_PEPPER (env var, di luar DB). Audit log semua query sensitif. Neon: enable IP allowlist (Netlify IP). |
| R05 | Hugging Face API rate-limited atau down → embedding gagal | Tinggi | Menengah | Fallback ke rekomendasi popularitas sederhana. Queue embedding generation dengan retry. Simpan model MiniLM-L6-v2 kecil (22 MB) di R2 sebagai backup Wasm inference. |
| R06 | Kuota R2 (Class A tulis / Class B baca) terlampaui | Rendah | Menengah | Cover via public bucket + cache CDN 30 hari (tidak lewat Function). Buku: pre-signed GET TTL 30 menit, URL diperbarui hanya pada 80% TTL (bukan per halaman). Upload hanya oleh admin (Class A jarang). Pembacaan = Class B (limit 10 juta/bulan). |
| R07 | Konten BSE Kemendikbud melanggar lisensi distribusi | Rendah | Tinggi | BSE (Buku Sekolah Elektronik) secara resmi dapat diunduh dan didistribusikan gratis sesuai lisensi Kemendikbud. Simpan bukti lisensi di README repo. Jangan upload buku komersial tanpa izin. |
| R08 | PDF.js tidak bisa render EPUB → user bingung | Menengah | Menengah | Gunakan library terpisah: PDF.js untuk PDF, epub.js untuk EPUB. Deteksi tipe file dari ekstensi + MIME type. Tampilkan pesan error yang jelas jika format tidak didukung. |
| R09 | Solo developer burnout / timeline meleset | Tinggi | Tinggi | Phase 1 MVP didesain ketat hanya 5 fitur MUST. Hentikan scope creep: semua permintaan fitur baru masuk backlog setelah MVP live. Buffer 2 minggu di setiap phase untuk bug fix. |
| R10 | Netlify 125k function invocations habis | Menengah | Menengah | Cache agresif di Netlify Edge Config. Static generation (SSG) untuk halaman catalog. API hanya dipanggil saat data berubah, bukan setiap render. |
| R11 | AI cost (Phase 3 LLM) melebihi free tier | Menengah | Menengah | Gunakan Groq free tier (llama-3.1-8b-instant, 14.400 req/hari). Rate limit 5 pertanyaan/siswa/hari. Tidak ada streaming response (lebih hemat token). |
| R12 | Offline PDF cache memenuhi storage HP siswa | Rendah | Menengah | Cache maksimal 1 buku aktif (avg 20 MB). Tampilkan ukuran file sebelum cache. Auto-delete cache buku lama saat ganti buku baru. |

---

### Risiko Prioritas Tinggi — Rencana Konkret

**R01 - Bundle Size (Client & Edge)**

```
Target: First Load JS halaman /library < 200 KB (gzip); Edge middleware < 50 KB
Aksi:
1. Tanpa Rust/Wasm di MVP; JWT verify dan HMAC NISN memakai Web Crypto bawaan runtime
2. Bundle 3D (three + R3F) hanya via next/dynamic (ssr: false) pada desktop
3. Code-split per route (App Router); PDF.js / epub.js di-lazy-load hanya di /read
Ukur: output `next build` (First Load JS per route) dicek di setiap deploy
```

**R04 - NISN Data Breach**

```
Layered defense:
Layer 1: NISN dikirim via HTTPS ke Route Handler, di-hash HMAC dengan pepper, lalu dibuang;
         tidak pernah ke DB, log, atau JWT. Hash di client TIDAK dipilih: hash itu akan
         menjadi pengganti NISN (bisa di-replay) dan pepper tidak bisa dirahasiakan.
Layer 2: Neon: user role least-privilege + IP allowlist jika tersedia di plan
Layer 3: Audit log akses admin ke data siswa (audit_log)
Layer 4: Enkripsi kolom sensitif (full_name) dengan pgcrypto (Phase 2)
Incident response:
  - Pepper bocor  -> rotasi pepper + skrip migrasi (lihat 5.4); NISN asli tidak pernah terekspos
  - DB bocor tanpa pepper -> hash tidak bisa dibalik; wajib reset PIN seluruh siswa
```

**R09 — Solo Developer Burnout**

```
Aturan kerja:
- Tidak ada feature baru masuk sprint aktif setelah minggu 2
- Code review diri sendiri dengan checklist minimal (lint + type check + 1 happy path test)
- Deploy ke production hanya Jumat — tidak ada hotfix tengah malam kecuali security
- Gunakan template / starter kit: Next.js App Router + Neon serverless driver sudah ada contoh resmi
```

## 8. Success Metrics (KPIs)

### North Star Metric

**Weekly Active Readers (WAR)** — Jumlah siswa unik yang membaca ≥ 1 buku minimal 10 menit dalam 7 hari terakhir.

> Mengapa ini North Star? WAR mencerminkan nilai inti platform: siswa yang benar-benar membaca, bukan sekadar login. Semua fitur (rekomendasi, offline, 3D bookshelf) harus dapat diargumentasikan bagaimana mereka meningkatkan WAR.

---

### Leading Indicators (Prediksi WAR ke depan)

| Metrik | Definisi | Target Phase 1 | Target Phase 2 |
| --- | --- | --- | --- |
| Daily Login Rate | % siswa yang login hari ini / total siswa aktif | > 15% | > 30% |
| Books Opened / User / Week | Rata-rata buku yang dibuka per siswa per minggu | > 1,5 | > 2,5 |
| Session Duration (avg) | Rata-rata durasi satu sesi baca (menit) | > 12 menit | > 20 menit |
| New Books Added / Month | Buku baru yang diupload admin | ≥ 4 buku/bulan | ≥ 8 buku/bulan |
| Recommendation CTR | % klik rekomendasi / total rekomendasi ditampilkan | — (N/A Phase 1) | > 20% |

---

### Lagging Indicators (Hasil yang terukur)

| Metrik | Definisi | Target 3 Bulan Post-MVP | Target 6 Bulan |
| --- | --- | --- | --- |
| WAR (North Star) | Siswa unik yang baca ≥ 10 mnt/minggu | > 20% dari total siswa | > 40% |
| Books Completed / Month | Buku selesai dibaca bulan ini | > 50 | > 150 |
| D7 Retention | % siswa yang kembali login di minggu 2 setelah pertama login | > 40% | > 60% |
| D30 Retention | % siswa aktif 30 hari setelah pertama login | > 20% | > 35% |
| Time-to-First-Read | Waktu antara pertama login → pertama baca buku (menit) | < 5 menit | < 3 menit |
| Dropout Rate per Book | % pembaca yang berhenti sebelum 30% buku | Baseline ukur | < 40% |

---

### Instrumentation Plan — Apa yang Ditrack dari Hari 1

**Events wajib sejak MVP launch:**

| Event | Trigger | Data yang Dicatat |
| --- | --- | --- |
| `user.login` | Login berhasil | nisn\_hash, timestamp, user\_agent |
| `user.login_failed` | PIN salah | timestamp, attempt\_count, ip\_hash |
| `book.opened` | Siswa klik buku | nisn\_hash, book\_id, timestamp, source (catalog/recommendation/search) |
| `reading.progress` | Setiap 5 halaman | nisn\_hash, book\_id, current\_page, duration\_since\_open |
| `book.completed` | Progress = 100% | nisn\_hash, book\_id, total\_duration\_minutes |
| `book.abandoned` | Tab ditutup, progress < 100% | nisn\_hash, book\_id, last\_page, pct\_read |
| `search.performed` | Siswa submit search | nisn\_hash, query\_length (bukan teks query!), result\_count |
| `admin.book_uploaded` | Admin upload berhasil | admin\_id, book\_id, file\_size, source\_type |

> Privacy note: Query teks pencarian TIDAK di-log (bisa mengandung kata sensitif). Hanya panjang query dan jumlah hasil.

**Dashboard metrics yang diquery dari events di atas (SQL murni):**

```sql
-- WAR (Weekly Active Readers): Siswa unik yang total membaca >= 10 menit dalam 7 hari terakhir
-- Menggunakan daily_reading_stats agar akurat per jendela waktu 7 hari (bukan total kumulatif seumur hidup)
SELECT COUNT(student_nisn_hash) AS war
FROM (
  SELECT student_nisn_hash, SUM(read_minutes) AS weekly_minutes
  FROM daily_reading_stats
  WHERE reading_date >= CURRENT_DATE - INTERVAL '6 days'
  GROUP BY student_nisn_hash
  HAVING SUM(read_minutes) >= 10
) active_readers;

-- D7 Retention: cohort = siswa login pertama 7-14 hari lalu;
-- retained = masih membaca >= 7 hari setelah login pertama (butuh kolom students.first_login_at)
SELECT
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM reading_sessions r
    WHERE r.student_nisn_hash = s.nisn_hash
      AND r.last_read_at >= s.first_login_at + INTERVAL '7 days'
  ))::FLOAT / NULLIF(COUNT(*), 0) AS d7_retention
FROM students s
WHERE s.first_login_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days';

-- Books dengan dropout rate tertinggi
SELECT b.title, AVG(rs.progress_pct) AS avg_completion
FROM reading_sessions rs
JOIN books b ON b.id = rs.book_id
GROUP BY b.id, b.title
HAVING COUNT(rs.student_nisn_hash) >= 5
ORDER BY avg_completion ASC
LIMIT 10;
```

---

### Review Cadence

| Periode | Siapa | Metrik yang Dilihat |
| --- | --- | --- |
| Mingguan | Developer | WAR, error rate, Neon compute hours |
| Bulanan | Admin + Developer | D7/D30 retention, books completed, top 10 buku |
| Per Fase | Kepala Sekolah | WAR trend, comparison antar kelas, buku wajib completion rate |

---

### Definisi Sukses per Phase

| Phase | Sukses jika... |
| --- | --- |
| MVP (bulan 2–3) | WAR > 20% siswa, 0 data breach, admin bisa upload buku mandiri tanpa bantuan developer |
| Phase 2 (bulan 4–6) | D7 retention > 40%, offline reading dipakai ≥ 10% sesi, rekomendasi CTR > 20% |
| Phase 3 (bulan 7+) | Kepala sekolah menggunakan laporan AI untuk presentasi ke dinas tanpa meminta laporan manual ke admin |
