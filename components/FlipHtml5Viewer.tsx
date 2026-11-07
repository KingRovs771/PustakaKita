"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  LayoutGrid,
  BookOpen,
  FileText,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { BookItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface FlipHtml5ViewerProps {
  book: BookItem;
  fileUrl?: string;
  currentPage: number;
  totalPages: number;
  schoolName: string;
  theme: "day" | "sepia" | "night";
  onPageChange: (nextPage: number) => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

// Efek suara lembaran kertas realistis menggunakan Web Audio API (100% bebas file eksternal & offline)
function playPaperFlipSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const duration = 0.22;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Amplop gesekan kertas halus (naik cepat lalu meluruh lembut)
      const env = Math.sin(t * Math.PI) * Math.pow(1 - t, 1.4);
      data[i] = (Math.random() * 2 - 1) * env * 0.28;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1100, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + duration);
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 300);
  } catch {
    // Abaikan bila autoplay audio diblokir browser
  }
}

export const FlipHtml5Viewer: React.FC<FlipHtml5ViewerProps> = ({
  book,
  fileUrl,
  currentPage,
  totalPages: propTotalPages,
  schoolName,
  theme,
  onPageChange,
  onToggleFullscreen,
  isFullscreen = false,
}) => {
  const [spreadMode, setSpreadMode] = useState<"double" | "single">("double");
  const [zoom, setZoom] = useState<number>(100);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAutoFlip, setIsAutoFlip] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [flippingState, setFlippingState] = useState<null | "next" | "prev">(null);
  const [hoverCorner, setHoverCorner] = useState<null | "left" | "right">(null);

  // State PDF.js Canvas
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfNumPages, setPdfNumPages] = useState<number>(propTotalPages || 24);
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(0.707);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [pdfRenderFailed, setPdfRenderFailed] = useState<boolean>(false);

  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRenderTasksRef = useRef<{ left?: any; right?: any }>({});

  const effectiveTotalPages = pdfDoc ? pdfNumPages : Math.max(2, propTotalPages || 24);

  // Otomatis pindah ke 1 halaman di layar HP sempit
  useEffect(() => {
    const checkViewport = () => {
      if (window.innerWidth < 860) {
        setSpreadMode("single");
      } else {
        setSpreadMode("double");
      }
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Muat pustaka PDF.js secara dinamis & buka dokumen PDF
  useEffect(() => {
    if (!fileUrl || !fileUrl.toLowerCase().includes(".pdf")) {
      setPdfDoc(null);
      setPdfRenderFailed(false);
      return;
    }

    let cancelled = false;
    setIsPdfLoading(true);
    setPdfRenderFailed(false);

    const loadPdfJsAndOpen = async () => {
      try {
        const w = window as any;
        if (!w.pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[data-pdfjs="true"]');
            if (existing) {
              existing.addEventListener("load", () => resolve());
              existing.addEventListener("error", () => reject());
              return;
            }
            const script = document.createElement("script");
            script.src =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.async = true;
            script.dataset.pdfjs = "true";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Gagal memuat PDF.js"));
            document.head.appendChild(script);
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error("pdfjsLib tidak tersedia");

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          withCredentials: false,
        });
        const doc = await loadingTask.promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setPdfNumPages(doc.numPages || propTotalPages || 24);
        try {
          const firstPage = await doc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1 });
          if (vp.width && vp.height && vp.height > 0) {
            setPageAspectRatio(vp.width / vp.height);
          }
        } catch {
          // Tetap gunakan default 0.707
        }
        setIsPdfLoading(false);
      } catch {
        if (cancelled) return;
        setPdfDoc(null);
        setPdfRenderFailed(true);
        setIsPdfLoading(false);
      }
    };

    loadPdfJsAndOpen();
    return () => {
      cancelled = true;
    };
  }, [fileUrl, propTotalPages]);

  // Hitung nomor halaman Kiri & Kanan untuk mode Spread 2 Halaman seperti FlipHTML5
  // Halaman 1 = Sampul Depan (Kanan, sedangkan Kiri adalah Sampul Dalam)
  // Halaman 2-3, 4-5, 6-7, dst. berdampingan Kiri & Kanan
  const leftPageNum =
    spreadMode === "single"
      ? currentPage
      : currentPage <= 1
        ? 0 // 0 artinya Sampul Dalam Kiri
        : currentPage % 2 === 0
          ? currentPage
          : currentPage - 1;

  const rightPageNum =
    spreadMode === "single"
      ? currentPage
      : currentPage <= 1
        ? 1
        : leftPageNum + 1 <= effectiveTotalPages
          ? leftPageNum + 1
          : 0;

  // Render halaman PDF ke <canvas> dengan double-buffering dan pembatalan render aktif (anti-glitch / anti-flicker)
  const renderPageToCanvas = useCallback(
    async (
      pageNumber: number,
      canvas: HTMLCanvasElement | null,
      side: "left" | "right"
    ) => {
      if (!pdfDoc || !canvas || pageNumber < 1 || pageNumber > pdfNumPages) return;

      // Batalkan render yang masih berjalan pada kanvas ini untuk mencegah tabrakan PDF.js
      if (activeRenderTasksRef.current[side]) {
        try {
          activeRenderTasksRef.current[side].cancel();
        } catch {}
        activeRenderTasksRef.current[side] = null;
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = 600 * (zoom / 100);
        const dpr = Math.min(
          typeof window !== "undefined" ? window.devicePixelRatio || 1.5 : 1.5,
          2
        );
        const scale = (targetWidth / baseViewport.width) * dpr;
        const viewport = page.getViewport({ scale });

        // Double-buffering: Gambar pada canvas di memori terlebih dahulu agar tidak ada layar putih / blank kedip
        const offscreen = document.createElement("canvas");
        offscreen.width = Math.floor(viewport.width);
        offscreen.height = Math.floor(viewport.height);
        const offContext = offscreen.getContext("2d", { alpha: false });
        if (!offContext) return;

        offContext.fillStyle = "#ffffff";
        offContext.fillRect(0, 0, offscreen.width, offscreen.height);

        const renderTask = page.render({
          canvasContext: offContext,
          viewport,
        });

        activeRenderTasksRef.current[side] = renderTask;
        await renderTask.promise;
        activeRenderTasksRef.current[side] = null;

        // Salin ke kanvas utama secara instan dalam 1 frame
        const context = canvas.getContext("2d");
        if (!context) return;

        if (canvas.width !== offscreen.width) canvas.width = offscreen.width;
        if (canvas.height !== offscreen.height) canvas.height = offscreen.height;

        context.drawImage(offscreen, 0, 0);

        try {
          page.cleanup?.();
        } catch {}
      } catch (err: any) {
        if (err?.name === "RenderingCancelledException") {
          return;
        }
      }
    },
    [pdfDoc, pdfNumPages, zoom]
  );

  useEffect(() => {
    if (!pdfDoc) return;
    if (spreadMode === "single") {
      renderPageToCanvas(currentPage, leftCanvasRef.current, "left");
    } else {
      if (leftPageNum >= 1) {
        renderPageToCanvas(leftPageNum, leftCanvasRef.current, "left");
      }
      if (rightPageNum >= 1) {
        renderPageToCanvas(rightPageNum, rightCanvasRef.current, "right");
      }
    }
  }, [pdfDoc, spreadMode, currentPage, leftPageNum, rightPageNum, renderPageToCanvas]);

  const triggerFlip = useCallback(
    (direction: "next" | "prev") => {
      if (flippingState) return;

      let targetPage: number;
      if (spreadMode === "single") {
        targetPage =
          direction === "next"
            ? Math.min(effectiveTotalPages, currentPage + 1)
            : Math.max(1, currentPage - 1);
      } else {
        // Mode 2 Halaman (Spread): pastikan perpindahan spread selalu presisi 2 halaman
        if (direction === "next") {
          targetPage =
            currentPage <= 1
              ? 2
              : Math.min(
                  effectiveTotalPages,
                  currentPage % 2 === 0 ? currentPage + 2 : currentPage + 1
                );
        } else {
          targetPage =
            currentPage <= 2
              ? 1
              : Math.max(
                  1,
                  currentPage % 2 === 0 ? currentPage - 2 : currentPage - 3
                );
        }
      }

      if (targetPage === currentPage) return;

      if (soundEnabled) {
        playPaperFlipSound();
      }

      setFlippingState(direction);
      setTimeout(() => {
        onPageChange(targetPage);
      }, 180);
      setTimeout(() => {
        setFlippingState(null);
      }, 380);
    },
    [flippingState, spreadMode, currentPage, effectiveTotalPages, soundEnabled, onPageChange]
  );

  // Navigasi keyboard langsung di viewer FlipHTML5
  useEffect(() => {
    const handleViewerKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        triggerFlip("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        triggerFlip("prev");
      }
    };
    window.addEventListener("keydown", handleViewerKeyDown);
    return () => window.removeEventListener("keydown", handleViewerKeyDown);
  }, [triggerFlip]);

  // Auto-Flip Slideshow Timer
  useEffect(() => {
    if (!isAutoFlip) return;
    const timer = setInterval(() => {
      if (currentPage >= effectiveTotalPages) {
        setIsAutoFlip(false);
      } else {
        triggerFlip("next");
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoFlip, currentPage, effectiveTotalPages, triggerFlip]);

  // Helper untuk membuat isi halaman buku ilustrasi jika bukan PDF canvas atau halaman sampul dalam
  const getSimulatedPageContent = (pageNum: number) => {
    if (pageNum === 0) {
      // Sampul Dalam Kiri (Inside Front Cover / Endpaper)
      return {
        isInsideCover: true,
        isCover: false,
        title: book.title,
        paragraphs: [],
      };
    }
    if (pageNum === 1 && !pdfDoc) {
      return {
        isInsideCover: false,
        isCover: true,
        title: book.title,
        paragraphs: [book.synopsis],
      };
    }

    const allParagraphs: string[] = [];
    if (book.chapters && book.chapters.length > 0) {
      book.chapters.forEach((ch) => {
        if (ch.paragraphs) allParagraphs.push(...ch.paragraphs);
      });
    }
    if (allParagraphs.length === 0) {
      allParagraphs.push(
        book.synopsis || "Selamat membaca koleksi buku digital perpustakaan sekolah.",
        "Buku ini disajikan dalam format interaktif FlipHTML5 3D sehingga kamu dapat membalik setiap lembaran halaman layaknya membaca buku cetak asli di meja perpustakaan."
      );
    }

    const p1 = allParagraphs[(pageNum * 2 - 2) % allParagraphs.length];
    const p2 = allParagraphs[(pageNum * 2 - 1) % allParagraphs.length];

    return {
      isInsideCover: false,
      isCover: false,
      title: `Bagian ${Math.ceil(pageNum / 2)} • ${book.title}`,
      paragraphs: [p1, p2],
    };
  };

  const paperBgClass =
    theme === "night"
      ? "bg-[#1A202C] text-slate-100 border-slate-700"
      : theme === "sepia"
        ? "bg-[#F6EEDB] text-[#3E2723] border-[#D7C9AA]"
        : "bg-[#FFFEFA] text-slate-800 border-stone-200";

  const renderSingleSheetContent = (
    pageNum: number,
    side: "left" | "right",
    canvasRef: React.RefObject<HTMLCanvasElement>
  ) => {
    // 1. Jika halaman 0 (Sampul Dalam Kiri saat berada di Halaman 1)
    if (pageNum === 0 && side === "left") {
      return (
        <div className="h-full w-full flex flex-col items-center justify-between p-8 text-center bg-gradient-to-br from-teal-950 via-slate-900 to-teal-900 text-white select-none">
          <div className="text-[11px] font-bold uppercase tracking-widest text-teal-300/90 border border-teal-700/60 rounded-full px-3.5 py-1">
            {schoolName}
          </div>
          <div className="space-y-4 my-auto max-w-xs">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-400/15 border border-amber-300/30 flex items-center justify-center text-amber-300">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-extrabold tracking-tight leading-snug">
              Koleksi Buku Digital Resmi Perpustakaan
            </h3>
            <p className="text-xs text-teal-200/80 leading-relaxed">
              Klik sudut kanan halaman atau tekan tombol panah kanan (→) untuk membalik lembaran buku.
            </p>
          </div>
          <div className="text-[10px] font-mono text-teal-300/70">
            ISBN: {book.isbn || "978-602-000-000-0"} • Jenjang {book.gradeLevel}
          </div>
        </div>
      );
    }

    // 2. Jika halaman kosong di akhir buku ganjil
    if (pageNum === 0 && side === "right") {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center opacity-60 select-none">
          <Sparkles className="h-8 w-8 text-primary mb-2" />
          <p className="text-sm font-bold">Akhir Buku • {book.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{schoolName}</p>
        </div>
      );
    }

    // 3. Jika PDF.js berhasil memuat dokumen PDF, gambar langsung di atas <canvas>
    if (pdfDoc && !pdfRenderFailed) {
      return (
        <div className="relative h-full w-full flex items-center justify-center bg-white overflow-hidden">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full w-auto h-auto object-contain select-none"
          />
        </div>
      );
    }

    // 4. Jika memiliki file PDF tetapi cross-origin mencegah PDF.js canvas, tampilkan halaman PDF bersih
    if (fileUrl && pdfRenderFailed) {
      return (
        <div className="relative h-full w-full bg-white overflow-hidden">
          <iframe
            src={`${fileUrl}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
            title={`${book.title} - Halaman ${pageNum}`}
            className="w-full h-full border-0"
          />
        </div>
      );
    }

    // 5. Render Halaman Buku Ilustrasi FlipHTML5 (Sampul atau Isi Bab)
    const sim = getSimulatedPageContent(pageNum);
    if (sim.isCover) {
      return (
        <div className="relative h-full w-full flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-slate-950 text-white overflow-hidden select-none">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="rounded-md bg-red-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow">
              FLIPHTML5 EDITION
            </span>
            <span className="rounded-md bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white">
              {book.gradeLevel}
            </span>
          </div>
          <div className="relative z-10 space-y-2 mt-auto pt-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
              {schoolName}
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold leading-tight drop-shadow">
              {book.title}
            </h2>
            <p className="text-xs text-slate-200 font-medium">
              Penulis: {book.author}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full flex flex-col justify-between p-6 sm:p-9 select-none">
        {/* Header Lembar Buku */}
        <div className="flex items-center justify-between border-b border-current/10 pb-2.5 text-[10px] font-bold uppercase tracking-wider opacity-60">
          <span className="truncate max-w-[180px]">{schoolName}</span>
          <span className="truncate max-w-[180px]">{book.title}</span>
        </div>

        {/* Isi Lembar Buku */}
        <div className="my-auto py-4 space-y-4 text-left font-serif">
          {pageNum % 2 === 0 && (
            <div className="inline-block rounded-md bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-sans font-bold">
              {sim.title}
            </div>
          )}
          {sim.paragraphs.map((para, i) => (
            <p
              key={i}
              className={cn(
                "text-sm sm:text-[15px] leading-[1.85] text-justify",
                i === 0 &&
                  pageNum % 2 === 0 &&
                  "first-letter:float-left first-letter:text-4xl first-letter:font-extrabold first-letter:pr-2.5 first-letter:leading-none first-letter:text-primary"
              )}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Footer Nomor Halaman */}
        <div className="flex items-center justify-between border-t border-current/10 pt-2.5 text-[11px] font-mono font-bold opacity-75">
          <span>{side === "left" ? `Halaman ${pageNum}` : "PustakaKita FlipBook"}</span>
          <span>{side === "right" ? `Halaman ${pageNum}` : `Jenjang ${book.gradeLevel}`}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between min-h-0 select-none">
      {/* Panggung Meja Baca FlipHTML5 (Dark Wood / Velvet Stage Backdrop) */}
      <div
        className="relative w-full flex-1 min-h-0 flex items-center justify-center py-1 my-auto"
        style={{ perspective: "2400px" }}
      >
        {/* Tombol Panah Kiri Mengambang (Ala FlipHTML5) */}
        <button
          type="button"
          disabled={currentPage <= 1 || !!flippingState}
          onClick={() => triggerFlip("prev")}
          className="hidden sm:flex absolute left-0 lg:-left-4 z-30 h-12 w-12 items-center justify-center rounded-full bg-slate-900/80 text-white border border-white/15 shadow-xl hover:bg-primary hover:scale-110 disabled:opacity-25 disabled:pointer-events-none transition-all"
          title="Lembar Sebelumnya (Panah Kiri)"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Loading Overlay PDF.js */}
        {isPdfLoading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-xs rounded-2xl">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900 text-white px-5 py-3.5 shadow-2xl border border-white/10">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
              <span className="text-xs font-bold">
                Menyiapkan Lembaran FlipHTML5 3D...
              </span>
            </div>
          </div>
        )}

        {/* BUKU TERBUKA 3D (SPREAD 2 HALAMAN ATAU 1 HALAMAN) */}
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformStyle: "preserve-3d",
            aspectRatio:
              spreadMode === "double"
                ? `${pageAspectRatio * 2}`
                : `${pageAspectRatio}`,
            maxHeight: "calc(100vh - 146px)",
            maxWidth:
              spreadMode === "double"
                ? "min(96vw, 1150px)"
                : "min(92vw, 560px)",
            width: "auto",
            height: "100%",
          }}
          className="relative flex items-stretch justify-center transition-transform duration-300 ease-out"
        >
          {/* Ketebalan Tumpukan Kertas Kiri (3D Paper Stack Edge) */}
          {spreadMode === "double" && (
            <div
              aria-hidden="true"
              className="w-2.5 sm:w-3.5 rounded-l-md bg-gradient-to-r from-stone-400 via-stone-200 to-stone-300 border-y border-l border-stone-400 shadow-[-10px_18px_35px_rgba(0,0,0,0.35)]"
            />
          )}

          {/* ======================== LEMBAR HALAMAN KIRI ======================== */}
          <div
            onClick={() => {
              if (spreadMode === "double" && currentPage > 1) {
                triggerFlip("prev");
              }
            }}
            onMouseEnter={() => setHoverCorner("left")}
            onMouseLeave={() => setHoverCorner(null)}
            className={cn(
              "relative flex-1 overflow-hidden border-y-2 border-l-2 shadow-[0_20px_50px_rgba(0,0,0,0.28)] cursor-pointer select-none",
              paperBgClass,
              spreadMode === "single" && "rounded-xl border-r-2"
            )}
          >
            {/* Bayangan Lengkungan Jilid Tengah (Spine Shadow di tepi kanan halaman kiri) */}
            {spreadMode === "double" && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/20 via-black/5 to-transparent z-20"
              />
            )}

            {/* Sudut Lipatan Kertas Kiri Bawah (Page Curl Hover) */}
            {currentPage > 1 && (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute bottom-0 left-0 z-20 transition-all duration-300 bg-gradient-to-tr from-stone-300 via-stone-100 to-white shadow-[3px_-3px_10px_rgba(0,0,0,0.2)] rounded-tr-xl",
                  hoverCorner === "left" ? "w-10 h-10 opacity-100" : "w-4 h-4 opacity-60"
                )}
              />
            )}

            {renderSingleSheetContent(leftPageNum, "left", leftCanvasRef)}
          </div>

          {/* ======================== LIPATAN TENGAH BUKU (SPINE CREASE) ======================== */}
          {spreadMode === "double" && (
            <div
              aria-hidden="true"
              className="w-1.5 bg-gradient-to-r from-stone-700 via-stone-900 to-stone-700 z-30 shadow-inner"
            />
          )}

          {/* ======================== LEMBAR HALAMAN KANAN (UNTUK SPREAD 2 HALAMAN) ======================== */}
          {spreadMode === "double" && (
            <div
              onClick={() => {
                if (currentPage < effectiveTotalPages) {
                  triggerFlip("next");
                }
              }}
              onMouseEnter={() => setHoverCorner("right")}
              onMouseLeave={() => setHoverCorner(null)}
              className={cn(
                "relative flex-1 overflow-hidden border-y-2 border-r-2 shadow-[0_20px_50px_rgba(0,0,0,0.28)] cursor-pointer select-none",
                paperBgClass
              )}
            >
              {/* Bayangan Lengkungan Jilid Tengah (Spine Shadow di tepi kiri halaman kanan) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/20 via-black/5 to-transparent z-20"
              />

              {/* Sudut Lipatan Kertas Kanan Bawah Interaktif (FlipHTML5 Corner Curl) */}
              {currentPage < effectiveTotalPages && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute bottom-0 right-0 z-20 transition-all duration-300 bg-gradient-to-tl from-stone-300 via-stone-100 to-white shadow-[-3px_-3px_10px_rgba(0,0,0,0.22)] rounded-tl-xl",
                    hoverCorner === "right" ? "w-11 h-11 opacity-100" : "w-5 h-5 opacity-75"
                  )}
                />
              )}

              {renderSingleSheetContent(rightPageNum, "right", rightCanvasRef)}
            </div>
          )}

          {/* Ketebalan Tumpukan Kertas Kanan (3D Paper Stack Edge) */}
          {spreadMode === "double" && (
            <div
              aria-hidden="true"
              className="w-2.5 sm:w-3.5 rounded-r-md bg-gradient-to-l from-stone-400 via-stone-200 to-stone-300 border-y border-r border-stone-400 shadow-[10px_18px_35px_rgba(0,0,0,0.35)]"
            />
          )}

          {/* ======================== ANIMASI 3D LEAF FLIPPING OVERLAY ======================== */}
          {flippingState && (
            <div
              aria-hidden="true"
              style={{
                transformOrigin:
                  flippingState === "next" ? "left center" : "right center",
                animation:
                  flippingState === "next"
                    ? "flipPageNext 380ms cubic-bezier(0.4, 0, 0.2, 1) forwards"
                    : "flipPagePrev 380ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className={cn(
                "pointer-events-none absolute inset-y-0 z-40 w-1/2 rounded-sm shadow-2xl border border-stone-300/80",
                paperBgClass,
                flippingState === "next" ? "right-0" : "left-0",
                spreadMode === "single" && "w-full inset-x-0"
              )}
            >
              <div className="h-full w-full bg-gradient-to-r from-black/15 via-transparent to-black/10" />
            </div>
          )}
        </div>

        {/* Tombol Panah Kanan Mengambang (Ala FlipHTML5) */}
        <button
          type="button"
          disabled={currentPage >= effectiveTotalPages || !!flippingState}
          onClick={() => triggerFlip("next")}
          className="hidden sm:flex absolute right-0 lg:-right-4 z-30 h-12 w-12 items-center justify-center rounded-full bg-slate-900/80 text-white border border-white/15 shadow-xl hover:bg-primary hover:scale-110 disabled:opacity-25 disabled:pointer-events-none transition-all"
          title="Lembar Selanjutnya (Panah Kanan)"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Keyframes CSS untuk Animasi Membalik Lembar Kertas 3D */}
      <style jsx>{`
        @keyframes flipPageNext {
          0% {
            transform: rotateY(0deg);
            opacity: 1;
            box-shadow: -6px 0 20px rgba(0, 0, 0, 0.2);
          }
          50% {
            transform: rotateY(-90deg);
            opacity: 0.95;
            box-shadow: -15px 0 35px rgba(0, 0, 0, 0.35);
          }
          100% {
            transform: rotateY(-180deg);
            opacity: 0;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
          }
        }
        @keyframes flipPagePrev {
          0% {
            transform: rotateY(0deg);
            opacity: 1;
            box-shadow: 6px 0 20px rgba(0, 0, 0, 0.2);
          }
          50% {
            transform: rotateY(90deg);
            opacity: 0.95;
            box-shadow: 15px 0 35px rgba(0, 0, 0, 0.35);
          }
          100% {
            transform: rotateY(180deg);
            opacity: 0;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
          }
        }
      `}</style>

      {/* Laci Miniatur Halaman (FlipHTML5 Thumbnail Strip Drawer) */}
      {showThumbnails && (
        <div className="w-full max-w-4xl mt-2 rounded-2xl bg-slate-900/95 text-white border border-white/15 p-3.5 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between mb-2.5 text-xs font-bold text-slate-300">
            <span>Pilih Halaman Cepat ({effectiveTotalPages} Halaman)</span>
            <button
              type="button"
              onClick={() => setShowThumbnails(false)}
              className="text-amber-400 hover:underline text-xs"
            >
              Tutup Galeri
            </button>
          </div>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {Array.from({ length: Math.min(effectiveTotalPages, 60) }, (_, idx) => idx + 1).map(
              (pNum) => {
                const isSelected =
                  pNum === currentPage ||
                  (spreadMode === "double" &&
                    (pNum === leftPageNum || pNum === rightPageNum));
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playPaperFlipSound();
                      onPageChange(pNum);
                    }}
                    className={cn(
                      "shrink-0 w-14 h-20 rounded-lg border flex flex-col items-center justify-center transition-all text-xs font-mono font-bold",
                      isSelected
                        ? "bg-primary text-primary-foreground border-amber-400 scale-105 shadow-md"
                        : "bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700"
                    )}
                  >
                    <span className="text-[9px] uppercase opacity-70">Hal</span>
                    <span className="text-sm font-extrabold">{pNum}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DOCK KONTROL BAWAH KHAS FLIPHTML5 (FLOATING DARK GLASS TOOLBAR)       */}
      {/* ===================================================================== */}
      <div className="w-full max-w-4xl mt-1.5 rounded-2xl bg-slate-900/95 text-white backdrop-blur-md border border-white/15 px-3 sm:px-5 py-2 shadow-2xl flex flex-wrap items-center justify-between gap-2 shrink-0 z-30">
        {/* Kiri: Mode Tampilan, Galeri Miniatur, Suara Kertas, Auto-Flip */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setShowThumbnails((v) => !v)}
            className={cn(
              "p-2 rounded-xl transition-colors",
              showThumbnails ? "bg-primary text-white" : "hover:bg-white/10 text-slate-200"
            )}
            title="Galeri Miniatur Halaman (Thumbnails)"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              setSpreadMode((m) => (m === "double" ? "single" : "double"))
            }
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-bold text-slate-200 transition-colors"
            title="Ganti Mode 2 Halaman (Spread) / 1 Halaman"
          >
            {spreadMode === "double" ? (
              <>
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span>2 Hal</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 text-sky-400" />
                <span>1 Hal</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className={cn(
              "p-2 rounded-xl transition-colors",
              soundEnabled ? "text-emerald-400 hover:bg-white/10" : "text-slate-400 hover:bg-white/10"
            )}
            title={
              soundEnabled
                ? "Suara Balik Kertas Aktif (Klik untuk Matikan)"
                : "Suara Balik Kertas Nonaktif"
            }
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsAutoFlip((a) => !a)}
            className={cn(
              "p-2 rounded-xl transition-colors",
              isAutoFlip ? "bg-amber-500 text-slate-950" : "hover:bg-white/10 text-slate-200"
            )}
            title={
              isAutoFlip
                ? "Hentikan Putar Halaman Otomatis"
                : "Putar Halaman Otomatis (Auto-Flip)"
            }
          >
            {isAutoFlip ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Tengah: Navigasi Halaman FlipHTML5 (|<<  <  Hal X / Y  >  >>|) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => {
              if (soundEnabled) playPaperFlipSound();
              onPageChange(1);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="Halaman Pertama (Sampul)"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={currentPage <= 1 || !!flippingState}
            onClick={() => triggerFlip("prev")}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-primary disabled:opacity-30 transition-colors"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 rounded-xl px-3 py-1 text-xs font-mono font-bold">
            <span className="text-amber-400">
              {spreadMode === "double" && leftPageNum > 0 && rightPageNum > 0
                ? `${leftPageNum}-${rightPageNum}`
                : currentPage}
            </span>
            <span className="text-slate-400">/</span>
            <span>{effectiveTotalPages}</span>
          </div>

          <button
            type="button"
            disabled={currentPage >= effectiveTotalPages || !!flippingState}
            onClick={() => triggerFlip("next")}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-primary disabled:opacity-30 transition-colors"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={currentPage >= effectiveTotalPages}
            onClick={() => {
              if (soundEnabled) playPaperFlipSound();
              onPageChange(effectiveTotalPages);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="Halaman Terakhir"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>

        {/* Kanan: Kontrol Zoom & Layar Penuh */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(75, z - 10))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
            title="Perkecil Buku"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-mono font-bold px-1 min-w-[40px] text-center">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(135, z + 10))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
            title="Perbesar Buku"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
              title="Buka File PDF Asli di Tab Baru"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
              title="Layar Penuh (Fullscreen)"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

