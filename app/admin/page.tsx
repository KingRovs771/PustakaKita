"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Tag,
  Users,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { AppNavigation } from "@/components/AppNavigation";
import { AdminAnalyticsPanel } from "@/components/AdminAnalyticsPanel";
import { BookDetailModal } from "@/components/BookDetailModal";
import { useLibrary } from "@/context/LibraryContext";
import { Button } from "@/components/ui/button";

function AdminView() {
  const router = useRouter();

  const {
    books,
    categories,
    addNewBook,
    updateBook,
    toggleDeleteBook,
    addNewCategory,
    updateExistingCategory,
    deleteExistingCategory,
    adminSession,
    loginAdminSession,
    logoutAdminSession,
    schoolProfile,
    setIsSchoolSetupOpen,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<"analytics" | "books" | "categories" | "students">("analytics");
  const [previewBookId, setPreviewBookId] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    // Cek localStorage terlebih dahulu agar instan tanpa jeda
    try {
      const saved = localStorage.getItem("pustakakita_admin_session_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) {
          if (mounted) setIsCheckingSession(false);
          return;
        }
      }
    } catch {
      // Abaikan error parse
    }

    // Jika belum ada di localStorage, cek cookie HTTP-only ke server
    fetch("/api/auth/admin-session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted) return;
        if (data?.authenticated && data?.user) {
          loginAdminSession({
            id: data.user.id,
            username: data.user.username,
            fullName: data.user.fullName,
            role: "librarian",
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsCheckingSession(false);
      });

    return () => {
      mounted = false;
    };
  }, [loginAdminSession]);

  const handleLogoutAdmin = async () => {
    await logoutAdminSession();
    toast.success("Sesi Admin Pustakawan telah diakhiri.");
    router.push("/login");
  };

  const previewBook = books.find((b) => b.id === previewBookId) || null;

  if (isCheckingSession && !adminSession) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppNavigation />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">
              Memulihkan sesi Admin Pustakawan...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!adminSession) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppNavigation />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-sm space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-extrabold text-foreground">
                Akses Khusus Admin Pustakawan
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Silakan masuk menggunakan akun Guru Pustakawan terlebih dahulu. Setelah masuk, sesi Anda akan tersimpan otomatis meskipun Anda berpindah halaman.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                variant="outline"
                className="flex-1 font-semibold"
                onClick={() => router.push("/library")}
              >
                Ke Katalog Buku
              </Button>
              <Button
                className="flex-1 font-bold"
                onClick={() => router.push("/login")}
              >
                Masuk sebagai Admin
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-12">
      <AppNavigation />

      <div className="flex-1 flex">
        {/* Sidebar Kiri Desktop (Section 5.f DESIGN.md) */}
        <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col justify-between p-5 shrink-0">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Panel Pengelola Sekolah
              </span>
              <h2 className="text-base font-extrabold text-foreground mt-1">
                {schoolProfile.schoolName}
              </h2>
              <div className="mt-3 space-y-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {schoolProfile.librarianName || adminSession.fullName}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Guru Pustakawan (Aktif)
                    </p>
                  </div>
                </div>
                {schoolProfile.principalName && (
                  <div className="pt-1.5 border-t border-emerald-500/20 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground block truncate">
                      {schoolProfile.principalName}
                    </span>
                    <span>Kepala Sekolah</span>
                  </div>
                )}
              </div>
            </div>

            <nav className="space-y-1.5">
              {[
                { id: "analytics" as const, label: "Ringkasan Analitik", icon: BarChart3 },
                { id: "books" as const, label: "Katalog Buku Sekolah", icon: BookOpen },
                { id: "categories" as const, label: "Kategori Koleksi", icon: Tag },
                { id: "students" as const, label: "Data Siswa & Akun", icon: Users },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all text-left ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-border">
            <Link
              href="/library"
              className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Tampilan Siswa</span>
            </Link>
            <button
              type="button"
              onClick={handleLogoutAdmin}
              className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar Sesi Admin</span>
            </button>
          </div>
        </aside>

        {/* Area Konten Utama */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-6xl mx-auto"
        >
          <AdminAnalyticsPanel
            books={books}
            categories={categories}
            role="librarian"
            adminName={schoolProfile.librarianName || adminSession.fullName}
            principalName={schoolProfile.principalName}
            schoolName={schoolProfile.schoolName}
            onOpenSchoolSetup={() => setIsSchoolSetupOpen(true)}
            onLogoutAdmin={handleLogoutAdmin}
            onAddBook={addNewBook}
            onUpdateBook={updateBook}
            onDeleteBook={toggleDeleteBook}
            onAddCategory={addNewCategory}
            onUpdateCategory={updateExistingCategory}
            onDeleteCategory={deleteExistingCategory}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onPreviewBook={(id) => setPreviewBookId(id)}
          />
        </main>
      </div>

      <BookDetailModal
        book={previewBook}
        open={!!previewBook}
        onOpenChange={(open) => !open && setPreviewBookId(null)}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-sm font-semibold text-muted-foreground">
          Memuat data analitik sekolah...
        </div>
      }
    >
      <AdminView />
    </Suspense>
  );
}

