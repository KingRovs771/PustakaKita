"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Loader2,
  UserCheck,
  Lock,
  KeyRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLibrary, AdminSessionProfile } from "@/context/LibraryContext";
import { formatNISN, cn } from "@/lib/utils";

export interface NISNLoginFormProps {
  onSuccessLogin: (studentData: {
    nisn: string;
    name: string;
    grade: "SD" | "SMP" | "SMA";
    className: string;
    isGuest?: boolean;
  }) => void;
  onAdminLogin?: (adminData: AdminSessionProfile) => void;
  schoolName?: string;
  allowGuestMode?: boolean;
}

export const NISNLoginForm: React.FC<NISNLoginFormProps> = ({
  onSuccessLogin,
  onAdminLogin,
  schoolName,
  allowGuestMode = true,
}) => {
  const { adminSession, schoolProfile } = useLibrary();
  const displaySchoolName = schoolName || schoolProfile.schoolName;
  const [rawNisn, setRawNisn] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Admin Login state
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  // Reset Password / PIN state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetTargetRole, setResetTargetRole] = useState<"student" | "librarian">("student");
  const [resetNisn, setResetNisn] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [resetCurrentSecret, setResetCurrentSecret] = useState("");
  const [resetVerifyName, setResetVerifyName] = useState("");
  const [resetNewSecret, setResetNewSecret] = useState("");
  const [resetConfirmSecret, setResetConfirmSecret] = useState("");
  const [resetStatus, setResetStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const openResetModal = (role: "student" | "librarian") => {
    setResetTargetRole(role);
    setResetNisn(rawNisn);
    setResetUsername(role === "librarian" ? adminUser || "pustakawan" : "");
    setResetCurrentSecret("");
    setResetVerifyName("");
    setResetNewSecret("");
    setResetConfirmSecret("");
    setResetStatus(null);
    setIsResetOpen(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);

    if (resetTargetRole === "student") {
      const cleanNisn = resetNisn.replace(/\D/g, "");
      if (cleanNisn.length !== 10) {
        setResetStatus({ type: "error", message: "NISN harus terdiri dari 10 angka." });
        return;
      }
      if (!/^\d{6}$/.test(resetNewSecret)) {
        setResetStatus({ type: "error", message: "PIN Baru siswa harus terdiri dari 6 angka." });
        return;
      }
    } else {
      if (resetNewSecret.length < 6) {
        setResetStatus({ type: "error", message: "Kata sandi baru minimal 6 karakter." });
        return;
      }
    }

    if (resetNewSecret !== resetConfirmSecret) {
      setResetStatus({
        type: "error",
        message: resetTargetRole === "student" ? "Konfirmasi PIN baru tidak cocok." : "Konfirmasi kata sandi baru tidak cocok.",
      });
      return;
    }

    if (!resetCurrentSecret.trim() && !resetVerifyName.trim()) {
      setResetStatus({
        type: "error",
        message:
          resetTargetRole === "student"
            ? "Isi PIN Lama atau Nama Lengkap sesuai kartu pelajar untuk verifikasi."
            : "Isi Kata Sandi Lama atau Nama Lengkap Staf untuk verifikasi.",
      });
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: resetTargetRole,
          nisn: resetNisn,
          username: resetUsername,
          currentSecret: resetCurrentSecret.trim() || undefined,
          verifyName: resetVerifyName.trim() || undefined,
          newSecret: resetNewSecret,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetStatus({
          type: "error",
          message: data.error || "Gagal mereset kata sandi / PIN.",
        });
        setIsResetSubmitting(false);
        return;
      }

      setResetStatus({
        type: "success",
        message: data.message || "Berhasil memperbarui kata sandi / PIN!",
      });
      if (resetTargetRole === "student") {
        setRawNisn(resetNisn.replace(/\D/g, "").slice(0, 10));
        setPin(resetNewSecret);
      } else {
        setAdminUser(resetUsername || "pustakawan");
        setAdminPass(resetNewSecret);
      }
      setIsResetSubmitting(false);
    } catch {
      setResetStatus({
        type: "error",
        message: "Gagal menghubungi server. Periksa koneksi Anda.",
      });
      setIsResetSubmitting(false);
    }
  };

  const digitCount = rawNisn.length;
  const isValidLength = digitCount === 10;
  const isPinValid = pin.length === 6;

  const handleNisnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNums = e.target.value.replace(/\D/g, "").slice(0, 10);
    setRawNisn(onlyNums);
    if (error) setError(null);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNums = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(onlyNums);
    if (error) setError(null);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidLength) {
      setError(
        "Hmm, NISN harus terdiri dari tepat 10 angka. Coba periksa kembali kartu pelajar kamu ya!"
      );
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }

    if (!isPinValid) {
      setError("Masukkan 6 angka PIN yang diberikan oleh gurumu ya!");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nisn: rawNisn, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "NISN atau PIN tidak terdaftar. Hubungi guru perpustakaan untuk didaftarkan.");
        setShake(true);
        setTimeout(() => setShake(false), 450);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onSuccessLogin({
        nisn: rawNisn,
        name: data.student?.name || "Siswa",
        grade: (data.student?.grade as "SD" | "SMP" | "SMA") || "SMP",
        className: data.student?.className || "Kelas Aktif",
      });
    } catch {
      setIsLoading(false);
      setError("Tidak dapat terhubung ke server perpustakaan. Periksa koneksi internet atau gunakan Mode Tamu.");
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  const handleQuickGuest = () => {
    onSuccessLogin({
      nisn: "TAMU-CEPAT",
      name: "Pembaca Tamu",
      grade: "SMP",
      className: "Mode Tamu",
      isGuest: true,
    });
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser.trim() || !adminPass.trim()) {
      setError("Username dan kata sandi Admin Pustakawan wajib diisi.");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUser.trim(), password: adminPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Username atau kata sandi salah.");
        setShake(true);
        setTimeout(() => setShake(false), 450);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      if (onAdminLogin) {
        onAdminLogin({
          id: data.user?.id || "admin",
          username: data.user?.username || adminUser.trim(),
          fullName:
            schoolProfile.isConfigured && schoolProfile.librarianName
              ? schoolProfile.librarianName
              : data.user?.fullName || schoolProfile.librarianName || "Guru Pustakawan",
          role: "librarian",
          accessToken: data.accessToken,
        });
      }
    } catch {
      setIsLoading(false);
      setError("Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda.");
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-lg transition-transform",
        shake && "animate-shake"
      )}
    >
      <div className="mb-6 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{displaySchoolName}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Selamat Datang di PustakaKita!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Masuk dengan NISN untuk melanjutkan halaman buku yang terakhir kamu baca.
        </p>
      </div>

      <Tabs defaultValue="student" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="student">Masuk Siswa (NISN)</TabsTrigger>
          <TabsTrigger value="admin">Admin Pustakawan</TabsTrigger>
        </TabsList>

        {/* TAB 1: SISWA VIA NISN + PIN */}
        <TabsContent value="student">
          <form onSubmit={handleStudentSubmit} className="space-y-4" noValidate>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="nisn-input"
                  className="text-sm font-semibold text-foreground"
                >
                  Nomor Induk Siswa Nasional (NISN)
                </label>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isValidLength ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {digitCount}/10 angka
                </span>
              </div>

              <div className="relative">
                <Input
                  id="nisn-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="username"
                  disabled={isLoading}
                  value={formatNISN(rawNisn)}
                  onChange={handleNisnChange}
                  placeholder="0012 3456 78"
                  aria-describedby={error ? "nisn-error-msg" : "nisn-helper"}
                  aria-invalid={!!error}
                  className={cn(
                    "font-mono text-lg lg:text-xl tracking-widest h-12 pr-10 transition-colors",
                    isValidLength && !error && "border-emerald-500 focus-visible:ring-emerald-500",
                    error && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {isValidLength && !error && (
                  <CheckCircle2
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 dark:text-emerald-400"
                    aria-label="10 digit NISN terpenuhi"
                  />
                )}
              </div>
              <p id="nisn-helper" className="mt-1 text-xs text-muted-foreground">
                Ketik 10 angka NISN tanpa huruf (spasi terformat otomatis).
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="pin-input"
                  className="text-sm font-semibold text-foreground"
                >
                  PIN Siswa (6 Digit)
                </label>
                <button
                  type="button"
                  onClick={() => openResetModal("student")}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Lupa / Reset PIN?</span>
                </button>
              </div>
              <div className="relative">
                <Input
                  id="pin-input"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  disabled={isLoading}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••••"
                  className={cn(
                    "font-mono text-lg lg:text-xl tracking-widest h-12 pr-10 transition-colors",
                    isPinValid && !error && "border-emerald-500 focus-visible:ring-emerald-500"
                  )}
                />
                <Lock
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Masukkan 6 angka PIN rahasia akunmu.</span>
                <span
                  className={cn(
                    "font-semibold",
                    isPinValid ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {pin.length}/6 angka
                </span>
              </div>
            </div>

            {/* Pesan Error Ramah Sesuai Tone & Voice Guidelines */}
            {error && (
              <div
                id="nisn-error-msg"
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/60 dark:border-red-800 p-3.5 text-xs font-medium text-red-900 dark:text-red-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={!isValidLength || isLoading}
              className="w-full font-bold text-base gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Mencari data siswamu...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-5 w-5" />
                  <span>Masuk ke Perpustakaan</span>
                </>
              )}
            </Button>

            {/* Privacy-by-Design Note (PRD Section 5.4 & UU PDP) */}
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Privasi Terlindungi (UU PDP): NISN kamu dienkripsi satu arah{" "}
                <code className="font-mono">SHA-256</code> dan tidak pernah dibagikan.
              </span>
            </div>
          </form>

          {/* Opsi Mode Tamu / Baca Cepat (DESIGN.md Section 5.a) */}
          {allowGuestMode && (
            <div className="mt-5 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickGuest}
                className="w-full font-semibold text-xs h-10 gap-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Belum hafal NISN? Masuk Mode Tamu (Baca Cepat)</span>
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: ADMIN PUSTAKAWAN */}
        <TabsContent value="admin">
          {adminSession && (
            <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Sesi Admin Tersimpan: {schoolProfile.librarianName || adminSession.fullName} (@{adminSession.username})
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => onAdminLogin?.(adminSession)}
                className="w-full font-bold gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                Lanjutkan ke Dashboard Admin Tanpa Login Ulang
              </Button>
            </div>
          )}

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-sm font-semibold text-foreground mb-1.5"
              >
                Username Admin Pustakawan
              </label>
              <Input
                id="admin-username"
                value={adminUser}
                onChange={(e) => {
                  setAdminUser(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Masukkan username pustakawan"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-semibold text-foreground"
                >
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => openResetModal("librarian")}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Lupa / Reset Kata Sandi?
                </button>
              </div>
              <Input
                id="admin-password"
                type="password"
                value={adminPass}
                onChange={(e) => {
                  setAdminPass(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/60 dark:border-red-800 p-3.5 text-xs font-medium text-red-900 dark:text-red-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" disabled={isLoading} className="w-full font-bold gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memverifikasi Sesi Admin...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Masuk ke Dashboard Pustakawan</span>
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* MODAL RESET PASSWORD / PIN (SISWA & ADMIN PUSTAKAWAN) */}
      {isResetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary mb-1">
                  <KeyRound className="h-3 w-3" />
                  Pusat Pemulihan Akun
                </span>
                <h2 id="reset-modal-title" className="text-lg font-bold text-foreground">
                  Reset PIN Siswa / Sandi Pustakawan
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pilih peran akun dan verifikasi identitas untuk memperbarui PIN atau kata sandi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Tutup dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Pemilih Role Target */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Pilih Peran Akun (Role)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "student", label: "Siswa (PIN 6 Digit)" },
                  { id: "librarian", label: "Admin Pustakawan" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const nextRole = item.id as "student" | "librarian";
                      setResetTargetRole(nextRole);
                      setResetStatus(null);
                      if (nextRole === "librarian") setResetUsername("pustakawan");
                    }}
                    className={cn(
                      "rounded-lg py-2 px-2 text-xs font-bold border transition-all",
                      resetTargetRole === item.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-secondary/50 text-foreground border-border hover:bg-secondary"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-3.5">
              {resetTargetRole === "student" ? (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    10 Digit NISN Siswa
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={resetNisn}
                    onChange={(e) => setResetNisn(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="Contoh: 0012345678"
                    className="font-mono tracking-wider"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Username Admin Pustakawan
                  </label>
                  <Input
                    type="text"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    placeholder="pustakawan"
                    required
                  />
                </div>
              )}

              <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2.5">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Verifikasi Keamanan (Isi <span className="text-foreground underline">salah satu</span> di bawah ini):
                </p>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {resetTargetRole === "student" ? "Opsi 1: PIN Lama (Jika ingat)" : "Opsi 1: Kata Sandi Lama (Jika ingat)"}
                  </label>
                  <Input
                    type="password"
                    value={resetCurrentSecret}
                    onChange={(e) => setResetCurrentSecret(e.target.value)}
                    placeholder={resetTargetRole === "student" ? "6 digit PIN lama" : "Kata sandi saat ini"}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {resetTargetRole === "student"
                      ? "Opsi 2: Nama Lengkap Siswa (Jika lupa PIN)"
                      : "Opsi 2: Nama Lengkap Pustakawan (Jika lupa sandi)"}
                  </label>
                  <Input
                    type="text"
                    value={resetVerifyName}
                    onChange={(e) => setResetVerifyName(e.target.value)}
                    placeholder={
                      resetTargetRole === "student"
                        ? "Contoh: Budi Santoso"
                        : `Contoh: ${schoolProfile.librarianName || "Guru Pustakawan"}`
                    }
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {resetTargetRole === "student" ? "PIN Baru (6 Angka)" : "Kata Sandi Baru"}
                  </label>
                  <Input
                    type="password"
                    inputMode={resetTargetRole === "student" ? "numeric" : "text"}
                    value={resetNewSecret}
                    onChange={(e) =>
                      setResetNewSecret(
                        resetTargetRole === "student"
                          ? e.target.value.replace(/\D/g, "").slice(0, 6)
                          : e.target.value
                      )
                    }
                    placeholder={resetTargetRole === "student" ? "6 digit angka" : "Min. 6 karakter"}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {resetTargetRole === "student" ? "Ulangi PIN Baru" : "Ulangi Sandi Baru"}
                  </label>
                  <Input
                    type="password"
                    inputMode={resetTargetRole === "student" ? "numeric" : "text"}
                    value={resetConfirmSecret}
                    onChange={(e) =>
                      setResetConfirmSecret(
                        resetTargetRole === "student"
                          ? e.target.value.replace(/\D/g, "").slice(0, 6)
                          : e.target.value
                      )
                    }
                    placeholder="Ketik ulang"
                    required
                  />
                </div>
              </div>

              {resetStatus && (
                <div
                  className={cn(
                    "rounded-xl border p-3 text-xs font-medium flex items-start gap-2",
                    resetStatus.type === "success"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200"
                      : "border-red-300 bg-red-50 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200"
                  )}
                >
                  {resetStatus.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  )}
                  <span>{resetStatus.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetOpen(false)}
                >
                  Tutup
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isResetSubmitting}
                  className="font-bold gap-1.5"
                >
                  {isResetSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      Simpan {resetTargetRole === "student" ? "PIN Baru" : "Sandi Baru"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

