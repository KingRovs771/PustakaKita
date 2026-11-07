"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ArrowUpDown,
  Sparkles,
  LogIn,
  Search,
  Library,
} from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { Bookshelf } from "@/components/Bookshelf";
import { CategoryFilter } from "@/components/CategoryFilter";
import { BookCard } from "@/components/BookCard";
import { BookDetailModal } from "@/components/BookDetailModal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLibrary } from "@/context/LibraryContext";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { books, categories, schoolProfile } = useLibrary();
  const { isLowBandwidth } = usePerformanceMode();

  const initialCat = searchParams.get("cat") || "semua";
  const initialGrade =
    (searchParams.get("grade") as "ALL" | "SD" | "SMP" | "SMA") || "ALL";
  const bookModalParam = searchParams.get("book");

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedGrade, setSelectedGrade] = useState<
    "ALL" | "SD" | "SMP" | "SMA"
  >(initialGrade);
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "fastest">(
    "popular"
  );
  const [selectedBookId, setSelectedBookId] = useState<string | null>(
    bookModalParam
  );

  // Buku terakhir yang sedang dibaca untuk Banner "Lanjutkan Membaca"
  const activeReadingBook = useMemo(
    () =>
      books.find(
        (b) => (b.progressPercent ?? 0) > 0 && (b.progressPercent ?? 0) < 100
      ),
    [books]
  );

  // Hitung jumlah buku per kategori secara dinamis dari database & context
  const categoriesWithCounts = useMemo(() => {
    const allItem = {
      id: "semua",
      label: "Semua Buku",
      iconName: "Library",
      count: books.length,
      colorClass: "bg-primary text-primary-foreground",
    };

    const dynamicItems = categories.map((c) => {
      const count = books.filter(
        (b) =>
          b.category?.toLowerCase() === c.name.toLowerCase() ||
          b.category?.toLowerCase() === c.id.toLowerCase()
      ).length;
      return {
        id: c.name.toLowerCase(),
        label: c.name,
        iconName: c.icon || "BookOpen",
        count,
        colorClass: "border-primary/40 text-foreground bg-card",
      };
    });

    return [allItem, ...dynamicItems];
  }, [books, categories]);

  // Filter & Sort Katalog Utama
  const filteredBooks = useMemo(() => {
    const list = books.filter((book) => {
      const matchCat =
        selectedCategory === "semua" ||
        book.category.toLowerCase() === selectedCategory.toLowerCase() ||
        selectedCategory.toLowerCase().includes(book.category.toLowerCase());
      const matchGrade =
        selectedGrade === "ALL" || book.gradeLevel === selectedGrade;
      return matchCat && matchGrade;
    });

    if (sortBy === "newest") {
      return [...list].sort((a, b) => b.publishedYear - a.publishedYear);
    }
    if (sortBy === "fastest") {
      return [...list].sort(
        (a, b) => a.estimatedReadMinutes - b.estimatedReadMinutes
      );
    }
    return list;
  }, [books, selectedCategory, selectedGrade, sortBy]);

  const featuredBooks = useMemo(() => {
    const featured = books.filter((b) => b.isFeatured);
    return (featured.length > 0 ? featured : books).slice(0, 4);
  }, [books]);

  const selectedBookObject = useMemo(
    () => books.find((b) => b.id === selectedBookId) || null,
    [books, selectedBookId]
  );

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const params = new URLSearchParams(searchParams.toString());
    if (catId === "semua") {
      params.delete("cat");
    } else {
      params.set("cat", catId);
    }
    router.replace(`/library?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-14">
      <AppNavigation />

      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10"
      >
        {/* Header Katalog Rak Buku Profesional */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Library className="h-3.5 w-3.5" />
              <span>Katalog Perpustakaan • {schoolProfile.schoolName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Koleksi & Rekomendasi Buku Siswa
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              {schoolProfile.motto} — Pilih buku bacaan sesuai jenjang kelas dan minatmu.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push("/search")}
            className="gap-2 font-semibold text-xs sm:text-sm h-10 shrink-0 self-start md:self-auto"
          >
            <Search className="h-4 w-4 text-primary" />
            <span>Pencarian Cepat (Ctrl + K)</span>
          </Button>
        </div>

        {/* 1. Banner Kondisional "Lanjutkan Membaca" */}
        {activeReadingBook && (
          <section
            aria-label="Lanjutkan Membaca"
            className="rounded-2xl bg-gradient-to-r from-primary/15 via-secondary/80 to-card border border-primary/25 p-4 sm:px-6 sm:py-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Lanjutkan Membaca
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    • Hal. {activeReadingBook.currentPage} dari{" "}
                    {activeReadingBook.totalPages} (
                    {activeReadingBook.progressPercent}%)
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {activeReadingBook.title}
                </h2>
                <Progress
                  value={activeReadingBook.progressPercent}
                  className="h-1.5 mt-1.5 max-w-md bg-secondary [&>div]:bg-accent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() =>
                  router.push(
                    `/read/${activeReadingBook.id}?page=${activeReadingBook.currentPage}`
                  )
                }
                className="w-full sm:w-auto font-bold gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Lanjut Halaman {activeReadingBook.currentPage}
              </Button>
            </div>
          </section>
        )}

        {/* 2. Section Rekomendasi Buku Pilihan (Desain Pedestal SIBI Kemendikdasmen) */}
        {featuredBooks.length > 0 && (
          <Bookshelf
            books={featuredBooks}
            shelfTitle="Rekomendasi Buku Pilihan"
            isLowBandwidth={isLowBandwidth}
            onBookClick={(id) => setSelectedBookId(id)}
          />
        )}

        {/* 3. Sticky Filter Bar & Pengurut Katalog */}
        <section aria-labelledby="catalog-heading" className="space-y-6">
          <div className="sticky top-16 z-20 -mx-4 px-4 py-3.5 bg-background/95 backdrop-blur-md border-b border-border space-y-3">
            <CategoryFilter
              categories={categoriesWithCounts}
              selectedCategory={selectedCategory}
              selectedGrade={selectedGrade}
              onSelectCategory={handleCategoryChange}
              onSelectGrade={setSelectedGrade}
            />

            <div className="flex items-center justify-between pt-1">
              <h2
                id="catalog-heading"
                className="text-base sm:text-lg font-extrabold text-foreground"
              >
                Rekomendasi Buku Lainnya{" "}
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground ml-1">
                  ({filteredBooks.length} judul)
                </span>
              </h2>

              <div className="flex items-center gap-2">
                <ArrowUpDown
                  className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline"
                  aria-hidden="true"
                />
                <label htmlFor="sort-select" className="sr-only">
                  Urutkan Buku
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "popular" | "newest" | "fastest"
                    )
                  }
                  className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="popular">Urutkan: Terpopuler</option>
                  <option value="newest">Urutkan: Terbaru Terbit</option>
                  <option value="fastest">Urutkan: Waktu Baca Tercepat</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Katalog Grid Utama (4 Kolom Proporsional ala Kemendikdasmen) */}
          {books.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
                <BookOpen className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Koleksi Buku Sedang Disiapkan
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Perpustakaan digital sekolah sedang dalam proses persiapan koleksi bacaan berkualitas. Silakan periksa kembali dalam waktu dekat atau gunakan fitur pencarian materi.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => router.push("/search")}
                  className="font-bold gap-2 text-xs sm:text-sm h-10"
                >
                  <Search className="h-4 w-4" />
                  Jelajahi Pencarian Materi
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="text-xs sm:text-sm h-10 gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Periksa Pembaruan
                </Button>
              </div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center space-y-3">
              <Sparkles className="h-8 w-8 text-accent mx-auto" />
              <h3 className="text-lg font-bold text-foreground">
                Belum ada buku di kombinasi filter ini
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Yuk, pilih kategori &quot;Semua Buku&quot; atau ganti filter jenjang sekolah
                untuk melihat koleksi lainnya!
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  handleCategoryChange("semua");
                  setSelectedGrade("ALL");
                }}
              >
                Tampilkan Semua Buku
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 pt-2">
              {filteredBooks.map((book) => (
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

      {/* Modal / Drawer Detail Buku */}
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

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-sm font-semibold text-muted-foreground">
          Sedang menyiapkan rak bukumu...
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
