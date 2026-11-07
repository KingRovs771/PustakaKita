"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Trophy,
  Clock,
  BookOpen,
  Sparkles,
  Bookmark,
  CheckCircle2,
  MessageSquarePlus,
  Send,
  Compass,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { BookCard, BookCardProps } from "@/components/BookCard";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getGreetingByTime } from "@/lib/utils";
import { BookItem } from "@/lib/mock-data";

export interface StudentDashboardProps {
  student: {
    name: string;
    nisn: string;
    grade: "SD" | "SMP" | "SMA";
    className: string;
  };
  stats: {
    streakDays: number;
    booksCompleted: number;
    minutesReadThisWeek: number;
    weeklyGoalMinutes: number;
  };
  books: BookItem[];
  onSelectBook: (bookId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  stats,
  books,
  onSelectBook,
}) => {
  const router = useRouter();
  const greeting = getGreetingByTime();

  const [reviewBook, setReviewBook] = useState<BookItem | null>(null);
  const [reviewAnswer1, setReviewAnswer1] = useState("");
  const [reviewAnswer2, setReviewAnswer2] = useState("");

  // Maksimal 2 buku sedang dibaca berdampingan agar siswa fokus (DESIGN.md Section 5.e)
  const currentlyReading = books
    .filter((b) => (b.progressPercent ?? 0) > 0 && (b.progressPercent ?? 0) < 100)
    .slice(0, 2);

  const savedBooks = books.filter((b) => b.isSaved);
  const completedBooks = books.filter((b) => (b.progressPercent ?? 0) >= 100);
  const recommendedBooks = books
    .filter((b) => (b.progressPercent ?? 0) === 0)
    .slice(0, 4);

  const remainingGoalMinutes = Math.max(
    0,
    stats.weeklyGoalMinutes - stats.minutesReadThisWeek
  );
  const weeklyGoalPct = Math.min(
    100,
    Math.round((stats.minutesReadThisWeek / stats.weeklyGoalMinutes) * 100)
  );

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Keren! Ulasan bukumu berhasil dikirim ke Guru!", {
      description: `Terima kasih sudah berbagi cerita tentang "${reviewBook?.title}".`,
    });
    setReviewBook(null);
    setReviewAnswer1("");
    setReviewAnswer2("");
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Sapaan Personal & Target Mingguan (WAR Metric) */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/15 via-secondary/80 to-accent/10 border border-border p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">{student.className}</Badge>
              <span className="font-mono text-xs text-muted-foreground">
                NISN: {student.nisn}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              {greeting}, {student.name.split(" ")[0]}!
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              {remainingGoalMinutes > 0
                ? `Kamu sudah membaca ${stats.minutesReadThisWeek} menit minggu ini. Yuk, tambah ${remainingGoalMinutes} menit lagi untuk mencapai target mingguanmu!`
                : `Keren! Kamu sudah melampaui target membaca ${stats.weeklyGoalMinutes} menit minggu ini!`}
            </p>
          </div>

          {/* Bilah Kemajuan Target Mingguan */}
          <div className="w-full lg:w-72 rounded-xl bg-card/90 backdrop-blur-xs p-4 border border-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-foreground">Target Baca Mingguan</span>
              <span className="text-primary">
                {stats.minutesReadThisWeek}/{stats.weeklyGoalMinutes} Menit
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${weeklyGoalPct}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Indikator WAR Sekolah: Aktif membaca ≥ 10 menit/minggu
            </p>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid Utama (Kolom Kiri & Tengah: Sedang Kamu Baca, Kolom Kanan: Statistik & Lencana) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Span 2 Kolom: Sedang Kamu Baca */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Sedang Kamu Baca
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              Fokus selesaikan hingga 2 buku
            </span>
          </div>

          {currentlyReading.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <p className="text-base font-medium text-foreground">
                Rak bacamu masih kosong nih. Yuk, jelajahi rak utama dan pilih buku pertamamu hari ini!
              </p>
              <Button onClick={() => router.push("/library")}>
                Jelajahi Rak Buku Utama
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {currentlyReading.map((book) => (
                <div
                  key={book.id}
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4"
                >
                  <BookCard
                    {...book}
                    variant="horizontal"
                    onSelect={onSelectBook}
                    onQuickRead={(id) =>
                      router.push(`/read/${id}?page=${book.currentPage ?? 1}`)
                    }
                  />
                  <ReadingProgressBar
                    variant="milestone-card"
                    currentPage={book.currentPage ?? 1}
                    totalPages={book.totalPages}
                    chapters={book.chapters}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Span 1 Kolom: Statistik & Lencana Literasi */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ringkasan Aktivitasmu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Rentetan Baca (Streak)
                  </div>
                  <div className="text-base font-extrabold text-foreground">
                    {stats.streakDays} Hari Beruntun
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Buku Selesai
                  </div>
                  <div className="text-base font-extrabold text-foreground">
                    {completedBooks.length} Buku Semester Ini
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-xl bg-primary/10 border border-primary/20 p-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Waktu Membaca
                  </div>
                  <div className="text-base font-extrabold text-foreground">
                    {stats.minutesReadThisWeek} Menit Minggu Ini
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kartu Lencana Literasi (SVG Inline Ringan) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                Lencana Literasi
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-secondary/60 p-2.5 border border-border">
                <Compass className="h-6 w-6 mx-auto text-sky-600 mb-1" />
                <div className="text-[11px] font-bold leading-tight">
                  Penjelajah Sains
                </div>
              </div>
              <div className="rounded-xl bg-secondary/60 p-2.5 border border-border">
                <Sparkles className="h-6 w-6 mx-auto text-amber-600 mb-1" />
                <div className="text-[11px] font-bold leading-tight">
                  Kutu Buku Pagi
                </div>
              </div>
              <div className="rounded-xl bg-secondary/60 p-2.5 border border-border">
                <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
                <div className="text-[11px] font-bold leading-tight">
                  Tuntas 3 Buku
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Tab Riwayat, Koleksi Disimpan, & Rekomendasi AI */}
      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 justify-start bg-secondary p-1.5 rounded-xl">
          <TabsTrigger value="saved" className="gap-1.5">
            <Bookmark className="h-4 w-4" />
            Disimpan untuk Nanti ({savedBooks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Selesai Dibaca ({completedBooks.length})
          </TabsTrigger>
          <TabsTrigger value="recommended" className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Rekomendasi Untukmu ({recommendedBooks.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Disimpan untuk Nanti */}
        <TabsContent value="saved" className="pt-4">
          {savedBooks.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Belum ada buku yang kamu tandai. Klik ikon pita simpan pada detail buku untuk menyimpannya di sini!
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {savedBooks.map((book) => (
                <BookCard key={book.id} {...book} onSelect={onSelectBook} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Selesai Dibaca + Tombol Tulis Ulasan Singkat */}
        <TabsContent value="completed" className="pt-4">
          {completedBooks.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Kamu belum menyelesaikan buku. Selesaikan membaca satu buku hingga halaman terakhir untuk mengumpulkan lencana literasimu di sini!
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedBooks.map((book) => (
                <Card key={book.id} className="p-4 flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="default" className="bg-emerald-600 mb-2">
                        Selesai 100%
                      </Badge>
                      <h3 className="font-bold text-base text-foreground">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectBook(book.id)}
                      className="flex-1 text-xs"
                    >
                      Lihat Buku
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setReviewBook(book)}
                      className="flex-1 text-xs gap-1.5"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      Tulis Ulasan Singkat
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Rekomendasi Personal (Collaborative Filtering pgvector UI) */}
        <TabsContent value="recommended" className="pt-4 space-y-3">
          {recommendedBooks.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Belum ada rekomendasi baru. Koleksi buku sedang disiapkan oleh pihak sekolah.
            </Card>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Disusun otomatis berdasarkan kesamaan pola baca siswa {student.grade} yang menyukai kategori Fiksi & Sains:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                {recommendedBooks.map((book) => (
                  <BookCard key={book.id} {...book} onSelect={onSelectBook} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Tulis Ulasan Singkat untuk Tugas Literasi Sekolah */}
      <Dialog
        open={!!reviewBook}
        onOpenChange={(open) => !open && setReviewBook(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Jurnal Literasi: {reviewBook?.title}</DialogTitle>
            <DialogDescription>
              Jawab 2 pertanyaan pemantik singkat di bawah ini untuk melengkapi catatan tugas bacamu.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                1. Apa bagian paling seru atau menarik dari buku ini?
              </label>
              <textarea
                required
                rows={3}
                value={reviewAnswer1}
                onChange={(e) => setReviewAnswer1(e.target.value)}
                placeholder="Ceritakan dengan bahasamu sendiri..."
                className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                2. Hal baru apa yang kamu pelajari setelah selesai membaca?
              </label>
              <textarea
                required
                rows={2}
                value={reviewAnswer2}
                onChange={(e) => setReviewAnswer2(e.target.value)}
                placeholder="Misalnya tentang semangat pantang menyerah atau istilah sains baru..."
                className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReviewBook(null)}
              >
                Batal
              </Button>
              <Button type="submit" className="gap-1.5">
                <Send className="h-4 w-4" />
                Simpan Jurnal Baca
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

