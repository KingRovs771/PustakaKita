"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  WifiOff,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { NISNLoginForm } from "@/components/NISNLoginForm";
import { useLibrary, AdminSessionProfile } from "@/context/LibraryContext";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const { books, updateStudentProfile, loginAdminSession, schoolProfile } = useLibrary();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const previewBooks = books.slice(0, 3);

  const handleSuccessStudentLogin = (studentData: {
    nisn: string;
    name: string;
    grade: "SD" | "SMP" | "SMA";
    className: string;
    isGuest?: boolean;
  }) => {
    updateStudentProfile({
      nisn: studentData.nisn,
      name: studentData.name,
      grade: studentData.grade,
      className: studentData.className,
      isGuest: studentData.isGuest,
    });
    toast.success(`Selamat datang, ${studentData.name}!`, {
      description: "Sedang menyiapkan rak bukumu...",
    });
    router.push("/library");
  };

  const handleAdminLogin = (adminData: AdminSessionProfile) => {
    loginAdminSession(adminData);
    toast.success(`Berhasil masuk sebagai ${adminData.fullName}`, {
      description: "Sesi Admin Pustakawan disimpan otomatis selama 7 hari.",
    });
    router.push("/admin");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen bg-background">
      {/* Kolom Kiri (lg:col-span-7): Area Visual Penjenamaan Sekolah (DESIGN.md Section 5.a) */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between bg-teal-900 text-white p-12 overflow-hidden">
        {/* Pola Geometris Buku / Batik Halus (opacity-10) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#ffffff 1.5px, transparent 1.5px), radial-gradient(#ffffff 1.5px, #134e4a 1.5px)",
            backgroundSize: "32px 32px",
            backgroundPosition: "0 0, 16px 16px",
          }}
        />

        {/* Header Brand Kiri */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/library" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-extrabold shadow-md">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight block">
                PustakaKita
              </span>
              <span className="text-xs text-teal-200 block">
                Perpustakaan Digital Siswa Indonesia
              </span>
            </div>
          </Link>

          <Badge className="bg-teal-800 text-teal-100 border-teal-700">
            Single-Tenant • Zero Cost Infra
          </Badge>
        </div>

        {/* Hero Copy & Preview 3 Buku Pilihan Minggu Ini */}
        <div className="relative z-10 space-y-8 my-auto py-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-800/90 border border-teal-700 px-3.5 py-1 text-xs font-semibold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Koleksi Buku Sekolah Elektronik (BSE) & Karya Guru</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Jelajahi Ribuan Cerita & Ilmu Pengetahuan dari Sekolahmu
            </h2>
            <p className="text-base text-teal-100/90 leading-relaxed">
              Baca buku favoritmu dari HP maupun komputer sekolah. Dilengkapi fitur
              Suara Bacaan (Text-to-Speech), Kamus Sains Instan, dan penyimpanan
              otomatis tanpa takut kehilangan halaman terakhir.
            </p>
          </div>

          {/* 3 Kartu Buku Preview yang Bisa Diputar Sedikit saat Hover */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-200">
              Buku Pilihan Minggu Ini:
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-xl">
              {previewBooks.map((book, i) => (
                <div
                  key={book.id}
                  onClick={() => router.push(`/book/${book.id}`)}
                  className="group cursor-pointer rounded-xl bg-teal-950/60 border border-teal-800/80 p-3 backdrop-blur-xs transition-all duration-300 hover:-translate-y-2 hover:rotate-1 hover:border-amber-400/60"
                >
                  <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden mb-2.5 bg-teal-900">
                    <Image
                      src={book.coverUrl}
                      alt={`Sampul ${book.title}`}
                      fill
                      sizes="150px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-xs font-bold text-white line-clamp-1">
                    {book.title}
                  </p>
                  <p className="text-[11px] text-teal-300 truncate">
                    Jenjang {book.gradeLevel} • {book.estimatedReadMinutes} mnt
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Keunggulan Privasi & Offline */}
        <div className="relative z-10 flex items-center justify-between text-xs text-teal-200 border-t border-teal-800/80 pt-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              Tanpa Registrasi Email
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              Bisa Dibaca Offline (PWA)
            </span>
          </div>
          <Link
            href="/library"
            className="inline-flex items-center gap-1 font-bold text-amber-300 hover:underline"
          >
            Lihat Katalog Langsung <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Kolom Kanan (lg:col-span-5): Area Terfokus Formulir Login */}
      <main className="lg:col-span-5 flex flex-col justify-between lg:justify-center items-center p-4 sm:p-8 lg:p-12 min-h-screen">
        {/* Header Ringkas Khusus Mobile */}
        <div className="w-full max-w-md flex lg:hidden items-center justify-between py-2 mb-4 border-b border-border">
          <Link href="/library" className="flex items-center gap-2 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span>PustakaKita</span>
          </Link>
          <Badge variant="secondary">{schoolProfile.shortName}</Badge>
        </div>

        <div className="w-full max-w-md space-y-4 my-auto">
          {/* Banner Peringatan Jaringan Tidak Stabil / Offline (Section 5.a) */}
          {isOffline && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/70 dark:border-amber-800 p-3.5 text-xs font-medium text-amber-900 dark:text-amber-200"
            >
              <WifiOff className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Koneksi internetmu sedang tidak stabil. Kamu masih bisa membuka
                buku yang sudah pernah diunduh di perangkat ini.
              </span>
            </div>
          )}

          <NISNLoginForm
            onSuccessLogin={handleSuccessStudentLogin}
            onAdminLogin={handleAdminLogin}
            schoolName={schoolProfile.schoolName}
            allowGuestMode={true}
          />
        </div>

        {/* Tombol Bantuan Bawah untuk Mobile */}
        <div className="w-full max-w-md text-center pt-6 pb-2 text-xs text-muted-foreground">
          Lupa PIN Kelas? Hubungi Guru Pustakawan di Ruang Perpustakaan Sekolah.
        </div>
      </main>
    </div>
  );
}

