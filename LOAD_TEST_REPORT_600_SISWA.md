# Laporan Pengujian Beban (Load Test Report) — 600 Siswa Simultan
**Proyek:** PustakaKita — Perpustakaan Digital Siswa Nusantara  
**Tanggal Pengujian:** 6 November 2026  
**Mode Server:** Production Build (`next build` & `next start`)  
**Target Pengujian:** `http://localhost:3000`  
**Skala Beban:** **600 Concurrent Virtual Users (Siswa Aktif Bersamaan)**  

---

## 1. Ringkasan Eksekutif (*Executive Summary*)

Pengujian beban skala penuh telah dilakukan untuk mensimulasikan kondisi puncak (*peak traffic*) satu sekolah penuh di mana **600 siswa** mengakses aplikasi perpustakaan digital secara serentak (membuka beranda, menjelajahi katalog, memfilter kategori, mencari buku, serta melakukan otentikasi NISN).

Seluruh target **Service Level Agreement (SLA)** terpenuhi dengan hasil **100% tingkat keberhasilan (0% kegagalan)** dan kecepatan throughput mencapai **500,82 request/detik**.

| Metrik Utama | Hasil Aktual | Target SLA PRD | Status |
| :--- | :--- | :--- | :--- |
| **Jumlah Pengguna Simultan (VUs)** | **600 Siswa** | $\ge 480$ Siswa (1 Sekolah) | **LULUS** |
| **Total Requests Diproses** | **15.816 Requests** | - | **LULUS** |
| **Durasi Pengujian Aktual** | **31,6 Detik** | 30 Detik + Graceful Stop | **LULUS** |
| **Throughput Rata-rata (RPS)** | **500,82 req/detik** | $\ge 100$ req/detik | **LULUS** |
| **Tingkat Keberhasilan (*Success Rate*)** | **100,00% (15.816/15.816)** | $> 99,0\%$ | **LULUS** |
| **Tingkat Kegagalan (*Error Rate*)** | **0,00% (0 Error)** | $< 1,0\%$ | **LULUS** |
| **Waktu Respon Median ($p50$)** | **33,58 ms** | $< 100$ ms | **LULUS** |
| **Waktu Respon Rata-rata (*Avg*)** | **61,22 ms** | $< 250$ ms | **LULUS** |
| **Persentil ke-90 ($p90$)** | **83,78 ms** | $< 350$ ms | **LULUS** |
| **Persentil ke-95 ($p95$)** | **259,88 ms** | $< 500$ ms | **LULUS** |
| **Persentil ke-99 ($p99$)** | **643,17 ms** | $< 1.200$ ms | **LULUS** |

---

## 2. Distribusi Latensi Keseluruhan

Berikut adalah profil distribusi waktu respon server dari total **15.816 transaksi HTTP** selama beban 600 pengguna simultan:

* **Minimum (`Min`):** `0,93 ms`
* **Median (`p50`):** `33,58 ms` *(50% dari seluruh aktivitas siswa direspon di bawah 34 milidetik)*
* **Rata-rata (`Avg`):** `61,22 ms`
* **Persentil 90% (`p90`):** `83,78 ms` *(90% dari seluruh aktivitas siswa direspon di bawah 84 milidetik)*
* **Persentil 95% (`p95`):** `259,88 ms` *(Jauh di bawah batas maksimum SLA 500 ms)*
* **Persentil 99% (`p99`):** `643,17 ms` *(Jauh di bawah batas maksimum SLA 1.200 ms)*
* **Maksimum (`Max`):** `1.328,90 ms` *(Hanya terjadi saat koneksi awal database pool warming)*

---

## 3. Rincian Performa Per Endpoint & Rute

Pengujian mendistribusikan beban ke 6 skenario utama sesuai proporsi trafik harian siswa di sekolah:

| Endpoint / Skenario Aktivitas Siswa | Bobot Trafik | Total Request | Sukses | Rata-rata (`Avg`) | Median (`p50`) | `p90` | `p95` | Status SLA |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Halaman Beranda (`GET /`)** | 25% | 3.974 | 100% | 25,02 ms | **8,28 ms** | 34,04 ms | 154,04 ms | **LULUS** |
| **2. Halaman Katalog (`GET /library`)** | 25% | 3.949 | 100% | 23,44 ms | **6,87 ms** | 35,28 ms | 159,03 ms | **LULUS** |
| **3. API Katalog Buku (`GET /api/books`)** | 20% | 3.124 | 100% | 114,32 ms | **69,20 ms** | 117,76 ms | 472,20 ms | **LULUS** |
| **4. API Kategori (`GET /api/categories`)** | 10% | 1.583 | 100% | 67,98 ms | **36,20 ms** | 61,21 ms | 267,95 ms | **LULUS** |
| **5. API Pencarian (`GET /api/books?q=sains`)** | 10% | 1.588 | 100% | 118,71 ms | **69,58 ms** | 146,04 ms | 496,64 ms | **LULUS** |
| **6. API Login Siswa (`POST /api/auth/login`)** | 10% | 1.598 | 100% | 76,97 ms | **36,29 ms** | 89,08 ms | 386,87 ms | **LULUS** |

---

## 4. Analisis Teknis & Temuan Utama

1. **Kecepatan Halaman Statis & SSR (`/` dan `/library`):**
   * Karena halaman Beranda dan Katalog telah dioptimalkan melalui *Static Generation* & *Code Splitting* (First Load JS ~161–163 KB), server mampu melayani hampir **8.000 request halaman** dalam 30 detik dengan median waktu respon **6–8 ms**.
2. **Ketahanan Kueri Database Neon PostgreSQL (`/api/books` & `/api/categories`):**
   * Pada beban 600 siswa secara bersamaan, endpoint yang berinteraksi langsung dengan database PostgreSQL mempertahankan median waktu respon di **36 ms hingga 69 ms**, serta persentil `p95` tetap terjaga di bawah ambang batas **500 ms** (`472,20 ms` untuk katalog penuh dan `496,64 ms` untuk kueri pencarian teks).
3. **Kinerja Kriptografi Otentikasi Siswa (`POST /api/auth/login`):**
   * Endpoint login yang menjalankan *HMAC-SHA256 NISN Hashing* berhasil memproses **1.598 percobaan autentikasi** dengan rata-rata waktu respon **76,97 ms** dan median **36,29 ms** tanpa antrean yang memblokir *event loop* utama.
4. **Stabilitas Memori & Koneksi (Zero Dropped Connections):**
   * Dari **15.816 request**, tercatat **0 koneksi putus (*socket hang up*)** dan **0 HTTP 5xx Server Error**.

---

## 5. Cara Menjalankan Ulang Pengujian

Pengujian dapat dijalankan ulang kapan saja menggunakan skrip bawaan proyek ([`scripts/load-test-100-users.ts`](./scripts/load-test-100-users.ts)):

```powershell
# 1. Jalankan server production di terminal pertama
pnpm run build
pnpm run start

# 2. Jalankan pengujian 600 siswa simultan di terminal kedua
pnpm run test:load
```

---

## 6. Kesimpulan Kesiapan Produksi (*Production Readiness*)

Berdasarkan hasil uji beban terhadap **600 siswa simultan**, arsitektur aplikasi **PustakaKita** dinyatakan **Sangat Siap (*Production-Ready*)** untuk dipublikasikan dan digunakan secara serentak oleh seluruh siswa dari jenjang SD, SMP, maupun SMA tanpa kendala penurunan performa.

