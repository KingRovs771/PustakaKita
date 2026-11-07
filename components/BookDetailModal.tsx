"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Clock,
  FileText,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  DownloadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { BookItem } from "@/lib/mock-data";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLibrary } from "@/context/LibraryContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface BookDetailModalProps {
  book: BookItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  open,
  onOpenChange,
}) => {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { toggleSaveBook, cacheBookOffline, offlineCachedIds } = useLibrary();
  const [expandSynopsis, setExpandSynopsis] = useState(false);

  if (!book) return null;

  const isReading = (book.progressPercent ?? 0) > 0 && (book.progressPercent ?? 0) < 100;
  const isOfflineSaved = offlineCachedIds.includes(book.id);
  const gradeBadgeVariant =
    book.gradeLevel === "SD" ? "sd" : book.gradeLevel === "SMP" ? "smp" : "sma";

  const handleStartReading = (page?: number) => {
    onOpenChange(false);
    const targetUrl = page
      ? `/read/${book.id}?page=${page}`
      : `/read/${book.id}`;
    router.push(targetUrl);
  };

  const handleToggleSave = () => {
    toggleSaveBook(book.id);
    if (!book.isSaved) {
      toast.success("Buku disimpan ke Rakku!", {
        description: `${book.title} siap kamu baca kapan saja.`,
      });
    } else {
      toast("Dihapus dari daftar simpanan.");
    }
  };

  const handleOfflineDownload = async () => {
    await cacheBookOffline(book.id);
    toast.success("Tersimpan untuk Mode Offline!", {
      description: "Kamu tetap bisa membaca buku ini meski tanpa kuota internet.",
    });
  };

  const DetailBody = (
    <div className="space-y-6">
      {/* Bagian Atas: Sampul Buku + Metadata Utama */}
      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
        <div className="relative w-36 sm:w-44 aspect-[2/3] shrink-0 rounded-xl overflow-hidden shadow-xl border border-border bg-secondary transform sm:-rotate-1 transition-transform hover:rotate-0">
          <Image
            src={book.coverUrl}
            alt={`Sampul buku ${book.title} - ${book.author}`}
            fill
            sizes="180px"
            className="object-cover"
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Badge variant={gradeBadgeVariant}>Jenjang {book.gradeLevel}</Badge>
            <Badge variant={book.category} className="capitalize">
              <Sparkles className="h-3 w-3 mr-1" />
              {book.category}
            </Badge>
            <Badge variant="outline" className="uppercase text-[10px]">
              {book.sourceType === "bse" ? "BSE Kemendikbud" : "Koleksi Sekolah"}
            </Badge>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold leading-snug text-foreground">
            {book.title}
          </h2>
          <p className="text-sm font-semibold text-muted-foreground">
            Oleh {book.author}
          </p>
          <p className="text-xs text-muted-foreground">
            {book.publisher} • Terbit {book.publishedYear} • ISBN{" "}
            <span className="font-mono">{book.isbn}</span>
          </p>

          {/* 3 Kotak Info Ringkas (DESIGN.md Section 4.10 & 5.c) */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="bg-secondary/60 rounded-xl p-2.5 text-center border border-border/50">
              <FileText className="h-4 w-4 mx-auto text-primary mb-1" />
              <div className="text-xs font-bold text-foreground">
                {book.totalPages} Hal
              </div>
              <div className="text-[10px] text-muted-foreground">Halaman</div>
            </div>
            <div className="bg-secondary/60 rounded-xl p-2.5 text-center border border-border/50">
              <Clock className="h-4 w-4 mx-auto text-accent mb-1" />
              <div className="text-xs font-bold text-foreground">
                ~{book.estimatedReadMinutes} Mnt
              </div>
              <div className="text-[10px] text-muted-foreground">Estimasi Baca</div>
            </div>
            <div className="bg-secondary/60 rounded-xl p-2.5 text-center border border-border/50">
              <GraduationCap className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
              <div className="text-xs font-bold text-foreground line-clamp-1">
                {book.vocabularyLevel}
              </div>
              <div className="text-[10px] text-muted-foreground">Kosakata</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sinopsis Buku */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-foreground">Sinopsis Cerita & Isi Buku</h3>
        <p
          className={`text-sm text-muted-foreground leading-relaxed ${
            !expandSynopsis ? "line-clamp-3" : ""
          }`}
        >
          {book.synopsis}
        </p>
        {book.synopsis.length > 140 && (
          <button
            type="button"
            onClick={() => setExpandSynopsis(!expandSynopsis)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {expandSynopsis ? "Sembunyikan" : "Baca Selengkapnya"}
          </button>
        )}
      </div>

      {/* Daftar Isi Bab yang Dapat Diklik */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">
          Daftar Bab ({book.chapters.length} Bab)
        </h3>
        <div className="divide-y divide-border rounded-xl border border-border bg-background/50 overflow-hidden">
          {book.chapters.map((ch) => (
            <button
              key={ch.number}
              type="button"
              onClick={() => handleStartReading(ch.startPage)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm hover:bg-secondary/70 transition-colors min-h-[44px]"
            >
              <span className="font-medium text-foreground">{ch.title}</span>
              <span className="text-xs font-semibold text-primary shrink-0 ml-2">
                Mulai Hal. {ch.startPage} →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-0 pt-3 bg-card border-t border-border flex flex-wrap items-center gap-2.5">
        <Button
          size="lg"
          onClick={() =>
            handleStartReading(isReading ? book.currentPage : 1)
          }
          className="flex-1 gap-2 font-bold"
        >
          <BookOpen className="h-5 w-5" />
          {isReading
            ? `Lanjutkan Halaman ${book.currentPage} (${book.progressPercent}%)`
            : "Mulai Membaca Sekarang"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleToggleSave}
          aria-label={book.isSaved ? "Hapus dari Rakku" : "Simpan ke Rakku"}
          title={book.isSaved ? "Tersimpan di Rakku" : "Simpan ke Rakku"}
          className="h-12 w-12 rounded-xl"
        >
          {book.isSaved ? (
            <BookmarkCheck className="h-5 w-5 text-primary fill-primary/20" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleOfflineDownload}
          aria-label="Simpan untuk dibaca tanpa internet (Offline)"
          title="Unduh ke Memori Offline"
          className="h-12 w-12 rounded-xl"
        >
          {isOfflineSaved ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <DownloadCloud className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{book.title}</DialogTitle>
            <DialogDescription>
              Detail buku {book.title} oleh {book.author}
            </DialogDescription>
          </DialogHeader>
          {DetailBody}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{book.title}</DrawerTitle>
          <DrawerDescription>
            Detail buku {book.title} oleh {book.author}
          </DrawerDescription>
        </DrawerHeader>
        {DetailBody}
      </DrawerContent>
    </Drawer>
  );
};

