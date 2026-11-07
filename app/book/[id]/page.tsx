"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Clock,
  FileText,
  GraduationCap,
  Sparkles,
  DownloadCloud,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AppNavigation } from "@/components/AppNavigation";
import { useLibrary } from "@/context/LibraryContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BookDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { books, toggleSaveBook, cacheBookOffline, offlineCachedIds } =
    useLibrary();

  const book = books.find((b) => b.id === params.id) || books[0];
  const isReading =
    (book.progressPercent ?? 0) > 0 && (book.progressPercent ?? 0) < 100;
  const isOfflineSaved = offlineCachedIds.includes(book.id);
  const gradeBadgeVariant =
    book.gradeLevel === "SD" ? "sd" : book.gradeLevel === "SMP" ? "smp" : "sma";

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-12">
      <AppNavigation />

      <main
        id="main-content"
        className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Rak Buku Utama
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="relative w-48 sm:w-56 aspect-[2/3] shrink-0 rounded-xl overflow-hidden shadow-xl border border-border bg-secondary">
              <Image
                src={book.coverUrl}
                alt={`Sampul buku ${book.title} - ${book.author}`}
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant={gradeBadgeVariant}>
                  Jenjang {book.gradeLevel}
                </Badge>
                <Badge variant={book.category} className="capitalize">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {book.category}
                </Badge>
                <Badge variant="outline" className="uppercase">
                  {book.sourceType === "bse"
                    ? "Buku Sekolah Elektronik (BSE)"
                    : "Koleksi Internal Sekolah"}
                </Badge>
              </div>

              <h1 className="text-2xl lg:text-[32px] font-bold leading-snug text-foreground">
                {book.title}
              </h1>
              <p className="text-base font-semibold text-muted-foreground">
                Oleh {book.author}
              </p>
              <p className="text-xs text-muted-foreground">
                Penerbit: {book.publisher} ({book.publishedYear}) • ISBN:{" "}
                <span className="font-mono">{book.isbn}</span>
              </p>

              {/* 3 Kolom Metrik Mini (DESIGN.md Section 5.c) */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-secondary/60 rounded-xl p-3 text-center border border-border/60">
                  <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
                  <div className="text-sm font-bold text-foreground">
                    {book.totalPages} Hal
                  </div>
                  <div className="text-xs text-muted-foreground">Halaman</div>
                </div>
                <div className="bg-secondary/60 rounded-xl p-3 text-center border border-border/60">
                  <Clock className="h-5 w-5 mx-auto text-accent mb-1" />
                  <div className="text-sm font-bold text-foreground">
                    ~{book.estimatedReadMinutes} Menit
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Estimasi Baca
                  </div>
                </div>
                <div className="bg-secondary/60 rounded-xl p-3 text-center border border-border/60">
                  <GraduationCap className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                  <div className="text-sm font-bold text-foreground line-clamp-1">
                    {book.vocabularyLevel}
                  </div>
                  <div className="text-xs text-muted-foreground">Kosakata</div>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button
                  size="lg"
                  onClick={() =>
                    router.push(
                      `/read/${book.id}?page=${
                        isReading ? book.currentPage : 1
                      }`
                    )
                  }
                  className="flex-1 gap-2 font-bold"
                >
                  <BookOpen className="h-5 w-5" />
                  {isReading
                    ? `Lanjutkan Halaman ${book.currentPage} (${book.progressPercent}%)`
                    : "Mulai Membaca Sekarang"}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    toggleSaveBook(book.id);
                    toast.success(
                      book.isSaved
                        ? "Dihapus dari Rakku"
                        : "Disimpan ke Rakku!"
                    );
                  }}
                  className="gap-2"
                >
                  {book.isSaved ? (
                    <>
                      <BookmarkCheck className="h-5 w-5 text-primary" />
                      <span>Tersimpan</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-5 w-5" />
                      <span>Simpan ke Rakku</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={async () => {
                    await cacheBookOffline(book.id);
                    toast.success("Buku disimpan untuk dibaca Offline!");
                  }}
                  className="gap-2"
                >
                  {isOfflineSaved ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <DownloadCloud className="h-5 w-5" />
                  )}
                  <span>Offline</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Sinopsis & Daftar Bab */}
          <div className="space-y-4 pt-6 border-t border-border">
            <h2 className="text-lg font-bold text-foreground">Sinopsis Lengkap</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              {book.synopsis}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              Daftar Isi Bab ({book.chapters.length} Bab)
            </h2>
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {book.chapters.map((ch) => (
                <button
                  key={ch.number}
                  type="button"
                  onClick={() =>
                    router.push(`/read/${book.id}?page=${ch.startPage}`)
                  }
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/60 transition-colors"
                >
                  <span className="font-semibold text-foreground">
                    {ch.title}
                  </span>
                  <span className="text-xs font-bold text-primary">
                    Buka Halaman {ch.startPage} →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

