"use client";

import React from "react";
import {
  Sparkles,
  Atom,
  Compass,
  Smile,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BookCardProps {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  publishedYear?: number;
  coverUrl: string;
  fileUrl?: string;
  r2Key?: string;
  category: "fiksi" | "sains" | "sejarah" | "komik";
  gradeLevel: "SD" | "SMP" | "SMA";
  progressPercent?: number;
  currentPage?: number;
  estimatedReadMinutes?: number;
  variant?: "default" | "compact" | "horizontal";
  onSelect: (bookId: string) => void;
  onQuickRead?: (bookId: string) => void;
}

const CategoryIcon = ({
  category,
}: {
  category: BookCardProps["category"];
}) => {
  switch (category) {
    case "fiksi":
      return <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />;
    case "sains":
      return <Atom className="h-3 w-3 mr-1" aria-hidden="true" />;
    case "sejarah":
      return <Compass className="h-3 w-3 mr-1" aria-hidden="true" />;
    case "komik":
      return <Smile className="h-3 w-3 mr-1" aria-hidden="true" />;
  }
};

function getGradeDisplayLabel(grade: "SD" | "SMP" | "SMA"): string {
  if (grade === "SD") return "SD/MI";
  if (grade === "SMP") return "SMP/MTS";
  return "SMA/SMK";
}

function getPedestalColor(category: BookCardProps["category"], grade: "SD" | "SMP" | "SMA"): string {
  if (category === "sains") return "bg-sky-200/55 dark:bg-sky-900/30";
  if (category === "sejarah") return "bg-amber-200/50 dark:bg-amber-900/30";
  if (category === "komik") return "bg-rose-200/50 dark:bg-rose-900/30";
  if (grade === "SD") return "bg-orange-200/50 dark:bg-orange-900/30";
  if (grade === "SMA") return "bg-teal-200/50 dark:bg-teal-900/30";
  return "bg-slate-200/70 dark:bg-slate-800/50";
}

export const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  author,
  publisher = "Pusat Perbukuan",
  publishedYear = 2026,
  coverUrl,
  category,
  gradeLevel,
  progressPercent = 0,
  currentPage = 1,
  estimatedReadMinutes,
  variant = "default",
  onSelect,
  onQuickRead,
}) => {
  const isCompleted = progressPercent >= 100;
  const isReading = progressPercent > 0 && progressPercent < 100;

  const gradeBadgeVariant =
    gradeLevel === "SD" ? "sd" : gradeLevel === "SMP" ? "smp" : "sma";

  if (variant === "horizontal") {
    return (
      <article className="group relative flex items-center gap-4 rounded-2xl bg-card text-card-foreground border border-border p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
        <div className="relative h-28 w-20 shrink-0 rounded-md bg-secondary overflow-hidden shadow-md border-r-[3px] border-r-stone-200">
          <img
            src={coverUrl}
            alt={`Sampul buku ${title} - ${author}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/25 via-white/15 to-transparent" />
        </div>
        <div className="flex flex-col flex-1 min-w-0 justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="inline-flex items-center rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white tracking-wide">
                PDF
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-600 dark:bg-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-white">
                {getGradeDisplayLabel(gradeLevel)}
              </span>
              <Badge variant={category} className="text-[10px] px-2 py-0 capitalize">
                <CategoryIcon category={category} />
                {category}
              </Badge>
            </div>
            <h3 className="text-base font-bold leading-snug text-foreground line-clamp-1">
              <button
                type="button"
                onClick={() => onSelect(id)}
                className="text-left hover:text-primary focus:outline-none"
              >
                {title}
              </button>
            </h3>
            <p className="text-xs font-medium text-muted-foreground line-clamp-1 mt-0.5">
              Penulis: {author}
            </p>
          </div>

          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">
                Halaman {currentPage} ({progressPercent}%)
              </span>
              {estimatedReadMinutes && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> ~{estimatedReadMinutes} mnt
                </span>
              )}
            </div>
            <Progress
              value={progressPercent}
              className="h-2 bg-secondary [&>div]:bg-accent"
              aria-label={`Progress membaca ${progressPercent} persen`}
            />
          </div>

          {onQuickRead && (
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => onQuickRead(id)}
                className="w-full sm:w-auto gap-1.5 text-xs h-9 min-h-[38px] font-bold"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Lanjut Baca Hal. {currentPage}
              </Button>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col select-none">
      {/* Bagian Atas: Panggung Buku Ala SIBI Kemendikdasmen (Arch Pedestal + 3D Book Tilt) */}
      <div
        onClick={() => onSelect(id)}
        className="relative pt-3 pb-2 px-4 sm:px-5 flex items-end justify-center cursor-pointer [perspective:1000px]"
      >
        {/* Semicircular Arch Pedestal di Belakang Bawah Buku */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute bottom-1 inset-x-1 h-[42%] rounded-t-full transition-transform duration-300 group-hover:scale-[1.03]",
            getPedestalColor(category, gradeLevel)
          )}
        />

        {/* Wrapper Buku Fisik dengan Efek Kemiringan Perspektif & Tebal Kertas Kanan */}
        <div className="relative z-10 w-full max-w-[165px] aspect-[3/4] rounded-[4px] bg-secondary transition-all duration-300 ease-out shadow-[0_10px_22px_rgba(15,23,42,0.18)] group-hover:[transform:rotateY(-14deg)_rotateX(2deg)_translateY(-6px)] group-hover:shadow-[12px_16px_28px_rgba(15,23,42,0.26)] border-r-[5px] border-r-stone-100 dark:border-r-slate-300 overflow-hidden">
          <img
            src={coverUrl}
            alt={`Sampul buku ${title} - ${author}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />

          {/* Lipatan Punggung Buku (Book Spine Crease Highlight) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/30 via-white/25 to-transparent"
          />

          {/* Indikator Selesai di Sudut Kanan Atas Sampul */}
          {isCompleted && (
            <div
              className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
              aria-label="Buku selesai dibaca"
            >
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              <span>Selesai</span>
            </div>
          )}

          {/* Overlay Progress Bar Tipis di Bawah Sampul bila sedang dibaca */}
          {isReading && (
            <div className="absolute bottom-0 inset-x-0 bg-slate-900/85 backdrop-blur-xs px-2 py-1.5 z-10">
              <div className="flex justify-between text-[10px] font-bold text-white mb-0.5">
                <span>Dibaca</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress
                value={progressPercent}
                className="h-1 bg-slate-700 [&>div]:bg-amber-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bagian Bawah: Pill Badges (PDF & Jenjang) + Judul + Penulis + Penerbit */}
      <div className="flex flex-col flex-1 pt-2.5 px-1">
        {/* Baris Badge Pill ala Kemendikdasmen */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="inline-flex items-center rounded-full bg-[#E11D48] px-2.5 py-0.5 text-[10px] font-extrabold text-white tracking-wider uppercase shadow-2xs">
            PDF
          </span>
          <span className="inline-flex items-center rounded-full bg-[#526071] dark:bg-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-white tracking-wide uppercase shadow-2xs">
            {getGradeDisplayLabel(gradeLevel)}
          </span>
          {variant !== "compact" && (
            <span className="inline-flex items-center rounded-full border border-border bg-secondary/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground capitalize">
              {category}
            </span>
          )}
        </div>

        {/* Judul Buku */}
        <h3 className="text-sm sm:text-[15px] font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          <button
            type="button"
            onClick={() => onSelect(id)}
            className="text-left focus:outline-none after:absolute after:inset-0"
            aria-label={`Buku ${title} oleh ${author}, Jenjang ${gradeLevel}`}
          >
            {title}
          </button>
        </h3>

        {/* Penulis & Pusat Perbukuan */}
        <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
          <p className="line-clamp-1 font-medium">
            Penulis: <span className="text-foreground/85">{author}</span>
          </p>
          {variant !== "compact" && (
            <p className="text-[11px] text-muted-foreground/80 line-clamp-1">
              {publisher} • {publishedYear}
            </p>
          )}
        </div>
      </div>
    </article>
  );
};
