export interface ChapterContent {
  number: number;
  title: string;
  startPage: number;
  paragraphs: string[];
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publishedYear: number;
  isbn: string;
  coverUrl: string;
  fileUrl?: string;
  r2Key?: string;
  category: "fiksi" | "sains" | "sejarah" | "komik";
  gradeLevel: "SD" | "SMP" | "SMA";
  progressPercent?: number;
  currentPage?: number;
  totalPages: number;
  estimatedReadMinutes: number;
  vocabularyLevel: string;
  sourceType: "bse" | "internal";
  synopsis: string;
  isFeatured?: boolean;
  isSaved?: boolean;
  chapters: ChapterContent[];
}

export const CATEGORIES_DATA = [
  {
    id: "semua",
    label: "Semua Buku",
    iconName: "Library",
    count: 12,
    colorClass: "bg-primary text-primary-foreground",
  },
  {
    id: "fiksi",
    label: "Fiksi & Sastra",
    iconName: "Sparkles",
    count: 4,
    colorClass:
      "border-violet-600/40 text-violet-700 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-300",
  },
  {
    id: "sains",
    label: "Sains & Alam",
    iconName: "Atom",
    count: 3,
    colorClass:
      "border-sky-600/40 text-sky-700 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300",
  },
  {
    id: "sejarah",
    label: "Sejarah Nusantara",
    iconName: "Compass",
    count: 3,
    colorClass:
      "border-amber-700/40 text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300",
  },
  {
    id: "komik",
    label: "Komik Edukasi",
    iconName: "Smile",
    count: 2,
    colorClass:
      "border-rose-600/40 text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300",
  },
];

export const CONTEXTUAL_DICTIONARY: Record<
  string,
  { term: string; category: string; definition: string; example: string }
> = {
  fotosintesis: {
    term: "Fotosintesis",
    category: "Biologi / Sains",
    definition:
      "Proses tumbuhan hijau mengubah energi cahaya matahari, air, dan karbon dioksida menjadi makanan (glukosa) serta oksigen.",
    example: "Daun mangga melakukan fotosintesis di pagi yang cerah.",
  },
  ekosistem: {
    term: "Ekosistem",
    category: "Biologi / Lingkungan",
    definition:
      "Hubungan timbal balik yang tak terpisahkan antara makhluk hidup dengan lingkungan tempat tinggalnya.",
    example: "Terumbu karang adalah ekosistem laut yang kaya akan ikan.",
  },
  nusantara: {
    term: "Nusantara",
    category: "Sejarah",
    definition:
      "Sebutan bagi seluruh wilayah kepulauan Indonesia dari Sabang sampai Merauke yang disatukan oleh jalur laut.",
    example: "Kapal kayu tradisional berlayar menghubungkan pulau-pulau di Nusantara.",
  },
  maritim: {
    term: "Maritim",
    category: "Geografi & Sejarah",
    definition:
      "Segala sesuatu yang berhubungan dengan laut, pelayaran, dan perdagangan antar pulau.",
    example: "Sriwijaya dan Majapahit dikenal sebagai kerajaan maritim yang tangguh.",
  },
  gravitasi: {
    term: "Gravitasi",
    category: "Fisika",
    definition:
      "Gaya tarik-menarik alami antara semua benda yang memiliki massa, seperti gaya bumi yang menarik buah kelapa jatuh ke tanah.",
    example: "Tanpa gravitasi bumi, kita semua akan melayang di udara.",
  },
  observasi: {
    term: "Observasi",
    category: "Metode Ilmiah",
    definition:
      "Kegiatan mengamati suatu objek atau peristiwa secara teliti untuk mengumpulkan informasi yang akurat.",
    example: "Budi melakukan observasi pertumbuhan kecambah selama tujuh hari.",
  },
};

export const BOOKS_CATALOG: BookItem[] = [
  {
    id: "laskar-pelangi",
    title: "Laskar Pelangi: Jejak Mimpi Anak Pulau",
    author: "Andrea Hirata (Edisi Literasi Sekolah)",
    publisher: "Pusat Perbukuan Kemendikbudristek",
    publishedYear: 2023,
    isbn: "978-602-291-662-8",
    coverUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80",
    category: "fiksi",
    gradeLevel: "SMP",
    progressPercent: 65,
    currentPage: 16,
    totalPages: 24,
    estimatedReadMinutes: 45,
    vocabularyLevel: "Menengah (SMP)",
    sourceType: "bse",
    isFeatured: true,
    isSaved: true,
    synopsis:
      "Kisah inspiratif sepuluh anak di Pulau Belitung yang berjuang menempuh pendidikan di sekolah sederhana yang nyaris roboh. Dengan bimbingan Ibu Muslimah dan Pak Harfan, mereka membuktikan bahwa keterbatasan fasilitas tidak pernah bisa membatasi besarnya cita-cita dan persahabatan.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Pagi yang Menentukan di SD Muhammadiyah",
        startPage: 1,
        paragraphs: [
          "Angin pagi dari pesisir Belitung berembus lembut melewati celah-celah papan dinding sekolah kami yang sudah miring. Hari itu adalah hari pertama tahun ajaran baru, namun suasana di halaman sekolah terasa begitu tegang sekaligus penuh harap.",
          "Pak Harfan berdiri di depan pintu kelas sambil tersenyum tenang. Beliau bersama Ibu Muslimah sedang menghitung jumlah murid baru yang mendaftar. Sekolah kami membutuhkan tepat sepuluh anak agar tidak ditutup oleh pengawas pendidikan.",
          "Baru sembilan anak yang duduk di bangku kayu panjang. Aku, Lintang, Mahar, dan teman-teman lainnya saling berpandangan. Setiap kali terdengar suara langkah kaki atau gemerisik semak dari arah jalan setapak, jantung kami berdegup kencang.",
          "Tiba-tiba, dari kejauhan tampak seorang anak berlari kecil sambil menggenggam erat tas kainnya. Dialah Harun! Senyum Ibu Muslimah langsung merekah hangat. Hari itu, perjalanan belajar kami di bawah atap sekolah sederhana resmi dimulai.",
        ],
      },
      {
        number: 2,
        title: "Bab 2: Sepeda Tua dan Jarak Empat Puluh Kilometer",
        startPage: 9,
        paragraphs: [
          "Lintang adalah teman sebangkuku yang memiliki semangat belajar luar biasa. Setiap subuh ketika langit masih gelap gulita, ia sudah mengayuh sepeda besar peninggalan kakeknya menembus hutan bakau dan rawa-rawa menuju sekolah.",
          "Meskipun tangannya kapalan dan bajunya sering basah terkena embun pagi, Lintang tidak pernah sekalipun datang terlambat. Baginya, setiap halaman buku di perpustakaan sekolah adalah jendela menuju dunia ilmu pengetahuan yang luas.",
          "Saat jam istirahat, kami sering duduk di bawah pohon filicium tua sambil melakukan observasi terhadap serangga dan daun-daun yang melakukan fotosintesis di bawah terik matahari pulau. Lintang selalu bisa menjelaskan fenomena alam dengan mata berbinar.",
          "Dari Lintang aku belajar satu hal penting: ilmu pengetahuan tidak memilih siapa yang paling kaya, melainkan siapa yang paling tekun bertanya dan tidak mudah menyerah.",
        ],
      },
      {
        number: 3,
        title: "Bab 3: Pelangi Setelah Hujan Deras",
        startPage: 17,
        paragraphs: [
          "Ketika musim hujan tiba, kami harus menggeser bangku-bangku agar tidak terkena tetesan air dari atap yang bocor. Namun anehnya, tidak ada satu pun dari kami yang mengeluh atau meminta pulang lebih cepat.",
          "Ibu Muslimah menamakan kelompok kecil kami sebagai Laskar Pelangi, karena kami selalu gembira menyambut lengkungan warna-warni di langit setiap kali hujan reda di atas pohon-pohon kelapa.",
          "Kami berjanji bahwa kelak ketika dewasa, kami akan kembali membangun perpustakaan dan laboratorium sains terbaik untuk adik-adik kelas di pulau tercinta ini.",
        ],
      },
    ],
  },
  {
    id: "misteri-ekosistem-laut",
    title: "Eksplorasi Sains: Rahasia Ekosistem Laut Indonesia",
    author: "Dr. Pratiwi Sudarmono & Tim Sains",
    publisher: "Balai Pustaka Edukasi",
    publishedYear: 2024,
    isbn: "978-602-427-311-5",
    coverUrl:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80",
    category: "sains",
    gradeLevel: "SMP",
    progressPercent: 30,
    currentPage: 7,
    totalPages: 24,
    estimatedReadMinutes: 35,
    vocabularyLevel: "Ilmiah Populer (SMP)",
    sourceType: "bse",
    isFeatured: true,
    isSaved: true,
    synopsis:
      "Selami keindahan Segitiga Terumbu Karang dunia yang berada tepat di perairan Nusantara! Buku ini menjelaskan bagaimana terumbu karang, hutan mangrove, dan arus laut bekerja sama menjaga keseimbangan iklim bumi.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Jantung Segitiga Karang Dunia",
        startPage: 1,
        paragraphs: [
          "Tahukah kamu bahwa perairan Nusantara menyimpan lebih dari tujuh puluh lima persen spesies karang yang ada di seluruh permukaan bumi? Wilayah ini dikenal oleh para ilmuwan dunia sebagai Coral Triangle atau Segitiga Terumbu Karang.",
          "Di dalam ekosistem laut dangkal yang jernih, alga mikroskopis hidup berdampingan di dalam jaringan karang dan melakukan fotosintesis untuk menghasilkan oksigen serta nutrisi penting bagi ribuan jenis ikan karang.",
          "Melalui observasi bawah air di Raja Ampat dan Wakatobi, para peneliti menemukan bahwa terumbu karang yang sehat mampu meredam kekuatan gelombang pasang hingga sembilan puluh persen sebelum mencapai pantai.",
        ],
      },
      {
        number: 2,
        title: "Bab 2: Penjaga Pesisir Bernama Hutan Bakau",
        startPage: 12,
        paragraphs: [
          "Sebelum air sungai bermuara ke laut lepas, akar-akar pohon bakau yang rapat menyaring lumpur dan polutan secara alami. Hutan bakau juga menjadi tempat bermain yang aman bagi anak-anak ikan sebelum mereka berenang ke samudra.",
          "Gaya gravitasi bulan dan matahari menciptakan pasang surut air laut yang secara teratur membawa nutrisi baru ke sela-sela akar bakau setiap harinya.",
        ],
      },
    ],
  },
  {
    id: "jejak-rempah-nusantara",
    title: "Jejak Kapal Pinisi & Jalur Rempah Nusantara",
    author: "Prof. Bambang Purwanto",
    publisher: "Kemendikbudristek RI",
    publishedYear: 2023,
    isbn: "978-602-244-890-1",
    coverUrl:
      "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80",
    category: "sejarah",
    gradeLevel: "SMA",
    progressPercent: 100,
    currentPage: 30,
    totalPages: 30,
    estimatedReadMinutes: 50,
    vocabularyLevel: "Lanjutan (SMA)",
    sourceType: "bse",
    isFeatured: true,
    isSaved: false,
    synopsis:
      "Mengungkap bagaimana cengkeh dari Maluku, pala dari Banda, dan lada dari Sumatera menggerakkan peradaban maritim dunia jauh sebelum era industri modern dimulai.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Aroma Cengkeh yang Mengubah Peta Dunia",
        startPage: 1,
        paragraphs: [
          "Berabad-abad silam, para pelaut tangguh Nusantara telah mengarungi samudra dengan membaca rasi bintang dan arah angin muson. Budaya maritim bukanlah hal asing bagi nenek moyang kita, melainkan nadi utama yang menyatukan peradaban.",
          "Pelabuhan-pelabuhan kuno di sepanjang pesisir Jawa, Sumatera, dan Maluku menjadi titik temu pertukaran ilmu pengetahuan, bahasa, serta komoditas berharga.",
        ],
      },
    ],
  },
  {
    id: "komik-detektif-pecahan",
    title: "Komik Sains: Petualangan Detektif Angka & Gravitasi",
    author: "Kak Riko & Studio Nusantara",
    publisher: "Pustaka Cilik Mandiri",
    publishedYear: 2025,
    isbn: "978-623-881-102-4",
    coverUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
    category: "komik",
    gradeLevel: "SD",
    progressPercent: 0,
    currentPage: 1,
    totalPages: 18,
    estimatedReadMinutes: 20,
    vocabularyLevel: "Mudah & Bergambar (SD)",
    sourceType: "internal",
    isFeatured: true,
    isSaved: true,
    synopsis:
      "Mengapa buah mangga selalu jatuh ke bawah dan tidak terbang ke awan? Ikuti serunya Dika dan robot kucingnya memecahkan teka-teki fisika dan matematika lewat cerita bergambar penuh warna!",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Teka-Teki Mangga Jatuh di Kebun Kakek",
        startPage: 1,
        paragraphs: [
          "Siang itu udara sangat sejuk di kebun belakang rumah Kakek. Dika sedang duduk membaca buku cerita sambil ditemani Koko, kucing pintar kesayangannya.",
          "Pluk! Sebuah mangga harum manis yang matang tiba-tiba jatuh tepat di samping keranjang bambu. 'Wah, kenapa mangga selalu jatuh ke tanah ya, Kek? Kenapa tidak melayang ke atas awan?' tanya Dika penasaran.",
          "Kakek tersenyum sambil membelah mangga tersebut. 'Itu karena bumi kita memiliki kekuatan tak terlihat yang disebut gravitasi, Dika. Bumi menarik semua benda agar tetap berpijak dengan aman!'",
          "Dika langsung membuka buku catatannya untuk melakukan observasi sederhana: menjatuhkan bola kasti dan selembar daun kering secara bersamaan.",
        ],
      },
    ],
  },
  {
    id: "bumi-manusia-ringkas",
    title: "Apresiasi Sastra Indonesia: Suara dari Balik Pena",
    author: "Tim Kurasi Guru Bahasa Indonesia",
    publisher: "Perpustakaan Sekolah Internal",
    publishedYear: 2024,
    isbn: "978-602-991-004-2",
    coverUrl:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80",
    category: "fiksi",
    gradeLevel: "SMA",
    progressPercent: 0,
    currentPage: 1,
    totalPages: 40,
    estimatedReadMinutes: 60,
    vocabularyLevel: "Sastra (SMA)",
    sourceType: "internal",
    isFeatured: true,
    synopsis:
      "Kumpulan esai dan cerita pendek pilihan karya siswa serta sastrawan Indonesia yang membahas pentingnya menulis sebagai cara merawat ingatan bangsa.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Menulis Adalah Bekerja untuk Keabadian",
        startPage: 1,
        paragraphs: [
          "Setiap generasi memiliki ceritanya sendiri. Melalui tulisan, pikiran dan perasaan manusia dapat melintasi batas ruang serta waktu, menyapa pembaca puluhan tahun di masa depan.",
        ],
      },
    ],
  },
  {
    id: "eksperimen-botani-rumah",
    title: "Laboratorium Hijau: 20 Eksperimen Fotosintesis di Rumah",
    author: "Ibu Ratna Sari, M.Pd.",
    publisher: "Penerbit Sains Muda",
    publishedYear: 2024,
    isbn: "978-623-112-409-8",
    coverUrl:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80",
    category: "sains",
    gradeLevel: "SD",
    progressPercent: 100,
    currentPage: 20,
    totalPages: 20,
    estimatedReadMinutes: 25,
    vocabularyLevel: "Mudah (SD Kelas 4-6)",
    sourceType: "internal",
    isFeatured: true,
    synopsis:
      "Panduan langkah demi langkah melakukan percobaan biologi yang aman dan seru hanya dengan bahan-bahan dapur serta tanaman di halaman rumahmu.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Melihat Gelembung Oksigen pada Daun Air",
        startPage: 1,
        paragraphs: [
          "Pernahkah kamu melihat tumbuhan bernapas? Hari ini kita akan membuktikan bahwa daun yang terkena sinar matahari menghasilkan gelembung oksigen segar lewat proses fotosintesis!",
        ],
      },
    ],
  },
  {
    id: "cerita-rakyat-timun-mas",
    title: "Dongeng Nusantara: Keberanian Timun Mas & Raksasa",
    author: "Balai Bahasa Kemendikbud",
    publisher: "BSE Kemendikbudristek",
    publishedYear: 2023,
    isbn: "978-602-119-082-1",
    coverUrl:
      "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80",
    category: "fiksi",
    gradeLevel: "SD",
    progressPercent: 0,
    currentPage: 1,
    totalPages: 16,
    estimatedReadMinutes: 15,
    vocabularyLevel: "Mudah (SD)",
    sourceType: "bse",
    synopsis:
      "Kisah klasik dari Jawa Tengah yang mengajarkan kecerdikan, keberanian, dan kasih sayang seorang ibu bernama Mbok Srini kepada putrinya.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Biji Mentimun Emas di Ladang",
        startPage: 1,
        paragraphs: [
          "Di sebuah desa yang subur di kaki gunung, hiduplah Mbok Srini yang rajin bekerja di ladang setiap pagi bersama kicauan burung-burung.",
        ],
      },
    ],
  },
  {
    id: "astronomi-langit-khatulistiwa",
    title: "Menatap Bintang dari Garis Khatulistiwa",
    author: "Dr. Karlina Supelli & Rekan",
    publisher: "Observatorium Bosscha Press",
    publishedYear: 2024,
    isbn: "978-602-772-910-3",
    coverUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    category: "sains",
    gradeLevel: "SMA",
    progressPercent: 0,
    currentPage: 1,
    totalPages: 36,
    estimatedReadMinutes: 55,
    vocabularyLevel: "Menengah - Atas (SMP/SMA)",
    sourceType: "bse",
    synopsis:
      "Keistimewaan posisi geografis Indonesia di garis ekuator memungkinkan kita mengamati rasi bintang belahan langit utara sekaligus selatan sepanjang tahun.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Kompas Bintang Para Pelaut Bugis",
        startPage: 1,
        paragraphs: [
          "Jauh sebelum kompas magnetik ditemukan, masyarakat maritim di Nusantara menggunakan gugusan bintang Pari atau Crux untuk menentukan arah selatan dengan presisi tinggi.",
        ],
      },
    ],
  },
  {
    id: "biografi-ki-hajar-dewantara",
    title: "Taman Siswa: Kisah Perjuangan Ki Hajar Dewantara",
    author: "Tim Museum Kebangkitan Nasional",
    publisher: "Pusat Kurikulum & Perbukuan",
    publishedYear: 2023,
    isbn: "978-602-881-553-9",
    coverUrl:
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80",
    category: "sejarah",
    gradeLevel: "SMP",
    progressPercent: 100,
    currentPage: 28,
    totalPages: 28,
    estimatedReadMinutes: 40,
    vocabularyLevel: "Menengah (SMP)",
    sourceType: "bse",
    synopsis:
      "Memahami makna filosofi Ing Ngarso Sung Tulodo, Ing Madyo Mangun Karso, Tut Wuri Handayani dari perjalanan hidup Bapak Pendidikan Nasional Indonesia.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Pendidikan sebagai Taman yang Membahagiakan",
        startPage: 1,
        paragraphs: [
          "Ki Hajar Dewantara memilih kata 'Taman' untuk sekolah yang beliau dirikan karena taman adalah tempat bermain dan bertumbuh yang menyenangkan bagi anak-anak.",
        ],
      },
    ],
  },
  {
    id: "komik-pahlawan-cilik-sampah",
    title: "Komik Hijau: Pasukan Cilik Penyelamat Sungai",
    author: "Studio Kreasi Edukasi",
    publisher: "Kemendikbudristek",
    publishedYear: 2025,
    isbn: "978-623-550-192-0",
    coverUrl:
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80",
    category: "komik",
    gradeLevel: "SD",
    progressPercent: 0,
    currentPage: 1,
    totalPages: 22,
    estimatedReadMinutes: 18,
    vocabularyLevel: "Mudah (SD)",
    sourceType: "bse",
    synopsis:
      "Lima sekawan mengubah sampah botol plastik di tepi sungai menjadi kebun hidroponik vertikal di halaman sekolah mereka.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Misi Hari Sabtu Pagi",
        startPage: 1,
        paragraphs: [
          "Hari Sabtu pagi, Rani dan teman-temannya membawa kantong pilah sampah menuju taman di belakang sekolah untuk menjaga ekosistem sungai tetap bersih.",
        ],
      },
    ],
  },
  {
    id: "sejarah-kereta-api-jawa",
    title: "Rel-Rel Tua: Sejarah Transportasi Kereta di Nusantara",
    author: "Arsip Nasional Republik Indonesia",
    publisher: "Balai Pustaka",
    publishedYear: 2023,
    isbn: "978-602-331-771-2",
    coverUrl:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80",
    category: "sejarah",
    gradeLevel: "SMA",
    progressPercent: 0,
    currentPage: 1,
    totalPages: 34,
    estimatedReadMinutes: 45,
    vocabularyLevel: "Menengah - Atas (SMA)",
    sourceType: "bse",
    synopsis:
      "Menelusuri pembangunan jalur kereta api pertama dari Stasiun Samarang NIS menuju Tanggung pada abad ke-19 dan dampaknya bagi mobilitas masyarakat.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Peluit Uap Pertama di Tanah Jawa",
        startPage: 1,
        paragraphs: [
          "Deru lokomotif uap pertama kali memecah keheningan pagi di Semarang pada tahun 1867, menandai babak baru konektivitas darat di pulau Jawa.",
        ],
      },
    ],
  },
  {
    id: "antologi-puisi-hujan",
    title: "Hujan Bulan Juni & Puisi-Puisi Pilihan Pelajar",
    author: "Sapardi Djoko Damono (Edisi Kurasi Sekolah)",
    publisher: "Gramedia & Pusbuk",
    publishedYear: 2023,
    isbn: "978-602-031-843-1",
    coverUrl:
      "https://images.unsplash.com/photo-1507842229356-51c61504d3ab?auto=format&fit=crop&w=600&q=80",
    category: "fiksi",
    gradeLevel: "SMP",
    progressPercent: 0,
    currentPage: 1,
    totalPages: 26,
    estimatedReadMinutes: 30,
    vocabularyLevel: "Puitis & Mudah Dipahami",
    sourceType: "bse",
    synopsis:
      "Kumpulan puisi lirih yang mengajak siswa merasakan keindahan bahasa Indonesia melalui metafora alam, hujan, dan ketabahan hati.",
    chapters: [
      {
        number: 1,
        title: "Bab 1: Tak Ada yang Lebih Tabah",
        startPage: 1,
        paragraphs: [
          "Puisi mengajarkan kita untuk memperhatikan hal-hal kecil di sekitar kita dengan penuh empati: rintik hujan yang jatuh ke akar pohon, atau angin sore yang menyapu halaman sekolah.",
        ],
      },
    ],
  },
];

export const STUDENT_PROFILE_MOCK = {
  name: "Siswa",
  nisn: "",
  nisnHash: "",
  grade: "SMP" as "SD" | "SMP" | "SMA",
  className: "Kelas Umum",
  schoolName: "SMP Negeri 1 Nusantara",
  avatarId: "pelajar-1",
  stats: {
    streakDays: 0,
    booksCompleted: 0,
    minutesReadThisWeek: 0,
    weeklyGoalMinutes: 45,
  },
};

export const ADMIN_ANALYTICS_MOCK = {
  summaryMetrics: {
    activeReadersCount: 342,
    totalStudentsCount: 480,
    avgReadingMinutesPerStudent: 24,
    mostPopularCategory: "Fiksi & Sastra",
    warPercentage: 71.2,
    neonComputeHoursUsed: 4.2,
    neonComputeHoursLimit: 10.0,
    r2StorageUsedGb: 3.8,
    r2StorageLimitGb: 10.0,
  },
  weeklyTrend: [
    { week: "Minggu 1", war: 195, booksCompleted: 42 },
    { week: "Minggu 2", war: 240, booksCompleted: 58 },
    { week: "Minggu 3", war: 289, booksCompleted: 81 },
    { week: "Minggu 4 (Saat Ini)", war: 342, booksCompleted: 114 },
  ],
  classParticipation: [
    { className: "Kelas 8A", activePercentage: 88, totalStudents: 32, activeStudents: 28, avgMinutes: 31 },
    { className: "Kelas 7B", activePercentage: 81, totalStudents: 32, activeStudents: 26, avgMinutes: 27 },
    { className: "Kelas 8B", activePercentage: 75, totalStudents: 32, activeStudents: 24, avgMinutes: 22 },
    { className: "Kelas 7A", activePercentage: 69, totalStudents: 32, activeStudents: 22, avgMinutes: 19 },
    { className: "Kelas 9A", activePercentage: 53, totalStudents: 32, activeStudents: 17, avgMinutes: 14 },
    { className: "Kelas 9B", activePercentage: 47, totalStudents: 32, activeStudents: 15, avgMinutes: 12 },
  ],
  topBooks: [
    {
      id: "laskar-pelangi",
      title: "Laskar Pelangi: Jejak Mimpi Anak Pulau",
      category: "Fiksi & Sastra",
      readCount: 184,
      completionRate: 78,
      dropoutRate: 14,
    },
    {
      id: "misteri-ekosistem-laut",
      title: "Eksplorasi Sains: Rahasia Ekosistem Laut Indonesia",
      category: "Sains & Alam",
      readCount: 142,
      completionRate: 71,
      dropoutRate: 18,
    },
    {
      id: "biografi-ki-hajar-dewantara",
      title: "Taman Siswa: Kisah Perjuangan Ki Hajar Dewantara",
      category: "Sejarah Nusantara",
      readCount: 119,
      completionRate: 84,
      dropoutRate: 9,
    },
    {
      id: "komik-detektif-pecahan",
      title: "Komik Sains: Petualangan Detektif Angka & Gravitasi",
      category: "Komik Edukasi",
      readCount: 98,
      completionRate: 91,
      dropoutRate: 5,
    },
  ],
  aiReadingInsights: [
    "Perhatian: 15 siswa di Kelas 9B belum membuka buku wajib semester ini selama lebih dari 14 hari.",
    "Tren Positif: Weekly Active Readers (WAR) meningkat +18.3% sejak buku Komik Sains & Ekosistem Laut diterbitkan.",
    "Deteksi Dropout: Buku 'Rel-Rel Tua: Sejarah Transportasi Kereta' memiliki rata-rata pemberhentian di halaman 8 (23%). Disarankan diskusi pengantar oleh guru di kelas.",
  ],
  studentListSample: [
    { nisnHash: "8f9d...3a1b", fullName: "Budi Santoso", className: "8A", booksRead: 5, minutesWeek: 35, lastActive: "Hari ini, 10:15", status: "Aktif" },
    { nisnHash: "4c2e...9b0d", fullName: "Siti Aminah", className: "8A", booksRead: 7, minutesWeek: 62, lastActive: "Hari ini, 09:40", status: "Aktif" },
    { nisnHash: "1a7f...6e2c", fullName: "Rizky Pratama", className: "7B", booksRead: 4, minutesWeek: 28, lastActive: "Kemarin", status: "Aktif" },
    { nisnHash: "9d3b...0f4a", fullName: "Dewi Lestari", className: "9A", booksRead: 2, minutesWeek: 15, lastActive: "2 hari lalu", status: "Aktif" },
    { nisnHash: "5e8c...2d7f", fullName: "Dimas Anggara", className: "9B", booksRead: 0, minutesWeek: 0, lastActive: "16 hari lalu", status: "Perlu Perhatian" },
  ],
};

