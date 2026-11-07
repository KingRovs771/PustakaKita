"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ScrollText,
  Columns,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  FileText,
  ExternalLink,
  PenLine,
} from "lucide-react";
import { toast } from "sonner";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { ReaderToolbar, ReaderSettings } from "@/components/ReaderToolbar";
import { FlipHtml5Viewer } from "@/components/FlipHtml5Viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLibrary } from "@/context/LibraryContext";
import { CONTEXTUAL_DICTIONARY } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const READER_THEME_STYLES: Record<
  ReaderSettings["theme"],
  { bg: string; text: string; barBg: string; border: string; deskBg: string }
> = {
  day: {
    bg: "#FAF8F5",
    text: "#1E293B",
    barBg: "rgba(250, 248, 245, 0.94)",
    border: "#E2E8F0",
    deskBg: "from-amber-50/70 via-stone-100/80 to-stone-200/60",
  },
  sepia: {
    bg: "#F4ECD8",
    text: "#3E2723",
    barBg: "rgba(244, 236, 216, 0.94)",
    border: "#D7C9AA",
    deskBg: "from-amber-100/60 via-orange-100/50 to-amber-200/50",
  },
  night: {
    bg: "#12161F",
    text: "#CBD5E1",
    barBg: "rgba(18, 22, 31, 0.94)",
    border: "#262F40",
    deskBg: "from-slate-950 via-slate-900 to-slate-950",
  },
};

const FONT_SIZE_CLASSES: Record<ReaderSettings["fontSizeStep"], string> = {
  1: "text-base sm:text-lg",
  2: "text-lg sm:text-xl",
  3: "text-xl sm:text-[22px]",
  4: "text-[22px] sm:text-2xl",
  5: "text-2xl sm:text-[28px]",
};

const LINE_SPACING_CLASSES: Record<ReaderSettings["lineSpacing"], string> = {
  normal: "leading-[1.5]",
  relaxed: "leading-[1.8]",
  loose: "leading-[2.1]",
};

// Render paragraf dengan sorotan otomatis pada kata-kata di Kamus Kontekstual
function renderParagraphWithDictionary(text: string) {
  const words = text.split(/(\s+)/);
  return words.map((segment, index) => {
    const cleanWord = segment.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const dictEntry = CONTEXTUAL_DICTIONARY[cleanWord];
    if (!dictEntry) {
      return <React.Fragment key={index}>{segment}</React.Fragment>;
    }

    return (
      <Popover key={index}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline font-semibold underline decoration-dotted decoration-primary underline-offset-4 hover:bg-primary/15 rounded px-0.5 transition-colors"
            title={`Klik untuk arti kata: ${dictEntry.term}`}
          >
            {segment}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 space-y-2 text-left shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-primary">
              {dictEntry.term}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
              {dictEntry.category}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-foreground">
            {dictEntry.definition}
          </p>
          <div className="rounded-lg bg-secondary/60 p-2 text-[11px] italic text-muted-foreground">
            Contoh: &ldquo;{dictEntry.example}&rdquo;
          </div>
        </PopoverContent>
      </Popover>
    );
  });
}

function ReaderView() {
  const params = useParams<{ bookId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    books,
    student,
    schoolProfile,
    readerSettings,
    updateReaderSettings,
    updateBookProgress,
    cacheBookOffline,
  } = useLibrary();

  const book = books.find((b) => b.id === params.bookId) || books[0];

  const resolvedFileUrl =
    book?.fileUrl ||
    (book?.r2Key
      ? book.r2Key.startsWith("/uploads/") ||
        book.r2Key.startsWith("/api/books/file") ||
        book.r2Key.startsWith("http")
        ? book.r2Key
        : `/api/books/file?key=${encodeURIComponent(book.r2Key)}`
      : undefined);

  const hasPdfFile = Boolean(
    resolvedFileUrl && resolvedFileUrl.toLowerCase().includes(".pdf")
  );

  const chapters = React.useMemo(() => {
    if (!book) return [];
    if (book.chapters && Array.isArray(book.chapters) && book.chapters.length > 0) {
      return book.chapters;
    }
    return [
      {
        number: 1,
        title: "Bab 1: Pendahuluan",
        startPage: 1,
        paragraphs: [
          book.synopsis || "Selamat membaca buku digital ini.",
          "Gunakan kontrol baca di atas dan bawah untuk menyesuaikan ukuran teks, spasi, dan mode membaca yang nyaman.",
        ],
      },
    ];
  }, [book]);

  const initialPage = parseInt(
    searchParams.get("page") || String(book?.currentPage || 1),
    10
  );

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [viewMode, setViewMode] = useState<"flipbook" | "story">("flipbook");
  const [readingMode, setReadingMode] = useState<"paginated" | "scrolled">(
    student.grade === "SD" ? "paginated" : "scrolled"
  );
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [studentNote, setStudentNote] = useState<string>("");
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(false);

  // Gamifikasi Literasi (XP & Fokus Baca supaya siswa semangat membaca)
  const [sessionXp, setSessionXp] = useState<number>(10);

  // Text-to-Speech (TTS) state
  const [isTtsSupported, setIsTtsSupported] = useState<boolean>(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState<boolean>(false);
  const [ttsSpeed, setTtsSpeed] = useState<0.8 | 1.0 | 1.2>(1.0);

  // Sinkronkan mode awal bila buku memiliki PDF
  useEffect(() => {
    if (hasPdfFile) {
      setViewMode("flipbook");
    }
  }, [hasPdfFile]);

  // Muat catatan belajar siswa untuk buku ini
  useEffect(() => {
    if (!book?.id) return;
    try {
      const savedNote = localStorage.getItem(`pustakakita_note_${book.id}`);
      if (savedNote) setStudentNote(savedNote);
    } catch {}
  }, [book?.id]);

  // Tentukan bab aktif berdasarkan nomor halaman
  const activeChapterIndex = Math.max(
    0,
    chapters.reduce((acc, ch, idx) => {
      if (currentPage >= ch.startPage) return idx;
      return acc;
    }, 0)
  );
  const currentChapter = chapters[activeChapterIndex] || chapters[0] || {
    number: 1,
    title: "Bab 1",
    startPage: 1,
    paragraphs: ["Selamat membaca."],
  };

  useEffect(() => {
    if (!book) return;
    cacheBookOffline(book.id);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsTtsSupported(true);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [book, cacheBookOffline]);

  const changePage = useCallback(
    (nextPage: number) => {
      if (!book) return;
      const totalPages = book.totalPages || 100;
      const clamped = Math.max(1, Math.min(nextPage, totalPages));
      if (clamped === currentPage) return;

      setFlipDirection(clamped > currentPage ? "next" : "prev");
      setCurrentPage(clamped);
      setSessionXp((prev) => prev + 10);
      updateBookProgress(book.id, clamped);

      const pct = Math.round((clamped / totalPages) * 100);
      if (clamped === totalPages) {
        toast.success(" Luar Biasa! Kamu Menamatkan Buku Ini! (+100 XP)", {
          description: "Lencana membaca & progres 100% telah tercatat di Rakmu.",
        });
      } else if (pct === 50) {
        toast.success("🔥 Hebat! Kamu Sudah Membaca Setengah Buku Ini! (+50 XP)");
      }
    },
    [book, currentPage, updateBookProgress]
  );

  const handleToggleTts = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !book) return;
    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const fullText = `${book.title}. ${currentChapter.title}. ${(currentChapter.paragraphs || []).join(" ")}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = "id-ID";
    utterance.rate = ttsSpeed;
    utterance.onend = () => setIsTtsPlaying(false);
    utterance.onerror = () => setIsTtsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsTtsPlaying(true);
  }, [isTtsPlaying, book, currentChapter, ttsSpeed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        handleToggleTts();
        return;
      }

      // Navigasi halaman mode cerita teks biasa
      if (viewMode === "story") {
        if (e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault();
          changePage(currentPage + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          changePage(currentPage - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, currentPage, changePage, handleToggleTts]);

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-background">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <BookOpen className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Buku Belum Tersedia atau Sedang Dimuat</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Buku ini sedang disiapkan dari server atau koleksi perpustakaan belum memiliki judul terkait.
        </p>
        <Button onClick={() => router.push("/library")} className="gap-2 font-bold">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Katalog Perpustakaan
        </Button>
      </div>
    );
  }

  const toggleBrowserFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSaveNote = () => {
    try {
      localStorage.setItem(`pustakakita_note_${book.id}`, studentNote);
      toast.success("Catatan belajarmu berhasil disimpan! (+15 XP)");
      setSessionXp((x) => x + 15);
      setIsNotesOpen(false);
    } catch {
      toast.error("Gagal menyimpan catatan.");
    }
  };

  const themeStyle = READER_THEME_STYLES[readerSettings.theme];
  const fontClass =
    readerSettings.fontFamily === "serif"
      ? "font-serif"
      : readerSettings.fontFamily === "dyslexic"
      ? "font-dyslexic"
      : "font-sans";

  const progressPct = Math.round((currentPage / book.totalPages) * 100);

  return (
    <div
      style={{
        backgroundColor: themeStyle.bg,
        color: themeStyle.text,
      }}
      className="min-h-screen transition-colors duration-300 relative select-text"
    >
      {/* Live Region untuk Screen Reader */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Halaman {currentPage} dari {book.totalPages}, {currentChapter.title}
      </div>

      {/* 1. Paling Atas: ReadingProgressBar */}
      <ReadingProgressBar
        variant="reader-top"
        currentPage={currentPage}
        totalPages={book.totalPages}
        showPageNumbers={true}
      />

      {/* 2. Top Bar Studio Reader Modern */}
      <header
        style={{
          backgroundColor: themeStyle.barBg,
          borderColor: themeStyle.border,
        }}
        className={cn(
          "fixed top-1.5 inset-x-0 z-40 h-14 px-3 sm:px-6 border-b backdrop-blur-md flex items-center justify-between gap-2 transition-all duration-300",
          controlsVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-20 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/library")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-current/15 bg-current/[0.04] px-3 py-1.5 text-xs font-bold hover:bg-current/10 transition-colors min-h-[38px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali ke Rak</span>
          </button>

          {/* Gamified XP Counter Pill */}
          <div
            className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-extrabold text-amber-600 dark:text-amber-400"
            title="Poin Literasi Sesi Ini"
          >
            <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>+{sessionXp} XP Baca</span>
          </div>
        </div>

        {/* Tengah: Sakelar Mode FlipHTML5 3D vs Mode Fokus & Audio */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="inline-flex items-center rounded-xl bg-current/[0.06] p-1 border border-current/10">
            <button
              type="button"
              onClick={() => setViewMode("flipbook")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all",
                viewMode === "flipbook"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "opacity-75 hover:opacity-100"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>FlipHTML5 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("story")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all",
                viewMode === "story"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "opacity-75 hover:opacity-100"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Mode Teks & Audio</span>
            </button>
          </div>
        </div>

        {/* Kanan: Aksi Cepat (Dengarkan AI, Catatanmu, Bookmark, Layar Penuh) */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {isTtsSupported && (
            <button
              type="button"
              onClick={handleToggleTts}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors min-h-[38px]",
                isTtsPlaying
                  ? "bg-primary text-primary-foreground animate-pulse"
                  : "border border-current/15 hover:bg-current/10"
              )}
              title="Dengarkan Buku dengan Suara AI (Tekan T)"
            >
              {isTtsPlaying ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span className="hidden lg:inline">Hentikan Suara</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="hidden lg:inline">Dengarkan</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsNotesOpen(true)}
            className="inline-flex items-center gap-1 rounded-xl border border-current/15 px-2.5 py-1.5 text-xs font-bold hover:bg-current/10 min-h-[38px]"
            title="Tulis Catatan atau Rangkuman Belajarmu"
          >
            <PenLine className="h-4 w-4 text-emerald-600" />
            <span className="hidden lg:inline">Catatan</span>
          </button>

          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            className="hidden sm:inline-flex items-center justify-center rounded-xl border border-current/15 p-2 hover:bg-current/10 min-h-[38px] min-w-[38px]"
            title="Mode Layar Penuh Tanpa Gangguan"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsBookmarked(!isBookmarked);
              toast.success(
                !isBookmarked
                  ? `Halaman ${currentPage} ditandai!`
                  : "Penanda halaman dihapus"
              );
            }}
            aria-label="Tandai Halaman"
            className="p-2 rounded-xl border border-current/15 min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-amber-500 fill-amber-500" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Overlay Watermark Dinamis NISN Hash & Sekolah */}
      {showWatermark && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden opacity-10 select-none"
        >
          <div className="rotate-[-28deg] text-center font-mono text-lg sm:text-2xl font-bold tracking-widest space-y-24">
            <p>
              {schoolProfile.schoolName.toUpperCase()} • NISN-HASH: {student.nisn} •{" "}
              {new Date().toLocaleDateString("id-ID")}
            </p>
            <p>
              KOLEKSI SEKOLAH • {student.name.toUpperCase()} •{" "}
              {student.className}
            </p>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 1: INTERACTIVE FLIPHTML5 3D FLIPBOOK STUDIO                       */}
      {/* ===================================================================== */}
      {viewMode === "flipbook" ? (
        <main
          id="main-content"
          className={cn(
            "h-screen max-h-screen overflow-hidden pt-16 pb-3 px-2 sm:px-4 lg:px-6 bg-gradient-to-b flex flex-col items-center justify-between",
            themeStyle.deskBg
          )}
        >
          <FlipHtml5Viewer
            book={book}
            fileUrl={hasPdfFile ? resolvedFileUrl : undefined}
            currentPage={currentPage}
            totalPages={book.totalPages}
            schoolName={schoolProfile.schoolName}
            theme={readerSettings.theme}
            onPageChange={changePage}
            onToggleFullscreen={toggleBrowserFullscreen}
            isFullscreen={isFullscreen}
          />
        </main>
      ) : (
        /* ===================================================================== */
        /* MODE 2: KANVAS CERITA INTERAKTIF, KAMUS SAINS & AUDIO AI               */
        /* ===================================================================== */
        <main
          id="main-content"
          onClick={() => setControlsVisible((v) => !v)}
          className={cn(
            "mx-auto px-5 sm:px-8 pt-24 pb-36 transition-all duration-200",
            readerSettings.fontSizeStep >= 4 ? "max-w-[55ch]" : "max-w-[65ch]"
          )}
        >
          {/* Banner Motivasi & Petunjuk Kamus Kontekstual */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-current/15 bg-current/[0.03] px-4 py-3 text-xs">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span>
                Ketuk kata bergaris bawah titik-titik (seperti{" "}
                <strong className="underline decoration-dotted">fotosintesis</strong>{" "}
                atau{" "}
                <strong className="underline decoration-dotted">gravitasi</strong>)
                untuk membuka Kamus Sains Interaktif!
              </span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setReadingMode(
                  readingMode === "paginated" ? "scrolled" : "paginated"
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-2.5 py-1 text-[11px] font-bold shrink-0 self-start sm:self-auto"
            >
              {readingMode === "paginated" ? (
                <>
                  <Columns className="h-3.5 w-3.5" />
                  <span>Mode Halaman</span>
                </>
              ) : (
                <>
                  <ScrollText className="h-3.5 w-3.5" />
                  <span>Mode Gulir Bab</span>
                </>
              )}
            </button>
          </div>

          {/* Header Bab */}
          <div className="mb-8 pb-4 border-b border-current/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                {book.title} • Halaman {currentPage} dari {book.totalPages}
              </span>
              <h1 className="mt-1 text-xl sm:text-2xl font-bold leading-snug">
                {currentChapter.title}
              </h1>
            </div>

            {hasPdfFile && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode("flipbook");
                }}
                className="gap-1.5 text-xs font-bold shrink-0"
              >
                <FileText className="h-3.5 w-3.5 text-primary" />
                Buka Tampilan Buku Visual (PDF)
              </Button>
            )}
          </div>

          {/* Isi Teks Buku */}
          <article
            key={currentPage}
            className={cn(
              "text-left animate-in fade-in slide-in-from-right-2 duration-200",
              fontClass,
              FONT_SIZE_CLASSES[readerSettings.fontSizeStep],
              LINE_SPACING_CLASSES[readerSettings.lineSpacing]
            )}
          >
            {readingMode === "paginated" ? (
              <div>
                {(currentChapter.paragraphs || []).map((para, idx) => (
                  <p key={idx} className="mb-6">
                    {renderParagraphWithDictionary(para)}
                  </p>
                ))}
              </div>
            ) : (
              <div>
                {(currentChapter.paragraphs || []).map((para, idx) => (
                  <p key={idx} className="mb-6">
                    {renderParagraphWithDictionary(para)}
                  </p>
                ))}

                {/* Kartu Perayaan Akhir Bab */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-10 rounded-2xl border border-current/20 bg-current/[0.04] p-6 text-center space-y-3 font-sans"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto animate-bounce" />
                  <h2 className="text-lg font-bold">
                    {currentChapter.title} Selesai! (+25 XP)
                  </h2>
                  <p className="text-xs opacity-80">
                    Keren! Kamu sudah menyelesaikan bab ini dengan fokus.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    {activeChapterIndex + 1 < chapters.length ? (
                      <Button
                        onClick={() =>
                          changePage(
                            chapters[activeChapterIndex + 1].startPage
                          )
                        }
                        className="font-bold gap-1.5"
                      >
                        <span>
                          Lanjut ke {chapters[activeChapterIndex + 1].title}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => changePage(book.totalPages)}
                        className="font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Tandai Buku Selesai (100%)</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </article>

          {/* Navigasi Halaman Bawah */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-10 pt-6 border-t border-current/15 flex items-center justify-between gap-4 font-sans"
          >
            <Button
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => changePage(currentPage - 1)}
              className="gap-1.5 font-semibold"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Halaman Sebelumnya</span>
            </Button>

            <span className="text-xs font-bold opacity-80">
              Hal. {currentPage} / {book.totalPages}
            </span>

            <Button
              variant="default"
              disabled={currentPage >= book.totalPages}
              onClick={() => changePage(currentPage + 1)}
              className="gap-1.5 font-semibold"
            >
              <span>Halaman Selanjutnya</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </main>
      )}

      {/* 4. Floating Bottom Control: ReaderToolbar (Khusus Mode Teks & Audio) */}
      {viewMode === "story" && (
        <ReaderToolbar
          settings={readerSettings}
          onUpdateSettings={updateReaderSettings}
          isTtsPlaying={isTtsPlaying}
          isTtsSupported={isTtsSupported}
          ttsSpeed={ttsSpeed}
          onToggleTts={handleToggleTts}
          onChangeTtsSpeed={(sp) => setTtsSpeed(sp)}
          isBookmarked={isBookmarked}
          onToggleBookmark={() => {
            setIsBookmarked(!isBookmarked);
            toast.success(
              !isBookmarked
                ? `Halaman ${currentPage} ditandai!`
                : "Penanda dihapus"
            );
          }}
          onOpenToc={() => setIsTocOpen(true)}
          visible={controlsVisible}
        />
      )}

      {/* Modal Daftar Isi Bab */}
      <Dialog open={isTocOpen} onOpenChange={setIsTocOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Daftar Isi & Lompat Halaman
            </DialogTitle>
            <DialogDescription>{book.title}</DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden mt-2">
            {chapters.map((ch) => (
              <button
                key={ch.number}
                type="button"
                onClick={() => {
                  changePage(ch.startPage);
                  setIsTocOpen(false);
                }}
                className="w-full flex items-center justify-between p-3.5 text-left text-sm hover:bg-secondary/60 transition-colors"
              >
                <span className="font-semibold text-foreground">{ch.title}</span>
                <span className="text-xs font-bold text-primary">
                  Hal. {ch.startPage}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Catatan Belajar & Rangkuman Siswa */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-emerald-600" />
              Jurnal & Catatan Bacaanmu
            </DialogTitle>
            <DialogDescription>
              Tulis hal menarik atau kesimpulan dari buku <strong>{book.title}</strong> untuk mendapatkan +15 XP!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <textarea
              rows={4}
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder="Contoh: Dari halaman ini aku belajar bahwa..."
              className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsNotesOpen(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleSaveNote} className="font-bold gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Simpan Catatan (+15 XP)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ReadingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-sm font-semibold text-muted-foreground">
          Membuka halaman terakhir yang kamu baca...
        </div>
      }
    >
      <ReaderView />
    </Suspense>
  );
}
