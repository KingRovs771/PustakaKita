"use client";

import React, { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { Search as SearchIcon, X, Sparkles, Compass } from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { BookCard } from "@/components/BookCard";
import { BookDetailModal } from "@/components/BookDetailModal";
import { Input } from "@/components/ui/input";
import { useLibrary } from "@/context/LibraryContext";

const POPULAR_KEYWORDS = [
  "Cerita Rakyat",
  "Eksperimen Sains",
  "Biografi Pahlawan",
  "Komik Matematika",
  "Ekosistem Laut",
  "Laskar Pelangi",
];

export default function SearchPage() {
  const { books } = useLibrary();
  const [query, setQuery] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Client-Side Fuzzy Search via Fuse.js (< 15ms tanpa beban server DB - Section 5.g DESIGN.md)
  const fuse = useMemo(
    () =>
      new Fuse(books, {
        keys: [
          { name: "title", weight: 0.5 },
          { name: "author", weight: 0.25 },
          { name: "synopsis", weight: 0.15 },
          { name: "category", weight: 0.1 },
        ],
        threshold: 0.38,
        includeScore: true,
      }),
    [books]
  );

  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return books;
    return fuse.search(trimmed).map((res) => res.item);
  }, [query, books, fuse]);

  const fallbackScienceBooks = useMemo(
    () =>
      books
        .filter((b) => b.category === "sains" || b.category === "komik")
        .slice(0, 4),
    [books]
  );

  const selectedBook = books.find((b) => b.id === selectedBookId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-12">
      <AppNavigation />

      <main
        id="main-content"
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        {/* Header Pencarian Besar (Section 5.g DESIGN.md) */}
        <section className="max-w-2xl mx-auto space-y-4 text-center">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground">
            Cari Buku & Topik Pelajaran
          </h1>
          <p className="text-sm text-muted-foreground">
            Ketik judul cerita, nama pengarang, atau topik sains yang ingin kamu
            pelajari hari ini.
          </p>

          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: ekosistem laut, komik gravitasi, laskar pelangi..."
              className="h-14 pl-12 pr-12 rounded-2xl text-base shadow-sm border-border focus-visible:ring-primary"
              aria-label="Kotak pencarian buku"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-secondary text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Chip Saran Kata Kunci Populer */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Populer:
            </span>
            {POPULAR_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => setQuery(kw)}
                className="rounded-full bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors min-h-[36px]"
              >
                {kw}
              </button>
            ))}
          </div>
        </section>

        {/* Hasil Pencarian atau Empty / Zero Result State yang Ramah */}
        {books.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
              <Compass className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Koleksi Buku Sedang Disiapkan
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                Katalog perpustakaan digital sedang dalam proses penyiapan oleh pihak sekolah. Silakan kembali lagi nanti untuk menjelajahi materi bacaan.
              </p>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                {query.trim()
                  ? `Ditemukan ${searchResults.length} buku untuk "${query}"`
                  : `Semua Koleksi Buku (${books.length})`}
              </h2>
              <span className="text-xs text-muted-foreground">
                Pencarian instan &lt;15ms • Privasi terjaga
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {searchResults.map((book) => (
                <BookCard
                  key={book.id}
                  {...book}
                  onSelect={(id) => setSelectedBookId(id)}
                />
              ))}
            </div>
          </section>
        ) : (
          /* Empty / Zero Result State (Section 5.g DESIGN.md) */
          <section className="space-y-8 pt-2">
            <div className="rounded-2xl border border-border bg-card p-8 text-center max-w-xl mx-auto space-y-2">
              <Compass className="h-10 w-10 text-accent mx-auto mb-2" />
              <h2 className="text-lg font-bold text-foreground">
                Wah, buku dengan kata &lsquo;{query}&rsquo; belum ditemukan.
              </h2>
              <p className="text-sm text-muted-foreground">
                Coba periksa ejaan atau gunakan kata kunci yang lebih umum.
              </p>
            </div>

            {fallbackScienceBooks.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  Mungkin kamu tertarik dengan buku Sains &amp; Cerita ini:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                  {fallbackScienceBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      {...book}
                      onSelect={(id) => setSelectedBookId(id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <BookDetailModal
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={(open) => !open && setSelectedBookId(null)}
      />
    </div>
  );
}

