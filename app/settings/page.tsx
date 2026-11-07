"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  WifiOff,
  HardDrive,
  Type,
  Trash2,
  LogOut,
  Check,
  ShieldCheck,
  KeyRound,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppNavigation } from "@/components/AppNavigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLibrary } from "@/context/LibraryContext";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";
import { cn } from "@/lib/utils";

const AVATAR_CHOICES = [
  { id: "pelajar-1", label: "Siswa SMP", emoji: "👦🏽" },
  { id: "pelajar-2", label: "Siswi SMP", emoji: "🧕🏽" },
  { id: "pelajar-3", label: "Siswa SD", emoji: "🧒🏽" },
  { id: "pelajar-4", label: "Siswi SD", emoji: "👧🏽" },
  { id: "pelajar-5", label: "Siswa SMA", emoji: "🧑🏽‍🎓" },
  { id: "pelajar-6", label: "Siswi SMA", emoji: "👩🏽‍🔬" },
  { id: "pelajar-7", label: "Ilmuwan", emoji: "🔭" },
  { id: "pelajar-8", label: "Penjelajah", emoji: "🧭" },
  { id: "pelajar-9", label: "Sastrawan", emoji: "🪶" },
  { id: "pelajar-10", label: "Astronot", emoji: "🚀" },
  { id: "pelajar-11", label: "Flora", emoji: "🌱" },
  { id: "pelajar-12", label: "Garuda", emoji: "🦅" },
];

export default function SettingsPage() {
  const router = useRouter();
  const {
    student,
    updateStudentProfile,
    readerSettings,
    updateReaderSettings,
    offlineCachedIds,
    clearCompletedOfflineCache,
  } = useLibrary();
  const { isLowBandwidth, toggleLowBandwidth } = usePerformanceMode();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  const estimatedMb = (offlineCachedIds.length * 1.4).toFixed(1);
  const isLoggedIn = !student.isGuest && Boolean(student.nisn);

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin)) {
      toast.error("PIN Baru harus terdiri dari tepat 6 angka.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("Konfirmasi PIN Baru tidak cocok.");
      return;
    }

    setIsUpdatingPin(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: "student",
          nisn: student.nisn,
          currentSecret: currentPin.trim() || undefined,
          verifyName: student.name,
          newSecret: newPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui PIN Siswa.");
        setIsUpdatingPin(false);
        return;
      }
      toast.success(data.message || "PIN Siswa berhasil diperbarui!");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setIsUpdatingPin(false);
    } catch {
      toast.error("Gagal menghubungi server perpustakaan.");
      setIsUpdatingPin(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-12">
        <AppNavigation />
        <main
          id="main-content"
          className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 py-16 flex items-center justify-center"
        >
          <Card className="w-full text-center p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Silakan Masuk Terlebih Dahulu
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Halaman Profil Pelajar hanya dapat diakses setelah kamu masuk menggunakan Nomor Induk Siswa Nasional (NISN).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => router.push("/login")}
                className="w-full sm:w-auto font-bold gap-2"
              >
                <User className="h-4 w-4" />
                Masuk dengan NISN
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full sm:w-auto"
              >
                Kembali ke Beranda
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-12">
      <AppNavigation />

      <main
        id="main-content"
        className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground">
            Profil & Pengaturan Kenyamanan
          </h1>
          <p className="text-sm text-muted-foreground">
            Sesuaikan tampilan rak buku, ukuran teks bawaan, dan penyimpanan
            offline perangkatmu.
          </p>
        </div>

        {/* 1. Kartu Identitas Siswa & 12 Pilihan Avatar Karakter Pelajar (Section 5.h DESIGN.md) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Kartu Identitas Pelajar
            </CardTitle>
            <CardDescription>{student.schoolName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-secondary/60 p-4 border border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-foreground">
                    {student.name}
                  </span>
                  <Badge variant="default">Jenjang {student.grade}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {student.className} • NISN:{" "}
                  <span className="font-mono font-bold text-foreground">
                    {student.nisn}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {(["SD", "SMP", "SMA"] as const).map((g) => (
                  <Button
                    key={g}
                    size="sm"
                    variant={student.grade === g ? "default" : "outline"}
                    onClick={() => {
                      updateStudentProfile({ grade: g });
                      toast.success(`Jenjang disesuaikan ke ${g}`);
                    }}
                    className="h-9 text-xs"
                  >
                    {g}
                  </Button>
                ))}
              </div>
            </div>

            {/* Pilihan 12 Avatar Karakter Pelajar Indonesia */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2.5">
                Pilih Karakter Avatarmu (12 Karakter Pelajar):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {AVATAR_CHOICES.map((av) => {
                  const selected = student.avatarId === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        updateStudentProfile({ avatarId: av.id });
                        toast.success(`Avatar ${av.label} dipilih!`);
                      }}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all min-h-[64px]",
                        selected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                          : "border-border bg-card hover:bg-secondary/60"
                      )}
                    >
                      <span className="text-2xl" role="img" aria-label={av.label}>
                        {av.emoji}
                      </span>
                      <span className="mt-1 text-[10px] font-semibold text-foreground truncate max-w-full">
                        {av.label}
                      </span>
                      {selected && (
                        <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1B. Keamanan Akun & Reset PIN Siswa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Keamanan Akun & Reset PIN Masuk
            </CardTitle>
            <CardDescription>
              Perbarui 6 digit PIN masuk perpustakaanmu kapan saja agar akun tetap aman.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    PIN Lama (Opsional)
                  </label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6 digit PIN lama"
                    className="font-mono tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    PIN Baru (6 Angka)
                  </label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="font-mono tracking-widest"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Ulangi PIN Baru
                  </label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="font-mono tracking-widest"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground">
                  NISN Aktif: <span className="font-mono font-bold text-foreground">{student.nisn}</span> ({student.name})
                </p>
                <Button type="submit" size="sm" disabled={isUpdatingPin} className="font-bold gap-1.5">
                  {isUpdatingPin ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      Simpan PIN Baru
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 2. Pengaturan Pengalaman & Performa (Mode Hemat Kuota & Baterai) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-accent" />
              Mode Hemat Kuota & Performa Perangkat
            </CardTitle>
            <CardDescription>
              Sangat direkomendasikan untuk jaringan seluler atau HP dengan RAM di bawah 4 GB.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-bold text-foreground">
                Aktifkan Mode Hemat Kuota & Baterai
              </div>
              <p className="text-xs text-muted-foreground">
                Matikan efek rak 3D dan muat gambar sampul dengan ukuran lebih hemat.
              </p>
            </div>
            <Switch
              checked={isLowBandwidth}
              onCheckedChange={(checked) => {
                toggleLowBandwidth(checked);
                toast.success(
                  checked
                    ? "Mode Hemat Kuota diaktifkan (Tampilan 2D Cepat)"
                    : "Mode Visual Penuh diaktifkan"
                );
              }}
              aria-label="Sakelar Mode Hemat Kuota dan Baterai"
            />
          </CardContent>
        </Card>

        {/* 3. Preferensi Baca Bawaan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              Preferensi Baca Default
            </CardTitle>
            <CardDescription>
              Pengaturan ini otomatis diterapkan setiap kali kamu membuka halaman buku.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "day", label: "Kertas Siang (#FAF8F5)" },
                { id: "sepia", label: "Kertas Senja (#F4ECD8)" },
                { id: "night", label: "Mode Malam (#12161F)" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    updateReaderSettings({
                      theme: t.id as "day" | "sepia" | "night",
                    })
                  }
                  className={cn(
                    "rounded-xl border p-3 text-xs font-bold transition-all min-h-[44px]",
                    readerSettings.theme === t.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "serif", label: "Huruf Serif (Literata)" },
                { id: "sans", label: "Huruf Sans (Jakarta)" },
                { id: "dyslexic", label: "Ramah Disleksia (Lexend)" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() =>
                    updateReaderSettings({
                      fontFamily: f.id as "serif" | "sans" | "dyslexic",
                    })
                  }
                  className={cn(
                    "rounded-xl border p-3 text-xs font-bold transition-all min-h-[44px]",
                    readerSettings.fontFamily === f.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Penyimpanan Offline (PWA / IndexedDB Manager) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-emerald-600" />
              Penyimpanan Offline (IndexedDB)
            </CardTitle>
            <CardDescription>
              Buku yang tersimpan di sini tetap bisa kamu baca meskipun koneksi internet terputus.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-foreground">
                {offlineCachedIds.length} Buku tersimpan untuk dibaca tanpa internet —{" "}
                <span className="text-primary">{estimatedMb} MB</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Terenkripsi lokal di perangkatmu (AES-GCM Web Crypto).
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await clearCompletedOfflineCache();
                toast.success("Cache buku yang sudah selesai berhasil dibersihkan!");
              }}
              className="gap-1.5 text-xs shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus Buku Offline yang Sudah Selesai
            </Button>
          </CardContent>
        </Card>

        {/* Tombol Keluar / Ganti Akun */}
        <div className="pt-2 flex justify-end">
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch {}
              try {
                localStorage.removeItem("pustakakita_student_v1");
              } catch {}
              toast("Kamu telah keluar dari sesi perpustakaan.");
              router.push("/login");
            }}
            className="gap-2 font-bold"
          >
            <LogOut className="h-4 w-4" />
            Keluar / Ganti Akun Siswa
          </Button>
        </div>
      </main>
    </div>
  );
}

