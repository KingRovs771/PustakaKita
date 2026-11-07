"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Home,
  BookOpen,
  Search,
  LayoutDashboard,
  User,
  LogIn,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const AppNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { student, adminSession, schoolProfile } = useLibrary();

  const isLoggedIn = !student.isGuest && Boolean(student.nisn);
  const isAdminLoggedIn = Boolean(adminSession?.username);

  // Global keyboard shortcut Ctrl+K or '/' for Search (Section 7.1 DESIGN.md)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((e.ctrlKey && e.key.toLowerCase() === "k") || (!isInput && e.key === "/")) {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const gradeBadgeVariant =
    student.grade === "SD" ? "sd" : student.grade === "SMP" ? "smp" : "sma";

  const desktopNavLinks = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/library", label: "Rak Buku", icon: BookOpen },
    { href: "/dashboard", label: "Rakku", icon: LayoutDashboard },
    ...(isLoggedIn
      ? [{ href: "/settings", label: "Profil", icon: User }]
      : []),
  ];

  const mobileNavLinks = isLoggedIn
    ? [
        { href: "/", label: "Beranda", icon: Home },
        { href: "/library", label: "Rak Buku", icon: BookOpen },
        { href: "/dashboard", label: "Rakku", icon: LayoutDashboard },
        { href: "/settings", label: "Profil", icon: User },
      ]
    : [
        { href: "/", label: "Beranda", icon: Home },
        { href: "/library", label: "Rak Buku", icon: BookOpen },
        { href: "/search", label: "Cari", icon: Search },
        { href: "/login", label: "Masuk", icon: LogIn },
      ];

  return (
    <>
      {/* Skip to Main Content Link for Keyboard Accessibility (Section 7.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-lg"
      >
        Lewati ke Konten Utama (Skip to Content)
      </a>

      {/* Top Sticky Header (Section 5.b) */}
      <header className="sticky top-0 z-30 h-16 w-full bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Kiri: Logo PustakaKita + Badge Jenjang Aktif */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-extrabold text-lg sm:text-xl tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col leading-none">
                <span>PustakaKita</span>
                <span className="text-[10px] font-semibold text-muted-foreground truncate max-w-[140px] sm:max-w-[180px] mt-0.5">
                  {schoolProfile.shortName}
                </span>
              </div>
            </Link>
            {isLoggedIn && (
              <Badge variant={gradeBadgeVariant} className="hidden xs:inline-flex">
                Jenjang {student.grade}
              </Badge>
            )}
          </div>

          {/* Tengah (Desktop): Bilah Pencarian Instan (Shortcut Ctrl + K) */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-3 lg:mx-6">
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="w-full flex items-center justify-between h-10 px-3.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-sm text-muted-foreground transition-colors group"
              aria-label="Cari buku, penulis, atau topik (Tekan Ctrl + K)"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">Cari judul buku, penulis, atau sains...</span>
              </span>
              <kbd className="inline-flex items-center rounded border border-border bg-card px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground whitespace-nowrap shrink-0 shadow-2xs ml-2">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Kanan: Navigasi Desktop, Tema Gelap/Terang, Avatar Siswa */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <nav
              aria-label="Navigasi Utama Desktop"
              className="hidden md:flex items-center gap-1 mr-1"
            >
              {desktopNavLinks.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors min-h-[44px]",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Ganti Mode Gelap atau Terang"
              className="rounded-xl"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {isAdminLoggedIn && (
              <Link
                href="/admin"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all min-h-[36px]",
                  pathname.startsWith("/admin")
                    ? "bg-primary text-primary-foreground"
                    : "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                )}
                title={`Sesi Admin Aktif: ${adminSession?.fullName}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Dashboard Admin</span>
              </Link>
            )}

            {!isLoggedIn && !isAdminLoggedIn ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 transition-opacity min-h-[36px]"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Masuk Siswa</span>
              </Link>
            ) : isLoggedIn ? (
              <Link
                href="/settings"
                aria-label={`Profil ${student.name}`}
                className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 pl-1 pr-2.5 py-1 hover:bg-secondary transition-colors min-h-[36px]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {student.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden lg:inline text-xs font-bold text-foreground max-w-[100px] truncate">
                  {student.name.split(" ")[0]}
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar Khusus Mobile (< 768px) (Section 5.b & 8.1) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-card/95 backdrop-blur-md border-t border-border z-40 grid grid-cols-4"
      >
        {mobileNavLinks.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors min-h-[44px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn("h-5 w-5", isActive && "stroke-[2.5px]")}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

