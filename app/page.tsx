"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Sparkles,
  Atom,
  Compass,
  Smile,
  ArrowRight,
  WifiOff,
  Type,
  Volume2,
  Award,
  LogIn,
  LayoutDashboard,
  CheckCircle2,
  Library,
} from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { BookCard } from "@/components/BookCard";
import { BookDetailModal } from "@/components/BookDetailModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLibrary } from "@/context/LibraryContext";

function getCategoryIcon(iconName: string) {
  switch (iconName) {
    case "Sparkles":
      return Sparkles;
    case "Atom":
      return Atom;
    case "Compass":
      return Compass;
    case "Smile":
      return Smile;
    default:
      return BookOpen;
  }
}

export default function HomePage() {
  const router = useRouter();
  const { books, categories, student, schoolProfile } = useLibrary();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const isLoggedIn = !student.isGuest && Boolean(student.nisn);

  const featuredBooks = useMemo(() => {
    const featured = books.filter((b) => b.isFeatured);
    return (featured.length > 0 ? featured : books).slice(0, 4);
  }, [books]);

  const selectedBookObject = useMemo(
    () => books.find((b) => b.id === selectedBookId) || null,
    [books, selectedBookId]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <AppNavigation />

      <main id="main-content" className="flex-1">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-secondary/40 to-background py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Kolom Kiri: Headline & CTA */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Perpustakaan Digital • {schoolProfile.schoolName}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                  Buka Jendela Dunia Lewat{" "}
                  <span className="text-primary">Bacaan Terbaik</span> Setiap Hari
                </h1>

                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  Jelajahi koleksi buku cerita sastra, eksperimen sains, sejarah
                  Nusantara, hingga komik edukasi untuk jenjang SD, SMP, dan SMA.
                  Dirancang nyaman di mata, hemat kuota, dan tetap bisa dibaca
                  tanpa koneksi internet.
                </p>

                {/* Tombol Aksi Utama */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    size="lg"
                    onClick={() => router.push("/library")}
                    className="font-bold gap-2 h-12 px-6 rounded-xl text-sm shadow-sm"
                  >
                    <BookOpen className="h-4 w-4" />
                    Jelajahi Katalog Buku
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  {!isLoggedIn ? (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push("/login")}
                      className="font-bold gap-2 h-12 px-6 rounded-xl text-sm bg-card"
                    >
                      <LogIn className="h-4 w-4 text-primary" />
                      Masuk dengan NISN
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      className="font-bold gap-2 h-12 px-6 rounded-xl text-sm bg-card"
                    >
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      Buka Rak Bacaku
                    </Button>
                  )}
                </div>

                {/* Pintasan Filter Jenjang Sekolah */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">
                    Pilih Jenjang Cepat:
                  </span>
                  {(
                    [
                      { id: "SD", label: "Sekolah Dasar (SD)", variant: "sd" as const },
                      { id: "SMP", label: "SMP / MTs", variant: "smp" as const },
                      { id: "SMA", label: "SMA / SMK", variant: "sma" as const },
                    ]
                  ).map((g) => (
                    <Link
                      key={g.id}
                      href={`/library?grade=${g.id}`}
                      className="transition-transform hover:-translate-y-0.5"
                    >
                      <Badge
                        variant={g.variant}
                        className="px-3 py-1 text-xs font-bold cursor-pointer"
                      >
                        {g.label}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Kolom Kanan: Kartu Sorotan Fitur Literasi */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-xs p-5 sm:p-6 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Library className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-foreground">
                          Pengalaman Baca Nyaman
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Dirancang khusus untuk pelajar Indonesia
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-[11px]">
                      Bebas Iklan
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-secondary/40 p-3.5 space-y-1.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Type className="h-4 w-4" />
                      </div>
                      <h3 className="text-xs font-bold text-foreground">
                        Ramah Mata & Disleksia
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Pilihan kertas siang, senja sepia, mode malam, serta huruf Lexend.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/40 p-3.5 space-y-1.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <Volume2 className="h-4 w-4" />
                      </div>
                      <h3 className="text-xs font-bold text-foreground">
                        Kamus & Baca Suara
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Klik istilah sulit untuk arti kata instan atau dengarkan narasi buku.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/40 p-3.5 space-y-1.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <WifiOff className="h-4 w-4" />
                      </div>
                      <h3 className="text-xs font-bold text-foreground">
                        Bisa Dibaca Offline
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Buku tersimpan otomatis di perangkat, tetap lancar tanpa kuota.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/40 p-3.5 space-y-1.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
                        <Award className="h-4 w-4" />
                      </div>
                      <h3 className="text-xs font-bold text-foreground">
                        Jurnal & Lencana Baca
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Capai target baca mingguan dan kumpulkan lencana apresiasi.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      Ingin mencari topik pelajaran tertentu?
                    </span>
                    <Link
                      href="/search"
                      className="font-bold text-primary hover:underline shrink-0 ml-2"
                    >
                      Buka Pencarian →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Section Eksplorasi Kategori Buku */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Jelajahi Kategori Bacaan
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Pilih topik bacaan yang paling menarik minatmu hari ini
              </p>
            </div>
            <Link
              href="/library"
              className="text-xs sm:text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Lihat Semua Kategori</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const IconComponent = getCategoryIcon(cat.icon);
              const count = books.filter(
                (b) =>
                  b.category?.toLowerCase() === cat.name.toLowerCase() ||
                  b.category?.toLowerCase() === cat.id.toLowerCase()
              ).length;

              return (
                <Link
                  key={cat.id}
                  href={`/library?cat=${encodeURIComponent(cat.id.toLowerCase())}`}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md flex flex-col justify-between gap-4"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: cat.colorHex || "#0F766E" }}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {count} Buku Tersedia
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 3. Section Koleksi Buku Pilihan */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Koleksi Buku Pilihan
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Rekomendasi bacaan seru untuk menemani waktu belajar dan istirahatmu
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/library")}
              className="w-fit gap-1.5 text-xs font-bold"
            >
              <span>Buka Katalog Lengkap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {featuredBooks.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
                <BookOpen className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Koleksi Buku Sedang Disiapkan
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Perpustakaan digital sekolah sedang menyiapkan daftar bacaan terbaru. Silakan buka halaman katalog atau gunakan fitur pencarian materi.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => router.push("/library")}
                  className="font-bold gap-2 text-xs sm:text-sm h-10"
                >
                  <BookOpen className="h-4 w-4" />
                  Buka Rak Buku
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/search")}
                  className="text-xs sm:text-sm h-10 gap-2"
                >
                  <Search className="h-4 w-4" />
                  Cari Topik Materi
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {featuredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  {...book}
                  onSelect={(id) => setSelectedBookId(id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer Resmi PustakaKita */}
      <footer className="border-t border-border bg-card/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground">PustakaKita</span>
            <span>• {schoolProfile.schoolName} ({schoolProfile.academicYear})</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-semibold">
            <Link href="/" className="hover:text-foreground transition-colors">
              Beranda
            </Link>
            <Link href="/library" className="hover:text-foreground transition-colors">
              Rak Buku
            </Link>
            <Link href="/search" className="hover:text-foreground transition-colors">
              Pencarian
            </Link>
            {!isLoggedIn ? (
              <Link href="/login" className="hover:text-foreground transition-colors">
                Masuk Siswa
              </Link>
            ) : (
              <Link href="/settings" className="hover:text-foreground transition-colors">
                Profil Saya
              </Link>
            )}
          </div>
        </div>
      </footer>

      {/* Modal Detail Buku */}
      <BookDetailModal
        book={selectedBookObject}
        open={!!selectedBookObject}
        onOpenChange={(open) => {
          if (!open) setSelectedBookId(null);
        }}
      />
    </div>
  );
}
