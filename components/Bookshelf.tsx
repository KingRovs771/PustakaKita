"use client";

import React from "react";
import { Sparkles, WifiOff } from "lucide-react";
import { BookCard, BookCardProps } from "@/components/BookCard";

export type ShelfBookData = Omit<BookCardProps, "onSelect">;

export interface BookshelfProps {
  books: ShelfBookData[];
  shelfTitle: string;
  is3DEnabled?: boolean;
  isLowBandwidth?: boolean;
  onBookClick: (bookId: string) => void;
  onToggleMode?: (is3D: boolean) => void;
}

export const Bookshelf: React.FC<BookshelfProps> = ({
  books,
  shelfTitle,
  isLowBandwidth = false,
  onBookClick,
}) => {
  const featuredBooks = books.slice(0, 4);

  if (featuredBooks.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="featured-shelf-heading" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="featured-shelf-heading"
              className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground"
            >
              {shelfTitle}
            </h2>
            <p className="text-xs text-muted-foreground">
              Koleksi terkurasi untuk mendampingi kegiatan literasi harianmu
            </p>
          </div>
        </div>

        {isLowBandwidth && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
            <WifiOff className="h-3.5 w-3.5" />
            Mode Hemat Kuota Aktif
          </span>
        )}
      </div>

      {/* Showcase Rak Buku Profesional ala SIBI Kemendikdasmen */}
      <div className="rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-8 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {featuredBooks.map((book) => (
            <BookCard
              key={book.id}
              {...book}
              onSelect={onBookClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
