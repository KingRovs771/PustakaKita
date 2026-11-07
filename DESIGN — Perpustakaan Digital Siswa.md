# Design System & UX Specification: Perpustakaan Digital Siswa (PustakaKita)

**Versi Dokumen:** 1.0.0  
**Target Stack:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui, React Three Fiber (R3F), Netlify (`@netlify/plugin-nextjs`: SSG/ISR + Route Handlers)  
**Target Pengguna:** Siswa SD, SMP, SMA di Indonesia (Usia 7–18 Tahun) & Guru/Admin Perpustakaan  

---

## 1. DESIGN PRINCIPLES & UI COPY GUIDELINES

### 1.1 Empat Prinsip Desain Utama

1. **Reading-First & Distraction-Free (Fokus Baca Tanpa Gangguan)**
   - **Filosofi:** Elemen antarmuka (UI) harus menghilang saat siswa mulai membaca. Penggunaan ruang kosong (*whitespace*), kontras yang lembut di mata (bukan hitam pekat di atas putih menyilaukan), serta tipografi yang dirancang untuk durasi baca panjang adalah prioritas absolut di atas estetika dekoratif.
2. **Progressive Enhancement & Low-Bandwidth Friendly (Adaptif terhadap Perangkat & Jaringan)**
   - **Filosofi:** Mengingat kesenjangan perangkat di Indonesia (mulai dari HP Android *entry-level* RAM 2GB di daerah 3T hingga laptop *gaming* di kota besar), pengalaman 3D menggunakan React Three Fiber (R3F) diposisikan sebagai *delightful enhancement*, bukan keharusan. Jika *frame rate* (FPS) drop di bawah 30fps, WebGL tidak didukung, atau mode hemat data aktif (`Save-Data` header), sistem secara otomatis me-render *Bookshelf 2D CSS Grid* tanpa mengorbankan fungsionalitas.
3. **Age-Adaptive Neutrality (Netralitas Lintas Usia SD–SMA)**
   - **Filosofi:** Desain tidak boleh terlalu kekanak-kanakan (membuat siswa SMA merasa canggung/malu) namun tidak boleh terlalu kaku/korporat (membuat siswa SD merasa bosan atau terintimidasi). Solusinya adalah pendekatan **"Warm Modern Neo-Brutalism Lite"**: sudut membulat yang ramah (`rounded-xl`), warna dasar hangat seperti kertas buku, ikonografi jelas dengan *stroke* tebal ($2\text{px}$), dan pemisahan visual berbasis jenjang saat *login*.
4. **Solo-Dev Maintainability (Kemudahan Pemeliharaan Developer Tunggal)**
   - **Filosofi:** Hindari *custom CSS* yang rumit. Semua komponen dibangun di atas primitif `shadcn/ui` (Radix UI) dan utilitas standar Tailwind CSS. Animasi 3D menggunakan geometri prosedural sederhana (*BoxGeometry* dengan tekstur sampul yang dikompresi WebP) alih-alih memuat model `.gltf` berukuran besar.

### 1.2 Tone & Voice Guidelines (Panduan Bahasa Antarmuka)

* **Sapaan & Sudut Pandang:** Gunakan kata ganti **"Kamu"** (akrab, setara, tidak menggurui). Hindari kata "Anda" (terlalu formal untuk anak SD/SMP) atau "Adik-adik" (merendahkan siswa SMA).
* **Nada Bicara (Tone):** Suportif, antusias tapi tenang, jelas, dan bebas dari jargon teknis.
* **Aturan Penulisan Copy (Microcopy Rules):**
  * **Error State:** Jangan pernah menyalahkan pengguna dan selalu berikan solusi instan.
    * *Buruk:* `Error 404: Invalid NISN Input.` atau `NISN yang Anda masukkan salah.`
    * *Baik:* `Hmm, NISN ini belum terdaftar. Coba periksa kembali 10 angka NISN kamu, atau tanyakan pada guru perpustakaan ya!`
  * **Empty State:** Jadikan momen edukatif atau ajakan bertindak yang ramah.
    * *Buruk:* `Tidak ada data buku.`
    * *Baik:* `Rak bacamu masih kosong nih. Yuk, jelajahi rak utama dan pilih buku pertamamu hari ini!`
  * **Loading State:** Berikan konteks apa yang sedang terjadi.
    * *Buruk:* `Loading...`
    * *Baik:* `Sedang menyiapkan rak bukumu...` atau `Membuka halaman terakhir yang kamu baca...`
  * **Gamifikasi & Progress:** Berikan apresiasi tanpa memberikan tekanan berlebih.
    * *Baik:* `Keren! Kamu sudah menyelesaikan 3 bab minggu ini. Sedikit lagi selesai!`

---

## 2. COLOR SYSTEM

Sistem warna dirancang menggunakan variabel CSS HSL (kompatibel penuh dengan arsitektur `shadcn/ui`) namun didokumentasikan di sini dengan nilai HEX untuk kepastian visual dan perhitungan rasio kontras WCAG 2.1 Level AA.

### 2.1 Core Palette (Light Mode & Proper Dark Mode)

**Catatan Penting Dark Mode:** Jangan gunakan hitam murni (`#000000`) sebagai latar belakang karena menyebabkan efek *halation* (teks terlihat berbayang/kabur bagi penderita astigmatisme) dan kelelahan mata. Gunakan *Rich Dark Slate* (`#0F172A`) untuk UI umum, dan *Warm Dark Espresso* (`#181512`) atau *Sepia* saat di dalam mode baca.

| Token / Peran | Variabel Tailwind | Light Mode (HEX) | Deskripsi Visual (Light) | Dark Mode (HEX) | Deskripsi Visual (Dark) | Rasio Kontras (Teks vs Bg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Background Primary** | `bg-background` | `#FAF8F5` | Putih tulang / kertas hangat (*Warm Alabaster*), tidak menyilaukan mata. | `#0F172A` | Biru malam sangat gelap (*Slate 900*). | - |
| **Background Surface / Card** | `bg-card` | `#FFFFFF` | Putih bersih untuk mengangkat kartu buku dari latar. | `#1E293B` | Abu-biru gelap (*Slate 800*) untuk elevasi permukaan. | - |
| **Text Primary** | `text-foreground` | `#1E293B` | Abu arang sangat gelap (*Slate 800*), lebih lembut dari hitam pekat. | `#F8FAFC` | Putih salju lembut (*Slate 50*). | **13.8 : 1** (Light) / **14.6 : 1** (Dark) — *AAA* |
| **Text Muted / Secondary** | `text-muted-foreground` | `#475569` | Abu tua (*Slate 600*) untuk nama penulis & metadata. | `#94A3B8` | Abu perak (*Slate 400*). | **7.2 : 1** (Light) / **6.8 : 1** (Dark) — *AA* |
| **Primary Brand** | `bg-primary` | `#0F766E` | *Deep Teal* (`Teal 700`). Memberikan kesan cerdas, tenang, dan fokus. | `#2DD4BF` | *Vibrant Mint Teal* (`Teal 400`). Menyala lembut di latar gelap. | **5.4 : 1** (vs `#FFF`) / **10.2 : 1** (vs `#0F172A`) — *AA* |
| **Primary Foreground** | `text-primary-foreground` | `#FFFFFF` | Teks putih di atas tombol utama *Light Mode*. | `#042F2E` | Teks hijau sangat gelap (`Teal 950`) di atas tombol *Dark Mode*. | **5.4 : 1** / **11.1 : 1** — *AA* |
| **Secondary Brand** | `bg-secondary` | `#F1ECE1` | Krem pasir hangat (*Warm Sand*) untuk *chip* filter & tombol sekunder. | `#334155` | *Slate 700* untuk elemen sekunder. | **11.5 : 1** / **8.9 : 1** — *AAA* |
| **Accent / Gamification** | `bg-accent` | `#D97706` | *Warm Amber* (`Amber 600`) untuk *progress bar*, bintang, & lencana. | `#FBBF24` | *Golden Amber* (`Amber 400`). | **4.6 : 1** (vs `#FFF`) / **11.8 : 1** (vs `#0F172A`) — *AA* |
| **Border & Divider** | `border-border` | `#E2E8F0` | Garis pemisah tipis (`Slate 200`). | `#334155` | Garis pemisah *Dark Mode* (`Slate 700`). | - |

### 2.2 Semantic Colors (Status & Umpan Balik)

| Status | Penggunaan | Light Mode (Bg / Text / Border) | Dark Mode (Bg / Text / Border) | Kontras Teks |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | Buku selesai dibaca, berhasil pinjam/simpan. | Bg: `#DCFCE7` / Text: `#166534` / Border: `#86EFAC` | Bg: `#052E16` / Text: `#86EFAC` / Border: `#166534` | $> 7.0 : 1$ (AAA) |
| **Warning** | Batas waktu baca hampir habis, koneksi lambat (3D mati). | Bg: `#FEF3C7` / Text: `#92400E` / Border: `#FDE68A` | Bg: `#451A03` / Text: `#FDE68A` / Border: `#92400E` | $> 7.5 : 1$ (AAA) |
| **Error / Destructive** | NISN tidak ditemukan, gagal memuat halaman buku. | Bg: `#FEE2E2` / Text: `#991B1B` / Border: `#FCA5A5` | Bg: `#450A0A` / Text: `#FCA5A5` / Border: `#991B1B` | $> 7.2 : 1$ (AAA) |
| **Info** | Pengumuman sekolah, rekomendasi buku baru. | Bg: `#E0F2FE` / Text: `#075985` / Border: `#7DD3FC` | Bg: `#082F49` / Text: `#7DD3FC` / Border: `#075985` | $> 7.4 : 1$ (AAA) |

### 2.3 Khusus Mode Baca (Reader Surface Themes)
Saat berada di dalam *Reading Interface*, pengguna memiliki 3 pilihan tema latar kertas:
1. **Siang (Daylight Paper):** Bg `#FAF8F5`, Teks `#1E293B` (Kontras $13.8:1$)
2. **Senja (Sepia Comfort):** Bg `#F4ECD8`, Teks `#3E2723` (Cokelat tua di atas kertas kuning tua, mengurangi *blue light*, Kontras $10.4:1$)
3. **Malam (Night Owl):** Bg `#12161F`, Teks `#CBD5E1` (Abu terang lembut di atas biru-hitam pekat, tidak memancarkan cahaya berlebih di kamar gelap, Kontras $10.1:1$)

### 2.4 Color Usage Rules per Kategori Buku & Jenjang
Untuk membantu pemindaian visual (*visual scanning*) di rak 2D maupun 3D (warna punggung buku/*book spine*), setiap kategori memiliki kode warna dan ikon pendamping (agar tetap aksesibel bagi siswa buta warna):

| Kategori / Jenjang | Warna Aksen (Light / Dark) | Class Tailwind | Ikon Pendamping (Lucide) | Aturan Penggunaan Visual |
| :--- | :--- | :--- | :--- | :--- |
| **Fiksi & Sastra** | `#7C3AED` / `#A78BFA` (Ungu) | `border-violet-600 text-violet-700 bg-violet-50` | `Sparkles` | Digunakan pada *badge* kategori, pita penanda buku, dan warna dasar *spine* 3D jika sampul belum termuat. |
| **Sains & Teknologi (STEM)** | `#0284C7` / `#38BDF8` (Biru Langit) | `border-sky-600 text-sky-700 bg-sky-50` | `Atom` | Memberikan kesan logis dan eksploratif. |
| **Sejarah & Sosial** | `#B45309` / `#FBBF24` (Terakota/Emas) | `border-amber-700 text-amber-800 bg-amber-50` | `Compass` | Kesan klasik, arsip, dan kebudayaan Nusantara. |
| **Komik & Bergambar** | `#E11D48` / `#FB7185` (Merah Muda/Rose) | `border-rose-600 text-rose-700 bg-rose-50` | `Smile` | Menarik perhatian siswa SD dan pembaca visual. |
| **Badge Jenjang SD** | `#DC2626` (Merah Putih SD) | `bg-red-100 text-red-800 border-red-300` | Bentuk: Lingkaran (`rounded-full`) | Mengikuti asosiasi warna seragam sekolah di Indonesia. |
| **Badge Jenjang SMP** | `#1D4ED8` (Biru Dongker SMP) | `bg-blue-100 text-blue-800 border-blue-300` | Bentuk: Kapsul (`rounded-md`) | Memudahkan filter otomatis saat siswa *login*. |
| **Badge Jenjang SMA** | `#475569` (Abu-abu SMA) | `bg-slate-200 text-slate-800 border-slate-400` | Bentuk: Persegi Tumpul (`rounded-sm`) | Bentuk geometri berbeda membantu identifikasi tanpa bergantung pada warna saja. |

---

## 3. TYPOGRAPHY SCALE

Pemilihan *font* menggunakan `next/font/google` dengan strategi *subsetting* `latin` dan `display: swap` agar tidak menghambat *First Contentful Paint (FCP)* di Netlify.

### 3.1 Font Pairing Recommendation

1. **Heading & Display (`--font-heading`):** **Plus Jakarta Sans** (Weights: `600 SemiBold`, `700 Bold`, `800 ExtraBold`)
   * *Alasan:* Karya desainer tipografi Indonesia, memiliki geometri modern yang hangat, keterbacaan angka yang sangat jelas, dan memberi karakter ramah namun tetap dewasa untuk siswa SMA.
2. **UI & Body Short-Form (`--font-sans`):** **Plus Jakarta Sans** (Weights: `400 Regular`, `500 Medium`)
   * *Alasan:* Menggunakan satu keluarga *font* yang sama untuk Heading dan UI menghemat *network payload* sekitar $40\text{KB}$ dibanding memuat dua *font sans-serif* berbeda. Bentuk huruf `a`, `g`, dan `l` sangat jelas untuk anak SD yang baru lancar membaca.
3. **Long-Form Book Reading (`--font-serif`):** **Literata** (Variable Font, Weights: `400`–`700`, dilengkapi Italic)
   * *Alasan:* Dirancang khusus oleh TypeTogether untuk Google Play Books. Memiliki *x-height* yang tinggi, *aperture* terbuka, dan tetap tajam pada layar beresolusi rendah (HP Android murah) maupun layar Retina.
   * *Alternatif Aksesibilitas Disleksia (Opsional di Reader Toolbar):* **Lexend** (`--font-dyslexic`), terbukti secara klinis meningkatkan kecepatan baca bagi siswa dengan kesulitan membaca.
4. **Monospace / NISN / Kode Buku (`--font-mono`):** **JetBrains Mono** (Weight: `500 Medium`)
   * *Alasan:* Membedakan angka `0` (dengan titik di tengah) dan huruf `O`, serta angka `1`, huruf `l` kecil, dan `I` besar. Sangat krusial saat siswa memasukkan 10 digit NISN.

### 3.2 Type Scale & Hierarchy Table

Skala menggunakan basis $1\text{rem} = 16\text{px}$.

| Elemen | Peran UI | Ukuran Mobile ($<640\text{px}$) | Ukuran Desktop ($\ge 1025\text{px}$) | Font Family & Weight | Line Height (`leading`) | Letter Spacing (`tracking`) | Class Tailwind |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | Sapaan Dashboard / Judul Landing | $1.875\text{rem}$ ($30\text{px}$) | $2.5\text{rem}$ ($40\text{px}$) | Jakarta Sans `800` | `1.2` (`leading-tight`) | `-0.02em` (`tracking-tight`) | `text-3xl lg:text-4xl font-extrabold tracking-tight` |
| **H1** | Judul Halaman Utama / Judul Buku di Detail | $1.5\text{rem}$ ($24\text{px}$) | $2.0\text{rem}$ ($32\text{px}$) | Jakarta Sans `700` | `1.25` (`leading-snug`) | `-0.015em` | `text-2xl lg:text-[32px] font-bold leading-snug` |
| **H2** | Judul Kategori Rak / Section Dashboard | $1.25\text{rem}$ ($20\text{px}$) | $1.5\text{rem}$ ($24\text{px}$) | Jakarta Sans `700` | `1.3` | `-0.01em` | `text-xl lg:text-2xl font-bold` |
| **H3** | Judul Bab di Reader / Sub-panel Admin | $1.125\text{rem}$ ($18\text{px}$) | $1.25\text{rem}$ ($20\text{px}$) | Jakarta Sans `600` | `1.4` | `0em` | `text-lg lg:text-xl font-semibold` |
| **H4** | Judul Buku pada `BookCard` | $1.0\text{rem}$ ($16\text{px}$) | $1.0\text{rem}$ ($16\text{px}$) | Jakarta Sans `600` | `1.35` (`leading-snug`) | `0em` | `text-base font-semibold leading-snug line-clamp-2` |
| **Body Large (Reader Default)** | Teks Isi Buku (Default SMP/SMA) | $1.125\text{rem}$ ($18\text{px}$) | $1.25\text{rem}$ ($20\text{px}$) | Literata `400` | `1.8` (`leading-relaxed`) | `0.005em` | `font-serif text-lg lg:text-xl leading-[1.8]` |
| **Body XL (Reader SD)** | Teks Isi Buku (Default SD Kelas 1–3) | $1.375\text{rem}$ ($22\text{px}$) | $1.5\text{rem}$ ($24\text{px}$) | Lexend / Jakarta `400` | `1.9` | `0.01em` | `text-[22px] lg:text-2xl leading-[1.9]` |
| **Body Default** | Deskripsi sinopsis, instruksi form, menu | $1.0\text{rem}$ ($16\text{px}$) | $1.0\text{rem}$ ($16\text{px}$) | Jakarta Sans `400` | `1.6` (`leading-normal`) | `0em` | `text-base font-normal leading-normal` |
| **Body Small / UI** | Nama penulis di kartu, tombol sekunder, tabel | $0.875\text{rem}$ ($14\text{px}$) | $0.875\text{rem}$ ($14\text{px}$) | Jakarta Sans `500` | `1.5` | `0em` | `text-sm font-medium` |
| **Caption / Badge** | Label jenjang, persentase progress, *timestamp* | $0.75\text{rem}$ ($12\text{px}$) | $0.75\text{rem}$ ($12\text{px}$) | Jakarta Sans `600` | `1.4` | `0.02em` (`tracking-wide`) | `text-xs font-semibold tracking-wide` |
| **Code / NISN** | Input NISN, ISBN, Nomor Panggil Buku | $1.125\text{rem}$ ($18\text{px}$) | $1.25\text{rem}$ ($20\text{px}$) | JetBrains Mono `500` | `1.5` | `0.1em` (`tracking-widest`) | `font-mono text-lg lg:text-xl tracking-widest` |

### 3.3 Readability Optimization untuk Long-Form Reading
* **Panjang Baris Ideal (Measure):** Teks di dalam *Reading Interface* **dilarang keras** membentang selebar layar monitor desktop. Batasi lebar kontainer teks pada `max-w-[65ch]` (sekitar $60\text{–}70$ karakter per baris, atau $\pm 680\text{px}$). Untuk jenjang SD dengan *font* besar, gunakan `max-w-[55ch]`.
* **Jarak Antar Paragraf:** Gunakan `mb-6` ($1.5\text{rem}$) antar paragraf. Jangan gunakan *text-indent* (paragraf menjorok ke dalam) di layar digital karena menyulitkan pemindaian mata di layar HP sempit.
* **Perataan Teks (Alignment):** Gunakan **Rata Kiri (`text-left`)**, **BUKAN Rata Kiri-Kanan (`text-justify`)**. *Justified text* di browser web menciptakan celah spasi tak beraturan ("sungai putih" di tengah teks) yang sangat menyulitkan siswa disleksia dan pembaca pemula (SD) dalam melacak kata demi kata.

---

## 4. COMPONENT LIBRARY SPECIFICATION

Semua komponen dibangun di atas primitif `shadcn/ui` dan Tailwind CSS. Berikut adalah spesifikasi mendalam untuk 10 komponen wajib.

---

### 4.1 `BookCard` (Kartu Buku dengan Indikator Progress)

**Deskripsi Visual:** Kartu vertikal dengan rasio sampul buku standar Indonesia ($2:3$ atau rasio B5/A5). Di sudut kiri atas sampul terdapat lencana jenjang/kategori mengambang (*floating badge*) dengan latar semi-transparan `backdrop-blur-md`. Jika buku sedang dibaca, di bagian bawah sampul menempel bilah kemajuan (*progress bar*) berwarna *Warm Amber*. Di bawah gambar sampul terdapat judul buku (maksimal 2 baris, terpotong elipsis jika panjang), nama penulis, dan tombol aksi cepat.

* **shadcn/ui Base:** `Card`, `Badge`, `Progress`, `Skeleton` (untuk *loading state*).
* **Varian:**
  * `compact`: Hanya sampul, judul 1 baris, dan *progress bar* tipis (untuk *carousel* rekomendasi).
  * `default`: Sampul, *badge* kategori, judul 2 baris, penulis, estimasi waktu baca, dan persentase progress.
  * `horizontal`: Sampul di kiri (lebar $80\text{px}$), detail & tombol "Lanjut Baca" di kanan (untuk bagian "Sedang Dibaca" di Dashboard).
* **States:**
  * `default`: Bayangan tipis `shadow-sm`, border `border-slate-200 dark:border-slate-800`.
  * `hover`: Kartu terangkat sedikit (`-translate-y-1`), bayangan menebal (`shadow-md`), gambar sampul melakukan *zoom* halus (`scale-105` di dalam `overflow-hidden`).
  * `focus-visible`: Cincin fokus jelas `ring-2 ring-teal-600 ring-offset-2` mengelilingi seluruh kartu.
  * `completed`: Muncul *badge* centang hijau (`bg-emerald-600 text-white`) di kanan atas sampul bertuliskan "Selesai".
* **Accessibility (A11y):**
  * Seluruh kartu dibungkus elemen `<article>` dengan satu tautan utama (`<a>` atau `<button>`) menggunakan teknik *stretched-link* (`after:absolute after:inset-0`) agar area klik luas namun *screen reader* tidak membaca banyak tombol berulang.
  * Atribut `aria-label` menyatukan informasi: `"Buku Laskar Pelangi oleh Andrea Hirata, Kategori Fiksi SMA, Progress baca 45 persen. Tekan Enter untuk melihat detail."`

```tsx
// TypeScript Interface & Implementasi Komponen BookCard
import React from 'react';
import Image from 'next/image';
import { Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  category: 'fiksi' | 'sains' | 'sejarah' | 'komik';
  gradeLevel: 'SD' | 'SMP' | 'SMA';
  progressPercent?: number; // 0 - 100, undefined jika belum pernah dibuka
  estimatedReadMinutes?: number;
  variant?: 'default' | 'compact' | 'horizontal';
  onSelect: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  author,
  coverUrl,
  category,
  gradeLevel,
  progressPercent = 0,
  estimatedReadMinutes,
  variant = 'default',
  onSelect,
}) => {
  const isCompleted = progressPercent >= 100;
  const isReading = progressPercent > 0 && progressPercent < 100;

  return (
    <article
      className="group relative flex flex-col rounded-xl bg-card text-card-foreground border border-border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 overflow-hidden"
    >
      {/* Container Sampul Rasio 2:3 */}
      <div className="relative aspect-[2/3] w-full bg-secondary overflow-hidden">
        <Image
          src={coverUrl}
          alt={`Sampul buku ${title}`}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 180px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badge Jenjang & Kategori (Kiri Atas) */}
        <div className="absolute top-2 left-2 flex gap-1.5 z-10">
          <Badge
            variant="secondary"
            className="bg-background/90 backdrop-blur-sm text-foreground font-semibold text-xs px-2 py-0.5 shadow-sm"
          >
            {gradeLevel}
          </Badge>
        </div>

        {/* Indikator Selesai (Kanan Atas) */}
        {isCompleted && (
          <div
            className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm"
            aria-label="Buku selesai dibaca"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Selesai</span>
          </div>
        )}

        {/* Overlay Progress Bar di Bawah Sampul */}
        {isReading && (
          <div className="absolute bottom-0 inset-x-0 bg-slate-900/75 backdrop-blur-xs p-2 z-10">
            <div className="flex justify-between text-[11px] font-medium text-white mb-1">
              <span>Sedang dibaca</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress
              value={progressPercent}
              className="h-1.5 bg-slate-700 [&>div]:bg-amber-400"
              aria-label={`Progress membaca ${progressPercent} persen`}
            />
          </div>
        )}
      </div>

      {/* Detail Informasi Buku */}
      <div className="flex flex-col flex-1 p-3 justify-between">
        <div>
          <h3 className="text-base font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            <button
              type="button"
              onClick={() => onSelect(id)}
              className="text-left focus:outline-none after:absolute after:inset-0"
              aria-label={`${title} oleh ${author}, Jenjang ${gradeLevel}, ${
                isCompleted
                  ? 'Sudah selesai dibaca'
                  : isReading
                  ? `Progress ${progressPercent} persen`
                  : 'Belum dibaca'
              }`}
            >
              {title}
            </button>
          </h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground line-clamp-1">
            {author}
          </p>
        </div>

        {variant === 'default' && estimatedReadMinutes && (
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{category}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {estimatedReadMinutes} mnt
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
```

---

### 4.2 `Bookshelf3D` & `Bookshelf2D` (Rak Buku Virtual & Fallback Responsif)

**Deskripsi Visual:**
* **Mode 3D (`Bookshelf3D`):** Sebuah kanvas interaktif setinggi $420\text{px}$ di bagian atas halaman perpustakaan (untuk layar $\ge 1025\text{px}$ dan perangkat mumpuni). Menampilkan rak kayu hangat bertingkat dua (`#8B5A2B` dengan *roughness* tinggi agar tidak memantulkan cahaya berlebihan). Buku-buku berjejer miring dan tegak. Saat kursor diarahkan ke sebuah buku (*hover*), buku tersebut bergeser maju ke arah pengguna sejauh $0.3\text{ unit}$ 3D, sedikit berputar memperlihatkan sampul depannya, dan memunculkan *tooltip* HTML mengambang (`@react-three/drei <Html>`) berisi judul serta tombol "Buka Buku".
* **Mode 2D (`Bookshelf2D`):** Tampilan *CSS Grid* yang meniru estetika rak buku fisik melalui papan kayu horizontal tebal (`h-4 bg-amber-900/20 dark:bg-slate-800 rounded-full shadow-inner`) tepat di bawah setiap baris kartu buku. Sangat ringan, berjalan $60\text{fps}$ di semua HP Android, dan menjadi tampilan utama di layar *mobile* atau saat tombol **"Mode Hemat Kuota / Tampilan 2D"** diaktifkan.

* **shadcn/ui Base:** `Tabs` (untuk beralih 3D/2D secara manual), `Switch` (Mode Hemat Data), `Tooltip`.
* **States:**
  * `webgl-loading`: Menampilkan *skeleton* rak 2D dengan pesan `"Menyiapkan rak 3D interaktif..."`.
  * `fallback-active`: Otomatis aktif jika `navigator.connection?.saveData === true`, `window.innerWidth < 1024`, atau GPU terdeteksi lemah (`useDetectGPU` dari `@react-three/drei` mengembalikan `tier < 2`).
* **Accessibility (A11y) pada Canvas 3D:**
  * Kanvas WebGL (`<canvas>`) secara alami buta terhadap *screen reader*. Oleh karena itu, di dalam komponen `Bookshelf3D`, **wajib** disertakan daftar `<ul>` tersembunyi secara visual (`sr-only`) atau dapat diakses melalui tombol `Tab` yang memfokuskan buku di dalam kanvas 3D satu per satu menggunakan *state* `focusedBookIndex`.
  * Pengguna *keyboard* dapat menekan `Panah Kanan` / `Panah Kiri` untuk berpindah buku di rak 3D, dan kamera R3F akan bergeser halus (*lerping*) menuju koordinat $X$ buku yang sedang difokuskan.

```tsx
// TypeScript Interface untuk Bookshelf Container (Hybrid 3D/2D)
export interface BookshelfProps {
  books: BookCardProps[];
  shelfTitle: string;
  force2D?: boolean;
  onBookClick: (bookId: string) => void;
  onToggleMode?: (is3D: boolean) => void;
}
```

---

### 4.3 `ReadingProgressBar` (Indikator Baca Multi-Konteks)

**Deskripsi Visual:** Memiliki dua wujud berdasarkan konteks halaman:
1. **Di dalam Reader Interface (`variant="reader-top"`):** Garis horizontal tipis (`h-1.5`) yang menempel di paling atas layar (`fixed top-0 inset-x-0 z-50`). Warna terisi dengan *Teal* (`bg-primary`) atau *Amber* (`bg-amber-500`) seiring halaman bertambah. Di ujung kanannya terdapat gelembung kecil (`rounded-full`) yang hanya muncul saat halaman berganti, menampilkan `"Hal 14 dari 48 (29%)"`.
2. **Di dalam Dashboard Siswa (`variant="milestone-card"`):** Bilah tebal (`h-3 rounded-full`) disertai titik-titik penanda bab (*chapter markers*) dan ikon piala kecil di ujung $100\%$.

* **shadcn/ui Base:** `Progress`.
* **Props Interface:**
```tsx
export interface ReadingProgressBarProps {
  currentPage: number;
  totalPages: number;
  chapters?: { title: string; startPage: number }[];
  variant?: 'reader-top' | 'milestone-card' | 'inline-minimal';
  showPageNumbers?: boolean;
}
```
* **Accessibility:** Wajib menyertakan `role="progressbar"`, `aria-valuenow={percentage}`, `aria-valuemin={0}`, `aria-valuemax={100}`, dan `aria-valuetext={`Halaman ${currentPage} dari ${totalPages}`}`.

---

### 4.4 `NISNLoginForm` (Formulir Masuk Siswa Tanpa Password Rumit)

**Deskripsi Visual:** Kartu formulir di tengah layar dengan sudut membulat besar (`rounded-2xl`), dikelilingi ilustrasi vektor sederhana bertema buku. Alur autentikasi siswa menggunakan **10 Digit NISN (Nomor Induk Siswa Nasional)** + **PIN Pribadi 6 Digit** yang dibagikan guru (reset PIN dilakukan tatap muka di perpustakaan, sesuai PRD 5.4).
* Kotak input NISN menggunakan *font* `JetBrains Mono` berukuran besar (`text-xl tracking-widest`), memformat otomatis spasi setiap 3–4 angka (`0012 3456 78`) secara visual agar mudah diperiksa oleh anak-anak, dan menampilkan indikator penghitung digit di pojok kanan (`8/10 angka`).

* **shadcn/ui Base:** `Form`, `Input`, `Button`, `Alert`, `Tabs` (Tab 1: Masuk Siswa via NISN, Tab 2: Masuk Guru/Admin via Username & Kata Sandi).
* **States:**
  * `default`: Border netral, tombol "Masuk ke Perpustakaan" dalam kondisi `disabled` sampai 10 angka terpenuhi.
  * `valid-length`: Saat tepat 10 digit angka dimasukkan, border input berubah menjadi hijau lembut (`border-emerald-500`) dengan ikon centang.
  * `error`: Jika pengguna mengetik huruf (otomatis diblokir/dihapus) atau NISN tidak ditemukan di database, kartu bergetar halus secara horizontal (`animate-shake`), muncul `Alert` merah muda dengan saran ramah.
  * `loading`: Tombol menampilkan *spinner* dan teks `"Mencari data siswamu..."`.
* **Accessibility & Mobile UX:**
  * Gunakan atribut HTML `inputMode="numeric"` dan `pattern="[0-9]*"` agar di HP Android/iOS langsung memunculkan **papan ketik angka besar (numpad)**, bukan papan ketik huruf QWERTY kecil.
  * Hubungkan pesan error dengan input menggunakan `aria-describedby="nisn-error-msg"` dan `aria-invalid={!!error}`.

```tsx
// TypeScript Interface untuk NISNLoginForm
export interface NISNLoginFormProps {
  onSuccessLogin: (studentData: { nisn: string; name: string; grade: 'SD' | 'SMP' | 'SMA' }) => void;
  schoolName?: string;
  allowGuestMode?: boolean; // Mode baca cepat tanpa login untuk pameran/demo
}
```

---

### 4.5 `ReaderToolbar` (Panel Kontrol Kenyamanan Baca)

**Deskripsi Visual:** Bilah alat mengambang (*floating dock*) berbentuk kapsul (`rounded-full shadow-lg border border-border/80 bg-background/95 backdrop-blur-md`) yang terletak di bagian bawah tengah layar pada *mobile* atau di bagian kanan atas pada *desktop*. Secara otomatis bersembunyi (menggeser keluar layar dengan opasitas 0) setelah pengguna diam membaca selama 3 detik, dan muncul kembali saat layar diketuk sekali atau kursor digerakkan ke tepi atas/bawah.

**Kontrol di dalam Toolbar:**
1. **Tombol Pengaturan Teks (`Aa`):** Membuka `Popover` yang berisi:
   * Ukuran Huruf: Tombol `-` (Perkecil) dan `+` (Perbesar) dengan 5 langkah skala (`16px`, `18px`, `20px`, `24px`, `28px`).
   * Jenis Huruf: Pilihan tombol radio visual antara **Serif (Literata)**, **Sans (Jakarta Sans)**, dan **Ramah Disleksia (Lexend)**.
   * Spasi Baris: Rapat (`1.5`), Normal (`1.8`), Longgar (`2.1`).
2. **Pemilih Tema Kertas:** 3 tombol bulat berwarna (`#FAF8F5` Siang, `#F4ECD8` Senja/Sepia, `#12161F` Malam) dengan indikator cincin aktif.
3. **Tombol Suara / Text-to-Speech (`TTS Toggle`):** Ikon *Speaker/Headphone* dengan label **"Dengarkan"**. Sangat penting untuk siswa SD kelas bawah atau siswa tunanetra/low-vision. Saat aktif, tombol berubah warna menjadi *Amber* berdenyut lembut, dan muncul kontrol tambahan: `Play/Pause`, `Kecepatan (0.8x, 1x, 1.2x)`. Menggunakan Web Speech API bawaan browser (`window.speechSynthesis` dengan `lang = 'id-ID'`) sehingga **0 biaya server dan bekerja secara offline/statis di Netlify**.
4. **Tombol Daftar Isi & Bookmark:** Membuka `Sheet` (panel samping) berisi daftar bab.

* **shadcn/ui Base:** `Popover`, `ToggleGroup`, `Slider`, `Sheet`, `Tooltip`.
* **Props Interface:**
```tsx
export interface ReaderSettings {
  fontSizeStep: 1 | 2 | 3 | 4 | 5;
  fontFamily: 'serif' | 'sans' | 'dyslexic';
  theme: 'day' | 'sepia' | 'night';
  lineSpacing: 'normal' | 'relaxed' | 'loose';
}

export interface ReaderToolbarProps {
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderToolbarProps['settings']>) => void;
  isTtsPlaying: boolean;
  isTtsSupported: boolean;
  ttsSpeed: 0.8 | 1.0 | 1.2;
  onToggleTts: () => void;
  onChangeTtsSpeed: (speed: 0.8 | 1.0 | 1.2) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}
```

---

### 4.6 `CategoryFilter` (Filter Kategori & Jenjang Horizontal)

**Deskripsi Visual:** Baris *chip/pill* horizontal yang dapat digeser ke samping (*horizontal scroll* tanpa *scrollbar* yang mengganggu di *mobile*, dan *wrap* di *desktop*). Setiap *chip* memiliki ikon di sebelah kiri dan jumlah buku di sebelah kanan dalam kurung, misalnya: `[✨ Semua Buku (120)]`, `[🔬 Sains & Alam (34)]`, `[🧭 Sejarah Nusantara (28)]`, `[😄 Komik Edukasi (40)]`.

* **shadcn/ui Base:** `ToggleGroup` (`type="single"` atau `"multiple"`), `Badge`.
* **States:**
  * `unselected`: `bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent`.
  * `selected`: `bg-primary text-primary-foreground font-semibold shadow-xs` ditambah ikon centang kecil menggantikan atau mendampingi ikon kategori (agar siswa buta warna tahu mana filter yang sedang aktif).
* **Accessibility:** Gunakan `role="radiogroup"` (jika hanya bisa pilih 1 kategori) dan `aria-checked`. Pastikan tinggi minimum setiap *chip* adalah `h-10` ($40\text{px}$) atau `h-11` ($44\text{px}$) di layar sentuh.

```tsx
export interface CategoryItem {
  id: string;
  label: string;
  iconName: string;
  count: number;
  colorClass: string;
}

export interface CategoryFilterProps {
  categories: CategoryItem[];
  selectedCategory: string;
  selectedGrade: 'ALL' | 'SD' | 'SMP' | 'SMA';
  onSelectCategory: (categoryId: string) => void;
  onSelectGrade: (grade: 'ALL' | 'SD' | 'SMP' | 'SMA') => void;
}
```

---

### 4.7 `StudentDashboard` (Ringkasan Kemajuan & Aktivitas Siswa)

**Deskripsi Visual:** Layout *Bento Grid* yang ramah dan memotivasi.
* **Kartu Utama (Kiri Atas - Span 2 Kolom):** **"Lanjutkan Membaca"** — Menampilkan buku terakhir yang dibuka dengan sampul cukup besar, judul bab terakhir, bilah kemajuan, dan tombol CTA primer besar: `"Lanjut Baca Bab 4 (Hal. 32) →"`.
* **Kartu Statistik (Kanan Atas - Span 1 Kolom):** Menampilkan 3 metrik sederhana dengan ikon warna-warni:
  1. 🔥 **Rentetan Baca (Streak):** `"4 Hari Beruntun"`
  2. 📚 **Buku Selesai:** `"7 Buku Semester Ini"`
  3. ⏱️ **Waktu Membaca:** `"120 Menit Minggu Ini"`
* **Baris Bawah:** Tabulasi antara `"Rekomendasi Untukmu"` (berdasarkan jenjang & kategori favorit) dan `"Riwayat & Catatan Kutipan"`.

* **shadcn/ui Base:** `Card`, `Tabs`, `Progress`, `Avatar`.
* **Props Interface:**
```tsx
export interface StudentDashboardProps {
  student: {
    name: string;
    nisn: string;
    grade: 'SD' | 'SMP' | 'SMA';
    className: string; // misal: "Kelas 5A" atau "XI IPA 2"
  };
  stats: {
    streakDays: number;
    booksCompleted: number;
    minutesReadThisWeek: number;
    weeklyGoalMinutes: number;
  };
  lastReadBook?: BookCardProps & { lastPage: number; totalPages: number; lastChapterTitle: string };
  recommendedBooks: BookCardProps[];
  readingHistory: Array<BookCardProps & { finishedAt?: string; lastAccessedAt: string }>;
}
```

---

### 4.8 `AdminAnalyticsPanel` (Panel Analitik Guru & Pustakawan)

**Deskripsi Visual:** Antarmuka bersih bergaya *data-dense* yang mudah dipahami oleh guru non-teknis.
* **Bagian Atas (KPI Cards):** 4 kartu metrik dengan perbandingan bulan lalu: *Total Siswa Aktif Membaca*, *Rata-rata Durasi Baca Harian*, *Total Buku Tersedia*, dan *Kategori Paling Diminati*.
* **Bagian Tengah:** Grafik batang horizontal sederhana (dibuat dengan CSS murni atau komponen ringan `Recharts` dari `shadcn/ui charts`) yang memperlihatkan partisipasi baca per tingkatan kelas (misal: Kelas 7A vs 7B vs 7C), serta tombol **"Unduh Laporan Literasi Bulanan (CSV/PDF)"** untuk kebutuhan pelaporan akreditasi sekolah/Kurikulum Merdeka.
* **Bagian Bawah:** Tabel manajemen katalog buku (Tambah Buku via unggah EPUB/PDF/JSON, Edit Metadata, Nonaktifkan Buku) dengan pencarian dan filter cepat.

* **shadcn/ui Base:** `Table`, `Card`, `Select`, `Button`, `DropdownMenu`, `Badge`.
* **Props Interface:**
```tsx
export interface AdminAnalyticsPanelProps {
  period: '7d' | '30d' | 'semester';
  onPeriodChange: (period: '7d' | '30d' | 'semester') => void;
  summaryMetrics: {
    activeReadersCount: number;
    totalStudentsCount: number;
    avgReadingMinutesPerStudent: number;
    mostPopularCategory: string;
  };
  topBooks: Array<{ id: string; title: string; readCount: number; completionRate: number }>;
  classParticipation: Array<{ className: string; activePercentage: number }>;
  onExportReport: (format: 'csv' | 'pdf') => void;
}
```

---

### 4.9 `Toast / Notification` (Umpan Balik Non-Intrusif)

**Deskripsi Visual:** Kotak pesan melayang di pojok kanan bawah (*desktop*) atau di bagian atas tengah (*mobile*, agar tidak menutupi *bottom navigation bar*). Dilengkapi ikon besar di sisi kiri. Contoh penggunaan: saat halaman buku otomatis tersimpan (*auto-bookmark*), saat beralih ke mode hemat kuota karena jaringan lambat, atau saat siswa mencapai target baca harian.

* **shadcn/ui Base:** `Sonner` (sangat direkomendasikan di atas komponen `Toast` lama karena ukurannya jauh lebih ringan dan animasinya mulus di *mobile*).
* **Konfigurasi Tailwind Kustom pada Sonner:**
```tsx
// Contoh pemanggilan Toast kontekstual
// toast.success("Halaman 24 ditandai!", { description: "Kamu bisa lanjut membaca kapan saja." })
```

---

### 4.10 `BookDetailModal / Drawer` (Panel Detail Buku)

**Deskripsi Visual:** Menggunakan pola **Responsive Dialog/Drawer**.
* Pada layar **Desktop ($\ge 768\text{px}$):** Tampil sebagai `Dialog` (Modal) di tengah layar (`max-w-2xl rounded-2xl p-6`) dengan tata letak 2 kolom (Sampul 3D miring sedikit di kiri, detail lengkap di kanan).
* Pada layar **Mobile ($< 768\text{px}$):** Tampil sebagai `Drawer` (*bottom sheet* berbasis Vaul dari `shadcn/ui`) yang muncul dari bawah layar hingga $85\%$ tinggi layar, dapat ditutup dengan menggeser ke bawah (*swipe down*).
* **Konten di dalamnya:** Sampul resolusi tinggi, Judul, Penulis, Penerbit, Tahun Terbit, Badge Jenjang & Kategori, 3 kotak info ringkas (*Jumlah Halaman*, *Estimasi Waktu*, *Tingkat Kesulitan Kata*), Sinopsis lengkap, dan **Sticky Action Bar** di bagian bawah berisi tombol utama `"Mulai Membaca Sekarang"` (atau `"Lanjutkan Halaman X"`) serta tombol ikon `"Simpan ke Rakku"`.

* **shadcn/ui Base:** `Dialog` (Desktop) + `Drawer` (Mobile) yang digabungkan melalui *hook* `useMediaQuery("(min-width: 768px)")`.
* **Accessibility:** Fokus otomatis terkunci (*focus trap*) di dalam modal saat terbuka, tombol `Escape` menutup modal, dan setelah ditutup fokus kembali tepat ke elemen `BookCard` yang tadi diklik.

---

## 5. PAGE LAYOUTS (DESKRIPTIF WIREFRAMES)

Seluruh halaman dirancang dengan pendekatan **Mobile-First**, memastikan performa tinggi pada Next.js 14 dengan *SSG/ISR* di Netlify.

---

### 5.a. Landing & Login Page (`/login`)

* **Layout Structure:**
  * **Desktop:** `grid grid-cols-1 lg:grid-cols-12 min-h-screen bg-background`.
    * **Kolom Kiri (`lg:col-span-7`):** Area visual penjenamaan sekolah. Latar belakang warna `bg-teal-900` dengan pola geometris batik/buku tipis (`opacity-10`). Menampilkan kalimat utama besar (*Hero Display*): `"Jelajahi Ribuan Cerita & Ilmu Pengetahuan dari Sekolahmu"`, ditambah *preview* interaktif ringan berupa 3 buku pilihan minggu ini yang bisa diputar sedikit.
    * **Kolom Kanan (`lg:col-span-5`):** Area terfokus `flex items-center justify-center p-6 sm:p-12`. Berisi komponen `NISNLoginForm`.
  * **Mobile:** Satu kolom vertikal (`flex flex-col min-h-screen justify-between p-4`). Header ringkas berisi logo sekolah & nama perpustakaan di atas, formulir login langsung terlihat di tengah tanpa perlu *scroll*, dan tombol bantuan di bawah.
* **Interaction Flow:**
  1. Siswa mengetik 10 digit NISN. Setiap digit diketik, indikator penghitung bertambah (`1/10` ... `10/10`).
  2. Jika siswa mengaktifkan opsi `"Mode Tamu / Baca Cepat"`, mereka memilih jenjang (`SD`, `SMP`, atau `SMA`) lewat 3 tombol kartu besar, lalu langsung diarahkan ke `/library?grade=SMP`.
* **Loading & Error States:**
  * Saat verifikasi NISN, input dikunci (`disabled`) dan tombol menampilkan animasi *pulse*. Jika jaringan terputus, muncul *banner* kuning di atas form: `"Koneksi internetmu sedang tidak stabil. Kamu masih bisa membuka buku yang sudah pernah diunduh di perangkat ini."`

---

### 5.b. Library / Rak Buku Utama (`/library`)

* **Layout Structure:**
  * **Header Sticky (`h-16 sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border`):**
    * Kiri: Logo PustakaKita + Badge Jenjang Aktif (misal: `Jenjang SMP`).
    * Tengah (Desktop): Bilah pencarian instan (`Command` / Input dengan *shortcut* `Ctrl + K`).
    * Kanan: Tombol sakelar **"Tampilan 3D / 2D"**, tombol Mode Gelap/Terang, dan Avatar Siswa.
  * **Area Utama (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8`):**
    1. **Banner "Lanjutkan Membaca" (Kondisional):** Hanya muncul jika siswa punya buku yang belum selesai. Tinggi kompak `h-24` di *mobile*, menampilkan tombol langsung menuju halaman terakhir.
    2. **Section Rak Interaktif:**
       * Desktop (Default): `Bookshelf3D` setinggi $400\text{px}$ menampilkan "Buku Pilihan Minggu Ini" di atas meja/rak kayu 3D.
       * Mobile / Low-Bandwidth: Korsel horizontal (`flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4`) dengan kartu unggulan.
    3. **Sticky Filter Bar:** Komponen `CategoryFilter` + pengurut (*Sort by: Terbaru, Terpopuler, Waktu Baca Tercepat*).
    4. **Katalog Grid Utama:** `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6`.
  * **Bottom Navigation Bar (Khusus Mobile `< 768px`, `fixed bottom-0 inset-x-0 h-16 bg-card border-t z-40 grid grid-cols-4`):**
    1. `Rak Buku` (Aktif)
    2. `Cari`
    3. `Rakku / Dashboard`
    4. `Profil`

---

### 5.c. Book Detail Modal / Page (`/library?book=[id]` & `/book/[id]`)

* **Pola Routing Next.js 14:** Menggunakan **Intercepting Routes (`@modal/(.)book/[id]`)**.
  * Jika dibuka dari klik di halaman `/library`, buku terbuka secara instan sebagai `BookDetailModal` di atas rak tanpa menghilangkan posisi *scroll* atau menghancurkan *context* WebGL 3D.
  * Jika tautan dibagikan ke teman via WhatsApp dan dibuka langsung (`/book/laskar-pelangi`), halaman dirender sebagai halaman penuh statis (*SSG*) yang ramah SEO dan cepat dimuat.
* **Struktur Konten:**
  * Bagian Atas: Sampul buku di sisi kiri dengan efek bayangan lipatan buku (`box-shadow` berlapis), berdampingan dengan Judul (`H1`), Penulis, lencana jenjang, dan tombol aksi.
  * Bagian Tengah: 3 kolom metrik mini (`bg-secondary/60 rounded-lg p-3 text-center`): **Halaman** (`124 Hal`), **Estimasi Baca** (`~45 Menit`), **Kosa Kata** (`Mudah / Tingkat SMP`).
  * Bagian Bawah: Sinopsis dengan fitur `"Baca Selengkapnya"` jika lebih dari 4 baris, diikuti daftar isi bab yang dapat diklik untuk langsung melompat ke bab tersebut.

---

### 5.d. Reading Interface (`/read/[bookId]`)

Ini adalah halaman paling krusial di seluruh aplikasi. Tidak boleh ada navigasi global sekolah atau *footer* di halaman ini.

* **Layout Structure:**
  * Kontainer luar: `min-h-screen transition-colors duration-300` (mengikuti warna tema kertas: Siang `#FAF8F5`, Senja `#F4ECD8`, atau Malam `#12161F`).
  * **Top Bar Minimalis (`fixed top-0 inset-x-0 z-40`):**
    * Paling atas: `ReadingProgressBar` (`h-1.5`).
    * Di bawahnya (muncul/hilang otomatis): Bar tipis `h-12 px-4 flex items-center justify-between` berisi tombol `← Kembali ke Rak` di kiri, Judul Buku & Bab di tengah (`text-sm font-medium truncate max-w-xs`), dan ikon *Bookmark* di kanan.
  * **Kanvas Baca Utama (`main`):**
    * `max-w-[65ch] mx-auto px-5 sm:px-8 pt-20 pb-28`
    * Mendukung dua mode paginasi yang dapat dipilih:
      1. **Mode Halaman (Paginated - Default untuk SD & Buku Bergambar):** Teks dibagi per layar menggunakan CSS Multi-column atau pemotongan paragraf terukur. Tombol besar transparan di tepi kiri dan kanan layar untuk membalik halaman (`Sebelumnya` / `Selanjutnya`), mencegah anak SD kehilangan baris saat melakukan *scrolling*.
      2. **Mode Gulir Bab (Scrolled Chapter - Default untuk SMP/SMA):** Membaca vertikal dari atas ke bawah per satu bab penuh, diakhiri dengan kartu perayaan kecil di akhir bab: `"Bab 2 Selesai! 🎉 [Lanjut ke Bab 3 →]"`.
  * **Fitur Bantuan Kosakata (Kamus Kontekstual):** Jika siswa memblok/mengetuk dua kali sebuah kata sulit (misal: *"fotosintesis"* atau *"hegemoni"*), muncul `Popover` kecil berisi arti kata sederhana dari kamus lokal statis JSON.
  * **Floating Bottom Control:** Komponen `ReaderToolbar` melayang di bagian bawah (`bottom-6`).

---

### 5.e. Student Dashboard (`/dashboard`)

* **Layout Structure (`max-w-6xl mx-auto px-4 py-8 space-y-8`):**
  1. **Header Sapaan Personal:**
     * `"Selamat pagi, Budi! 👋"` (Menyesuaikan waktu perangkat: Pagi/Siang/Sore/Malam).
     * Sub-teks: `"Kamu sudah membaca 35 menit minggu ini. Yuk, tambah 10 menit lagi untuk mencapai target mingguanmu!"` disertai bilah kemajuan melingkar atau horizontal.
  2. **Grid Utama (`grid grid-cols-1 lg:grid-cols-3 gap-6`):**
     * **Kolom Kiri & Tengah (`lg:col-span-2`):** Kartu besar "Sedang Kamu Baca" (maksimal 2 buku ditampilkan berdampingan agar siswa fokus menyelesaikan buku sebelum membuka terlalu banyak buku baru).
     * **Kolom Kanan (`lg:col-span-1`):** Kartu "Pencapaian & Lencana Literasi" (misal: Lencana *Penjelajah Sains*, *Kutu Buku Pagi*, *Tuntas 5 Buku*). Semua lencana digambar dengan SVG *inline* ringan.
  3. **Tab Riwayat & Koleksi:**
     * Tab 1: **Disimpan untuk Nanti** (Daftar buku yang ditandai).
     * Tab 2: **Selesai Dibaca** (Dilengkapi tombol `"Tulis Ulasan Singkat"` berisi 3 pertanyaan pemantik untuk tugas literasi sekolah: *Apa bagian paling seru dari buku ini?*).

---

### 5.f. Admin Dashboard (`/admin`)

* **Layout Structure:**
  * **Desktop Sidebar + Main Content (`flex min-h-screen`):**
    * **Sidebar Kiri (`w-64 border-r bg-card hidden md:flex flex-col`):** Menu navigasi admin (`Ringkasan Analitik`, `Katalog Buku`, `Data Siswa & Kelas`, `Laporan Literasi`).
    * **Area Konten (`flex-1 p-6 lg:p-8 overflow-y-auto`):**
      1. Baris KPI (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`).
      2. Panel Grafik & Tabel Klasemen Kelas (`grid grid-cols-1 lg:grid-cols-3 gap-6`).
      3. **Tabel CRUD Buku:** Dilengkapi fitur pencarian instan, filter status (`Terbit`, `Draf`), dan modal `"Tambah Buku Baru"` dengan area *drag-and-drop* untuk sampul buku (otomatis dikompresi di sisi klien menggunakan HTML5 Canvas ke format WebP sebelum disimpan) dan file teks/EPUB.

---

### 5.g. Search Results (`/search`)

* **Layout Structure:**
  * **Header Pencarian Besar:** Input pencarian dengan tombol hapus cepat (`X`), ditambah saran kata kunci populer berupa *chip* di bawahnya ketika kotak pencarian masih kosong (misal: `"Cerita Rakyat"`, `"Eksperimen Sains"`, `"Biografi Pahlawan"`, `"Komik Matematika"`).
  * **Hasil Pencarian Instan (Server-Side Full-Text Search via API + Neon `tsvector`):**
    * Query dikirim ke `/api/books/search` dengan debounce 300 ms (minimal 3 karakter) memakai indeks GIN `tsvector` pada `title || ' ' || author` sesuai PRD F02, maksimal 20 buku per request. Catatan: prototipe frontend saat ini memakai Fuse.js pada data mock sebagai placeholder dan diganti saat API tersedia.
  * **Empty / Zero Result State:**
    * Jika kata kunci `"dinosaurus terbang"` tidak ditemukan, tampilkan pesan ramah: `"Wah, buku dengan kata 'dinosaurus terbang' belum ada di rak kami."` diikuti langsung oleh bagian `"Mungkin kamu tertarik dengan buku Sains & Hewan ini:"` (menampilkan 4 kartu buku relevan agar siswa tidak menemui jalan buntu).

---

### 5.h. Profile & Settings (`/settings`)

* **Layout Structure (`max-w-2xl mx-auto px-4 py-8 space-y-6`):**
  * **Kartu Identitas Siswa:** Menampilkan Nama, NISN (dengan *font monospace*), Kelas, dan pilihan Avatar Ilustrasi (12 pilihan avatar karakter pelajar Indonesia gratis dalam format SVG).
  * **Pengaturan Pengalaman & Performa (Sangat Penting untuk Target Device):**
    * **Mode Hemat Kuota & Baterai (`Switch`):** *"Matikan efek rak 3D dan muat gambar sampul dengan ukuran lebih hemat."*
    * **Preferensi Baca Default:** Mengatur ukuran teks dan tema kertas bawaan setiap kali membuka buku.
    * **Penyimpanan Offline (PWA / IndexedDB Manager):** Menampilkan berapa banyak buku yang tersimpan di memori perangkat (`"3 Buku tersimpan untuk dibaca tanpa internet - 4.2 MB"`) beserta tombol `"Hapus Buku Offline yang Sudah Selesai"`.

---

## 6. MOTION & INTERACTION DESIGN

Semua animasi dirancang agar hemat CPU/GPU, hanya menganimasikan properti komposit (`transform` dan `opacity`), serta mematuhi preferensi sistem operasi pengguna.

### 6.1 Prinsip Durasi & Easing

| Jenis Interaksi | Durasi | Kurva Easing (CSS / Tailwind) | Penjelasan |
| :--- | :--- | :--- | :--- |
| **Micro-interactions** (Hover tombol, klik chip) | `150ms` | `cubic-bezier(0.4, 0, 0.2, 1)` (`ease-out`) | Terasa responsif dan instan. |
| **Card & UI Elevation** (Hover kartu buku, muncul *tooltip*) | `200ms` | `cubic-bezier(0.22, 1, 0.36, 1)` | Memberikan efek fisik yang halus tanpa terasa lambat. |
| **Drawer / Modal / Sheet** (Buka detail buku, daftar isi) | `300ms` | `cubic-bezier(0.32, 0.72, 0, 1)` | Kurva khas iOS/Vaul yang terasa alami saat digeser dengan jari. |
| **3D Camera & Book Pull** (Di dalam R3F `useFrame`) | *Damped Lerp* ($\lambda = 6$) | `THREE.MathUtils.damp()` | Menggunakan *frame-independent damping*, bukan `setTimeout`, agar tetap mulus baik di layar $60\text{Hz}$ maupun $120\text{Hz}$. |

### 6.2 Spesifikasi Micro-Interactions Utama

1. **Hover & Klik Buku pada Rak 3D (React Three Fiber):**
   * **Penting untuk Performa Netlify/Static:** Aktifkan `<Canvas frameloop="demand">` pada React Three Fiber! Dengan `frameloop="demand"`, kanvas 3D **hanya me-render ulang frame ketika ada pergerakan kursor atau perubahan state**, sehingga penggunaan CPU/baterai turun hingga $0\%$ saat pengguna diam melihat layar.
   * Saat *hover* pada *mesh* buku: Posisi $Z$ bergerak dari $0$ ke $+0.35$, dan rotasi $Y$ berubah dari $0\text{ rad}$ menjadi $-0.25\text{ rad}$ (sedikit miring memperlihatkan sampul).
2. **Transisi Balik Halaman (Page Turn di Reader):**
   * **Hindari** efek animasi lipatan kertas 3D (*3D page curl shader*) yang berat karena menguras baterai HP murah dan sering patah-patah.
   * **Gunakan** transisi *Slide & Fade* ringan: halaman lama bergeser `-16px` ke kiri sambil memudar (`opacity: 0` dalam `180ms`), halaman baru masuk dari `+16px` kanan menuju `0px` (`opacity: 1`).
3. **Update Progress Bar & Selesai Bab:**
   * Saat berpindah halaman, lebar *progress bar* bertransisi menggunakan `transition-all duration-300 ease-out`.
   * Saat mencapai halaman terakhir sebuah bab, ikon centang melakukan efek pantulan skala singkat (`scale-0` $\rightarrow$ `scale-110` $\rightarrow$ `scale-100` dalam `350ms`).

### 6.3 Penanganan `prefers-reduced-motion`

Tambahkan aturan global di `globals.css` dan *hook* deteksi untuk R3F:
* Jika pengguna mengaktifkan fitur *Reduce Motion* di pengaturan HP/Laptop mereka:
  * Semua transisi halaman berubah menjadi *instant crossfade* (`duration-75` tanpa pergeseran `translate`).
  * Rak buku otomatis beralih dari `Bookshelf3D` ke `Bookshelf2D` statis.

```css
/* Di dalam app/globals.css */
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 7. ACCESSIBILITY (A11Y) CHECKLIST & GUIDELINES

Dirancang agar mematuhi standar **WCAG 2.1 Level AA** dan ramah terhadap keberagaman kondisi fisik serta kognitif siswa SD–SMA.

### 7.1 Keyboard Navigation Map (Peta Navigasi Papan Ketik)

| Alur / Halaman | Tombol Keyboard | Perilaku yang Wajib Terjadi |
| :--- | :--- | :--- |
| **Global (Semua Halaman)** | `Tab` (Pertama kali) | Memunculkan tombol **"Lewati ke Konten Utama (Skip to Content)"** di pojok kiri atas (`focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50`). |
| **Global Search** | `Ctrl + K` atau `/` | Langsung memfokuskan kotak pencarian buku dari halaman mana saja (kecuali saat sedang mengetik di form). |
| **Library / Rak Buku** | `Panah Kanan` / `Panah Kiri` | Saat fokus berada di dalam baris `CategoryFilter` atau `Bookshelf`, menggeser fokus antar item secara horizontal (*roving tabindex*). |
| **Book Detail Modal** | `Escape` | Menutup modal/drawer dan mengembalikan fokus tepat ke kartu buku pemicu. |
| **Reading Interface** | `Panah Kanan` / `Spasi` | Membalik ke halaman berikutnya (dalam mode halaman) atau menggulir satu layar ke bawah dengan halus. |
| **Reading Interface** | `Panah Kiri` | Kembali ke halaman sebelumnya. |
| **Reading Interface** | `T` | Menyalakan atau menjeda pembaca suara (*Text-to-Speech*). |
| **Reading Interface** | `+` dan `-` | Memperbesar atau memperkecil ukuran huruf isi buku secara langsung. |

### 7.2 Screen Reader Compatibility Notes (NVDA, TalkBack Android, VoiceOver)
* **Live Regions untuk Perubahan Halaman:** Di dalam `ReadingInterface`, sertakan elemen `<div aria-live="polite" aria-atomic="true" className="sr-only">` yang mengumumkan `"Halaman 15 dari 60, Bab 2"` setiap kali halaman berpindah.
* **Sinkronisasi Text-to-Speech (TTS):** Saat fitur TTS bawaan aplikasi menyala, berikan label jelas pada tombol: `aria-pressed={isTtsPlaying}` dan ubah teks tombol dari `"Dengarkan Buku"` menjadi `"Jeda Suara Bacaan"`.
* **Gambar di Dalam Buku (Ilustrasi Sains/Sejarah):** Setiap ilustrasi di dalam konten buku wajib memiliki atribut `alt` deskriptif atau tombol `<figcaption>` di bawahnya agar siswa tunanetra tetap memahami konteks gambar.

### 7.3 Indikator Aman Buta Warna (Color-Blind Safe)
* **Jangan pernah menggunakan warna sebagai satu-satunya penanda:**
  * *Status Buku:* Selain warna hijau/kuning, selalu sertakan ikon (`CheckCircle2` untuk selesai, `BookOpen` untuk sedang dibaca) dan label teks eksplisit (`"Selesai"`, `"45%"`).
  * *Jenjang Sekolah:* Selain warna Merah (SD), Biru (SMP), dan Abu (SMA), teks `SD`, `SMP`, `SMA` selalu tercetak jelas di dalam *badge*.
  * *Validasi Form NISN:* Pesan kesalahan selalu diawali ikon `AlertCircle` dan teks penjelasan di bawah input, bukan sekadar mengubah warna garis tepi menjadi merah.

### 7.4 Ukuran Target Sentuh (Touch Target Sizes)
* Siswa SD kelas 1–3 masih mengembangkan koordinasi motorik halus jari tangan.
* **Standar Minimum Absolut:** Semua elemen interaktif (tombol, *chip* kategori, ikon *bookmark*, tombol tutup modal) wajib memiliki area sentuh minimal **$44 \times 44\text{px}$** (`min-h-[44px] min-w-[44px]`).
* Khusus untuk komponen **Siswa SD** (dan di dalam `ReaderToolbar` pada layar *mobile*), perbesar target sentuh utama menjadi **$48 \times 48\text{px}$** (`h-12 w-12`) dengan jarak antar tombol minimal $8\text{px}$ (`gap-2`) untuk mencegah salah pencet (*rage taps*).

---

## 8. RESPONSIVE BREAKPOINTS & LOW-BANDWIDTH STRATEGY

Dirancang khusus untuk **Next.js 14 (App Router) di Netlify** dengan *SSG/ISR* untuk halaman publik dan *Route Handlers* sebagai API (tanpa `output: 'export'`, karena API route, cookie auth, dan pre-signed URL membutuhkan runtime server).

### 8.1 Tabel Strategi Breakpoint

| Breakpoint | Rentang Lebar | Target Perangkat | Perilaku Rak Buku | Navigasi Utama | Kolom Katalog Grid | Optimasi Khusus |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mobile (`default` – `sm`)** | $320\text{px} - 640\text{px}$ | HP Android murah – menengah (Layar kecil) | **2D Korsel & Grid saja.** Kanvas 3D tidak di-mount sama sekali (`dynamic import` dilewati). | **Bottom Nav Bar** (`fixed bottom-0`, 4 menu utama) agar mudah dijangkau ibu jari. | `grid-cols-2` (`gap-3` di $320\text{px}$, `gap-4` di $375\text{px}+$). | `ReaderToolbar` menempel di bawah; modal buku otomatis menjadi *Bottom Sheet Drawer*. |
| **Tablet (`md` – `lg`)** | $641\text{px} - 1024\text{px}$ | Tablet sekolah / iPad / Chromebook lipat | **2D Rak Kayu Estetik** secara default, dengan tombol opsional `"Coba Tampilan 3D"`. | **Top Sticky Header** lengkap dengan bilah pencarian terlihat langsung. | `grid-cols-3` hingga `grid-cols-4` (`gap-5`). | Pengalaman membaca paling optimal: margin kiri-kanan luas seperti memegang buku fisik. |
| **Desktop (`xl`+)** | $\ge 1025\text{px}$ | PC Laboratorium Komputer Sekolah / Laptop | **Full 3D Rak Interaktif (R3F)** di bagian *Hero*, diikuti katalog 2D di bawahnya. | **Top Sticky Header** + *Keyboard Shortcuts* aktif penuh (`Ctrl+K`, panah). | `grid-cols-5` hingga `grid-cols-6` (`gap-6`). | Dashboard menampilkan *Bento Grid* multi-kolom; Admin menampilkan *Sidebar* tetap. |

### 8.2 Arsitektur Low-Bandwidth & Performance Guard (Khusus Solo Dev + Netlify)

Agar aplikasi tetap super cepat saat diakses menggunakan jaringan seluler 3G/4G tidak stabil di berbagai daerah Indonesia, terapkan 4 strategi kode berikut:

1. **Lazy-Loading Total untuk Bundle 3D (`next/dynamic`):**
   Jangan pernah mengimpor `three` atau `@react-three/fiber` di *bundle* utama halaman! Gunakan `next/dynamic` dengan `ssr: false` sehingga pengguna *mobile* atau pengguna mode hemat data **sama sekali tidak mengunduh kode Three.js ($\sim 150\text{KB}$ gzipped)**.
2. **Deteksi Otomatis Kondisi Jaringan & Perangkat (`usePerformanceMode` Hook):**
   Buat satu *custom hook* yang memeriksa kondisi perangkat sebelum memutuskan me-render 3D.

```tsx
// hooks/usePerformanceMode.ts
import { useState, useEffect } from 'react';

export function usePerformanceMode() {
  const [canRender3D, setCanRender3D] = useState<boolean>(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState<boolean>(false);

  useEffect(() => {
    // 1. Cek ukuran layar (Mobile otomatis 2D)
    const isDesktopOrLargeTablet = window.innerWidth >= 1024;

    // 2. Cek preferensi Reduced Motion OS
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 3. Cek Network Information API (Mode Hemat Data / Koneksi 2G-3G)
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
      deviceMemory?: number;
    };
    const saveData = nav.connection?.saveData === true;
    const slowConnection =
      nav.connection?.effectiveType === 'slow-2g' ||
      nav.connection?.effectiveType === '2g' ||
      nav.connection?.effectiveType === '3g';

    // 4. Cek RAM Perangkat (Jika < 4GB, matikan 3D otomatis)
    const lowMemory = nav.deviceMemory !== undefined && nav.deviceMemory < 4;

    const lowBwDetected = saveData || slowConnection || lowMemory;
    setIsLowBandwidth(lowBwDetected);

    if (isDesktopOrLargeTablet && !prefersReducedMotion && !lowBwDetected) {
      setCanRender3D(true);
    } else {
      setCanRender3D(false);
    }
  }, []);

  return { canRender3D, isLowBandwidth, setCanRender3D };
}
```

3. **Strategi Optimasi Gambar Statis di Netlify:**
   * Simpan semua sampul buku dalam format **WebP** dengan dimensi maksimal $400 \times 600\text{px}$ (ukuran file rata-rata hanya $18\text{–}30\text{KB}$ per sampul).
   * Gunakan *placeholder* warna dominan atau *blurDataURL* base64 berukuran sangat kecil ($<1\text{KB}$) sehingga saat gambar belum selesai diunduh, kartu buku sudah menampilkan warna yang senada dengan sampul aslinya.
4. **Offline-First Reading Cache (`localStorage` + `IndexedDB`):**
   * Begitu siswa membuka sebuah buku (`/read/[bookId]`), simpan teks bab saat ini dan bab berikutnya ke dalam `IndexedDB` (menggunakan *library* mikro `idb-keyval` yang hanya berukuran $600\text{ bytes}$).
   * Simpan posisi halaman terakhir (`lastPage`) dan pengaturan `ReaderToolbar` ke `localStorage` setiap kali halaman berubah. Dengan demikian, meskipun koneksi internet sekolah tiba-tiba mati di tengah jam pelajaran literasi, siswa dapat terus membaca buku tersebut sampai selesai tanpa gangguan!