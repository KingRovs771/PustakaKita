"use client";

import React, { useState, useEffect } from "react";
import {
  Landmark,
  CheckCircle2,
  Sparkles,
  Loader2,
  MapPin,
  UserCheck,
  BookOpen,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SchoolProfile } from "@/context/LibraryContext";
import { cn } from "@/lib/utils";

interface SchoolSetupModalProps {
  open: boolean;
  isFirstTimeInstall: boolean;
  initialProfile: SchoolProfile;
  onSave: (profile: Omit<SchoolProfile, "isConfigured">) => Promise<boolean>;
  onClose?: () => void;
}

export const SchoolSetupModal: React.FC<SchoolSetupModalProps> = ({
  open,
  isFirstTimeInstall,
  initialProfile,
  onSave,
  onClose,
}) => {
  const [schoolName, setSchoolName] = useState(initialProfile.schoolName);
  const [shortName, setShortName] = useState(initialProfile.shortName);
  const [npsn, setNpsn] = useState(initialProfile.npsn);
  const [defaultGrade, setDefaultGrade] = useState<"SD" | "SMP" | "SMA">(
    initialProfile.defaultGrade || "SMP"
  );
  const [city, setCity] = useState(initialProfile.city);
  const [province, setProvince] = useState(initialProfile.province);
  const [address, setAddress] = useState(initialProfile.address);
  const [librarianName, setLibrarianName] = useState(initialProfile.librarianName);
  const [principalName, setPrincipalName] = useState(initialProfile.principalName || "Kepala Sekolah");
  const [academicYear, setAcademicYear] = useState(initialProfile.academicYear);
  const [motto, setMotto] = useState(initialProfile.motto);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSchoolName(initialProfile.schoolName || "");
      setShortName(initialProfile.shortName || "");
      setNpsn(initialProfile.npsn || "");
      setDefaultGrade(initialProfile.defaultGrade || "SMP");
      setCity(initialProfile.city || "");
      setProvince(initialProfile.province || "");
      setAddress(initialProfile.address || "");
      setLibrarianName(initialProfile.librarianName || "Guru Pustakawan");
      setPrincipalName(initialProfile.principalName || "Kepala Sekolah");
      setAcademicYear(initialProfile.academicYear || "2026/2027");
      setMotto(initialProfile.motto || "Membaca Membuka Jendela Dunia");
    }
  }, [open, initialProfile]);

  if (!open) return null;

  const handleSchoolNameChange = (val: string) => {
    setSchoolName(val);
    // Otomatis sarankan nama singkat jika pengguna belum mengubahnya manual
    const autoShort = val
      .replace(/Sekolah Dasar Negeri/gi, "SDN")
      .replace(/Sekolah Menengah Pertama Negeri/gi, "SMPN")
      .replace(/Sekolah Menengah Atas Negeri/gi, "SMAN")
      .replace(/SMK Negeri/gi, "SMKN")
      .replace(/SMP Negeri/gi, "SMPN")
      .replace(/SMA Negeri/gi, "SMAN")
      .replace(/SD Negeri/gi, "SDN")
      .trim();
    if (!shortName || shortName === initialProfile.shortName) {
      setShortName(autoShort.slice(0, 26));
    }
    if (/\b(SD|SDN|MI|MIN)\b/i.test(val)) {
      setDefaultGrade("SD");
    } else if (/\b(SMA|SMAN|SMK|SMKN|MA|MAN)\b/i.test(val)) {
      setDefaultGrade("SMA");
    } else if (/\b(SMP|SMPN|MTs|MTsN)\b/i.test(val)) {
      setDefaultGrade("SMP");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      toast.error("Nama lengkap sekolah wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const ok = await onSave({
      schoolName: schoolName.trim(),
      shortName: (shortName.trim() || schoolName.trim()).slice(0, 28),
      npsn: npsn.replace(/\D/g, "").slice(0, 10),
      defaultGrade,
      city: city.trim() || "Indonesia",
      province: province.trim() || "Nusantara",
      address: address.trim(),
      librarianName: librarianName.trim() || "Guru Pustakawan",
      principalName: principalName.trim() || "Kepala Sekolah",
      academicYear: academicYear.trim() || "2026/2027",
      motto: motto.trim() || "Membaca Membuka Jendela Dunia",
    });
    setIsSubmitting(false);

    if (ok) {
      toast.success("Biodata Sekolah berhasil diterapkan!", {
        description: `Seluruh komponen perpustakaan kini disesuaikan untuk ${schoolName.trim()}.`,
      });
      onClose?.();
    } else {
      toast.error("Gagal menyimpan biodata sekolah.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="school-setup-title"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white px-6 py-5 sm:px-8 sm:py-6 relative">
          {!isFirstTimeInstall && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
              aria-label="Tutup dialog"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-300/30 px-3 py-1 text-xs font-bold text-amber-300 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {isFirstTimeInstall
                ? "Konfigurasi Instalasi Pertama (First-Time Setup)"
                : "Pengaturan Identitas & Biodata Sekolah"}
            </span>
          </div>

          <h2
            id="school-setup-title"
            className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5"
          >
            <Landmark className="h-6 w-6 text-amber-400 shrink-0" />
            <span>Lengkapi Biodata Sekolah Anda</span>
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 mt-1 leading-relaxed">
            Data ini akan otomatis menyesuaikan seluruh halaman Katalog, Header Navigasi, Halaman Login Siswa, Watermark Buku, hingga Laporan Analitik Perpustakaan.
          </p>
        </div>

        {/* Form Biodata Sekolah */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Baris 1: Nama Sekolah & Singkatan */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Nama Lengkap Sekolah <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={schoolName}
                onChange={(e) => handleSchoolNameChange(e.target.value)}
                placeholder="Contoh: SMP Negeri 1 Nusantara"
                className="h-11 font-semibold"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Nama Singkat (Badge)
              </label>
              <Input
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="Contoh: SMPN 1 Nusantara"
                className="h-11"
              />
            </div>
          </div>

          {/* Baris 2: Jenjang Utama & NPSN & Tahun Ajaran */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Jenjang Utama Sekolah
              </label>
              <div className="grid grid-cols-3 gap-1.5 h-11">
                {(["SD", "SMP", "SMA"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDefaultGrade(lvl)}
                    className={cn(
                      "rounded-xl text-xs font-extrabold border transition-all",
                      defaultGrade === lvl
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-secondary/60 text-foreground border-border hover:bg-secondary"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                NPSN Sekolah (8 Digit)
              </label>
              <Input
                value={npsn}
                onChange={(e) => setNpsn(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Contoh: 20219231"
                className="h-11 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Tahun Ajaran Aktif
              </label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="Contoh: 2026/2027"
                className="h-11"
              />
            </div>
          </div>

          {/* Baris 3: Nama Guru Pustakawan & Nama Kepala Sekolah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                <UserCheck className="h-3.5 w-3.5 inline mr-1 text-primary" />
                Nama Guru Pustakawan <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={librarianName}
                onChange={(e) => setLibrarianName(e.target.value)}
                placeholder="Contoh: Ibu Rina Kartika, S.Pd."
                className="h-11 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                <UserCheck className="h-3.5 w-3.5 inline mr-1 text-emerald-600" />
                Nama Kepala Sekolah <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                placeholder="Contoh: Bpk. Drs. Hendra Wijaya, M.Pd."
                className="h-11 font-semibold"
              />
            </div>
          </div>

          {/* Baris 4: Kota/Kabupaten, Provinsi, Alamat */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                <MapPin className="h-3.5 w-3.5 inline mr-1 text-primary" />
                Kota / Kabupaten
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Kota Bandung"
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Provinsi
              </label>
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Contoh: Jawa Barat"
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Alamat Sekolah
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Pendidikan No. 10"
                className="h-11"
              />
            </div>
          </div>

          {/* Baris 5: Motto Literasi */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              <BookOpen className="h-3.5 w-3.5 inline mr-1 text-primary" />
              Motto / Slogan Literasi Sekolah
            </label>
            <Input
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Contoh: Membaca Membuka Jendela Dunia"
              className="h-11"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              💡 Anda dapat mengubah kembali Biodata Sekolah ini kapan saja melalui menu <strong>Biodata Sekolah</strong> di Dashboard Admin.
            </p>

            <div className="flex items-center gap-2 shrink-0">
              {!isFirstTimeInstall && onClose && (
                <Button type="button" variant="ghost" onClick={onClose}>
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="font-bold gap-2 px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Simpan & Terapkan ke Perpustakaan</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

