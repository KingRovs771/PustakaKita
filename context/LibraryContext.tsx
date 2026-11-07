"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { set as idbSet, get as idbGet } from "idb-keyval";
import {
  BOOKS_CATALOG,
  BookItem,
  STUDENT_PROFILE_MOCK,
} from "@/lib/mock-data";
import { ReaderSettings } from "@/components/ReaderToolbar";
import { SchoolSetupModal } from "@/components/SchoolSetupModal";

interface StudentProfile {
  name: string;
  nisn: string;
  grade: "SD" | "SMP" | "SMA";
  className: string;
  schoolName: string;
  avatarId: string;
  isGuest?: boolean;
  stats: {
    streakDays: number;
    booksCompleted: number;
    minutesReadThisWeek: number;
    weeklyGoalMinutes: number;
  };
}

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  colorHex: string;
  sortOrder: number;
  bookCount?: number;
}

export interface AdminSessionProfile {
  id: string;
  username: string;
  fullName: string;
  role: "librarian";
  accessToken?: string;
}

export interface SchoolProfile {
  schoolName: string;
  shortName: string;
  npsn: string;
  defaultGrade: "SD" | "SMP" | "SMA";
  city: string;
  province: string;
  address: string;
  librarianName: string;
  principalName: string;
  academicYear: string;
  motto: string;
  isConfigured: boolean;
}

const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  schoolName: "SMP Negeri 1 Nusantara",
  shortName: "SMPN 1 Nusantara",
  npsn: "20219231",
  defaultGrade: "SMP",
  city: "Nusantara",
  province: "Indonesia",
  address: "Jl. Pendidikan Nasional No. 1",
  librarianName: "Guru Pustakawan",
  principalName: "Kepala Sekolah",
  academicYear: "2026/2027",
  motto: "Membaca Membuka Jendela Dunia",
  isConfigured: false,
};

const DEFAULT_CATEGORIES: CategoryData[] = [
  { id: "fiksi", name: "Fiksi & Sastra", icon: "Sparkles", colorHex: "#8B5CF6", sortOrder: 1, bookCount: 4 },
  { id: "sains", name: "Sains & Alam", icon: "Atom", colorHex: "#0EA5E9", sortOrder: 2, bookCount: 3 },
  { id: "sejarah", name: "Sejarah Nusantara", icon: "Compass", colorHex: "#D97706", sortOrder: 3, bookCount: 3 },
  { id: "komik", name: "Komik Edukasi", icon: "Smile", colorHex: "#E11D48", sortOrder: 4, bookCount: 2 },
];

interface LibraryContextType {
  books: BookItem[];
  categories: CategoryData[];
  student: StudentProfile;
  adminSession: AdminSessionProfile | null;
  schoolProfile: SchoolProfile;
  isSchoolSetupOpen: boolean;
  setIsSchoolSetupOpen: (open: boolean) => void;
  saveSchoolProfile: (profile: Omit<SchoolProfile, "isConfigured">) => Promise<boolean>;
  readerSettings: ReaderSettings;
  offlineCachedIds: string[];
  updateBookProgress: (bookId: string, page: number) => void;
  toggleSaveBook: (bookId: string) => void;
  addNewBook: (newBook: BookItem) => void;
  updateBook: (bookId: string, partial: Partial<BookItem>) => void;
  toggleDeleteBook: (bookId: string) => void;
  addNewCategory: (category: Omit<CategoryData, "id">) => Promise<CategoryData | null>;
  updateExistingCategory: (id: string, partial: Partial<CategoryData>) => Promise<boolean>;
  deleteExistingCategory: (id: string) => Promise<boolean>;
  updateStudentProfile: (partial: Partial<StudentProfile>) => void;
  loginAdminSession: (session: AdminSessionProfile) => void;
  logoutAdminSession: () => Promise<void>;
  updateReaderSettings: (partial: Partial<ReaderSettings>) => void;
  cacheBookOffline: (bookId: string) => Promise<void>;
  clearCompletedOfflineCache: () => Promise<void>;
}

const INITIAL_STUDENT_PROFILE: StudentProfile = {
  name: "Siswa",
  nisn: "",
  grade: "SMP",
  className: "Kelas Umum",
  schoolName: "SMP Negeri 1 Nusantara",
  avatarId: "pelajar-1",
  isGuest: true,
  stats: {
    streakDays: 0,
    booksCompleted: 0,
    minutesReadThisWeek: 0,
    weeklyGoalMinutes: 45,
  },
};

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSizeStep: 2,
  fontFamily: "serif",
  theme: "day",
  lineSpacing: "relaxed",
};

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>(DEFAULT_CATEGORIES);
  const [student, setStudent] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);
  const [adminSession, setAdminSession] = useState<AdminSessionProfile | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(DEFAULT_SCHOOL_PROFILE);
  const [isSchoolSetupOpen, setIsSchoolSetupOpen] = useState<boolean>(false);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(
    DEFAULT_READER_SETTINGS
  );
  const [offlineCachedIds, setOfflineCachedIds] = useState<string[]>([]);

  // Hydrate state from localStorage, IndexedDB, and backend Neon API
  useEffect(() => {
    let hasLocalSchoolProfile = false;
    try {
      const savedSchool = localStorage.getItem("pustakakita_school_profile_v1");
      if (savedSchool) {
        const parsedSchool = JSON.parse(savedSchool);
        if (parsedSchool && parsedSchool.schoolName && parsedSchool.isConfigured) {
          setSchoolProfile(parsedSchool);
          hasLocalSchoolProfile = true;
          setStudent((prev) => ({
            ...prev,
            schoolName: parsedSchool.schoolName,
          }));
        }
      }
      const savedBooks = localStorage.getItem("pustakakita_books_v1");
      if (savedBooks) {
        setBooks(JSON.parse(savedBooks));
      }
      const savedCategories = localStorage.getItem("pustakakita_categories_v1");
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      }
      const savedAdmin = localStorage.getItem("pustakakita_admin_session_v1");
      if (savedAdmin) {
        try {
          const parsedAdmin = JSON.parse(savedAdmin);
          if (parsedAdmin && parsedAdmin.username) {
            setAdminSession({
              id: parsedAdmin.id || "admin",
              username: parsedAdmin.username,
              fullName: parsedAdmin.fullName || "Guru Pustakawan",
              role: "librarian",
              accessToken: parsedAdmin.accessToken,
            });
          }
        } catch {
          localStorage.removeItem("pustakakita_admin_session_v1");
        }
      }
      const savedStudent = localStorage.getItem("pustakakita_student_v1");
      if (savedStudent) {
        try {
          const parsed = JSON.parse(savedStudent);
          if (
            !parsed ||
            typeof parsed.name !== "string" ||
            parsed.name.toLowerCase().includes("budi") ||
            parsed.isGuest ||
            !parsed.nisn
          ) {
            localStorage.removeItem("pustakakita_student_v1");
            setStudent(INITIAL_STUDENT_PROFILE);
          } else {
            setStudent(parsed);
          }
        } catch {
          localStorage.removeItem("pustakakita_student_v1");
        }
      }
      const savedSettings = localStorage.getItem("pustakakita_reader_settings");
      if (savedSettings) {
        setReaderSettings(JSON.parse(savedSettings));
      }
      idbGet<string[]>("pustakakita_offline_ids").then((ids) => {
        if (ids && Array.isArray(ids)) {
          setOfflineCachedIds(ids);
        }
      }).catch(() => {});
    } catch {
      // Ignore storage access errors in strict incognito modes
    }

    // Fetch or verify School Biodata Profile (First-Time Setup Detection)
    fetch("/api/school-profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.configured && data?.profile) {
          const remoteProfile: SchoolProfile = {
            ...DEFAULT_SCHOOL_PROFILE,
            ...data.profile,
            isConfigured: true,
          };
          setSchoolProfile(remoteProfile);
          setStudent((prev) => ({
            ...prev,
            schoolName: remoteProfile.schoolName,
          }));
          setAdminSession((prevAdmin) => {
            if (!prevAdmin) return prevAdmin;
            const nextAdmin = {
              ...prevAdmin,
              fullName: remoteProfile.librarianName || prevAdmin.fullName,
            };
            try {
              localStorage.setItem(
                "pustakakita_admin_session_v1",
                JSON.stringify(nextAdmin)
              );
            } catch {}
            return nextAdmin;
          });
          try {
            localStorage.setItem(
              "pustakakita_school_profile_v1",
              JSON.stringify(remoteProfile)
            );
          } catch {}
        } else if (!hasLocalSchoolProfile) {
          // Pertama kali dipasang: belum ada profil sekolah di DB maupun localStorage
          setIsSchoolSetupOpen(true);
        }
      })
      .catch(() => {
        if (!hasLocalSchoolProfile) {
          setIsSchoolSetupOpen(true);
        }
      });

    // Verify or hydrate active Admin session from HTTP-only cookie
    fetch("/api/auth/admin-session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          const syncedSession: AdminSessionProfile = {
            id: data.user.id,
            username: data.user.username,
            fullName: data.user.fullName || "Guru Pustakawan",
            role: "librarian",
          };
          setAdminSession(syncedSession);
          try {
            localStorage.setItem("pustakakita_admin_session_v1", JSON.stringify(syncedSession));
          } catch {}
        }
      })
      .catch(() => {});

    // Fetch categories from Neon PostgreSQL backend
    fetch("/api/categories")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          const mapped: CategoryData[] = data.categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            colorHex: c.color_hex,
            sortOrder: c.sort_order,
            bookCount: c.book_count ?? 0,
          }));
          setCategories(mapped);
          try {
            localStorage.setItem("pustakakita_categories_v1", JSON.stringify(mapped));
          } catch {}
        }
      })
      .catch(() => {});

    // Fetch live catalog from Neon PostgreSQL backend
    fetch("/api/books")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil buku dari server");
        return res.json();
      })
      .then((data) => {
        if (data.books && Array.isArray(data.books)) {
          if (data.books.length === 0) {
            setBooks([]);
            try {
              localStorage.removeItem("pustakakita_books_v1");
            } catch {}
            return;
          }

          setBooks((prev) => {
            // Merge remote catalog with local progress
            const merged = data.books.map((remote: any) => {
              const existing = prev.find((p) => p.id === remote.id);
              const catLower = (remote.category_name || "fiksi").toLowerCase();
              const validCategory: BookItem["category"] = 
                catLower.includes("sains") ? "sains" :
                catLower.includes("sejarah") ? "sejarah" :
                catLower.includes("komik") ? "komik" : "fiksi";

              return {
                id: remote.id,
                title: remote.title,
                author: remote.author,
                publisher: remote.publisher || "PustakaKita Kemendikbud",
                publishedYear: remote.published_year || 2024,
                isbn: remote.isbn || "978-602-000-000-0",
                coverUrl: remote.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80",
                r2Key: remote.r2_key || undefined,
                fileUrl:
                  typeof remote.r2_key === "string" && remote.r2_key.trim() !== ""
                    ? remote.r2_key.startsWith("/uploads/") ||
                      remote.r2_key.startsWith("/api/books/file") ||
                      remote.r2_key.startsWith("http")
                      ? remote.r2_key
                      : `/api/books/file?key=${encodeURIComponent(remote.r2_key)}`
                    : existing?.fileUrl,
                category: validCategory,
                gradeLevel: (["SD", "SMP", "SMA"].includes(remote.grade_level) ? remote.grade_level : "SMP") as BookItem["gradeLevel"],
                totalPages: remote.total_pages || 100,
                currentPage: existing?.currentPage ?? 1,
                progressPercent: existing?.progressPercent ?? 0,
                estimatedReadMinutes: remote.estimated_read_minutes || 20,
                vocabularyLevel: (remote.vocabulary_level as string) || "Sedang",
                sourceType: (remote.source_type === "pdf" ? "bse" : "internal") as BookItem["sourceType"],
                synopsis: remote.synopsis || "Buku pelajaran dan literasi perpustakaan sekolah.",
                isSaved: existing?.isSaved ?? false,
                chapters: existing?.chapters || [
                  {
                    number: 1,
                    title: "Bab 1: Pendahuluan",
                    startPage: 1,
                    paragraphs: [remote.synopsis || "Selamat membaca buku digital ini."],
                  },
                ],
              } as BookItem;
            });
            try {
              localStorage.setItem("pustakakita_books_v1", JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  const updateBookProgress = (bookId: string, page: number) => {
    setBooks((prev) => {
      const next = prev.map((book) => {
        if (book.id !== bookId) return book;
        const clampedPage = Math.max(1, Math.min(page, book.totalPages));
        const pct = Math.round((clampedPage / book.totalPages) * 100);
        return {
          ...book,
          currentPage: clampedPage,
          progressPercent: pct,
        };
      });
      try {
        localStorage.setItem("pustakakita_books_v1", JSON.stringify(next));
      } catch {}

      // Asynchronous background sync to Neon backend (PRD Section 5.3)
      const targetBook = next.find((b) => b.id === bookId);
      if (targetBook) {
        fetch("/api/reading/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId,
            currentPage: targetBook.currentPage,
            totalPages: targetBook.totalPages,
            readingDurationSeconds: 60,
          }),
        }).catch(() => {});
      }

      return next;
    });
  };

  const toggleSaveBook = (bookId: string) => {
    setBooks((prev) => {
      const next = prev.map((book) =>
        book.id === bookId ? { ...book, isSaved: !book.isSaved } : book
      );
      try {
        localStorage.setItem("pustakakita_books_v1", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const addNewBook = (newBook: BookItem) => {
    setBooks((prev) => {
      const next = [newBook, ...prev];
      try {
        localStorage.setItem("pustakakita_books_v1", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const updateBook = (bookId: string, partial: Partial<BookItem>) => {
    setBooks((prev) => {
      const next = prev.map((b) => (b.id === bookId ? { ...b, ...partial } : b));
      try {
        localStorage.setItem("pustakakita_books_v1", JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(`/api/books/${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: partial.title,
        author: partial.author,
        categoryName: partial.category,
        gradeLevel: partial.gradeLevel,
        totalPages: partial.totalPages,
        synopsis: partial.synopsis,
        coverUrl: partial.coverUrl,
        r2Key: partial.fileUrl || partial.r2Key,
      }),
    }).catch(() => {});
  };

  const toggleDeleteBook = (bookId: string) => {
    setBooks((prev) => {
      const next = prev.filter((b) => b.id !== bookId);
      try {
        localStorage.setItem("pustakakita_books_v1", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const addNewCategory = async (cat: Omit<CategoryData, "id">): Promise<CategoryData | null> => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cat.name,
          icon: cat.icon,
          colorHex: cat.colorHex,
          sortOrder: cat.sortOrder,
        }),
      });
      const data = await res.json();

      const createdCat: CategoryData = {
        id: data.category?.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name: data.category?.name || cat.name,
        icon: data.category?.icon || cat.icon,
        colorHex: data.category?.color_hex || cat.colorHex,
        sortOrder: data.category?.sort_order ?? cat.sortOrder,
        bookCount: 0,
      };

      setCategories((prev) => {
        const next = [...prev, createdCat].sort((a, b) => a.sortOrder - b.sortOrder);
        try {
          localStorage.setItem("pustakakita_categories_v1", JSON.stringify(next));
        } catch {}
        return next;
      });
      return createdCat;
    } catch {
      const fallbackCat: CategoryData = {
        id: cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4),
        ...cat,
        bookCount: 0,
      };
      setCategories((prev) => [...prev, fallbackCat]);
      return fallbackCat;
    }
  };

  const updateExistingCategory = async (id: string, partial: Partial<CategoryData>): Promise<boolean> => {
    try {
      setCategories((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...partial } : c));
        try {
          localStorage.setItem("pustakakita_categories_v1", JSON.stringify(next));
        } catch {}
        return next;
      });

      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: partial.name,
          icon: partial.icon,
          colorHex: partial.colorHex,
          sortOrder: partial.sortOrder,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const deleteExistingCategory = async (id: string): Promise<boolean> => {
    try {
      setCategories((prev) => {
        const next = prev.filter((c) => c.id !== id);
        try {
          localStorage.setItem("pustakakita_categories_v1", JSON.stringify(next));
        } catch {}
        return next;
      });

      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      return res.ok;
    } catch {
      return false;
    }
  };

  const updateStudentProfile = (partial: Partial<StudentProfile>) => {
    setStudent((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem("pustakakita_student_v1", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const loginAdminSession = (session: AdminSessionProfile) => {
    setAdminSession(session);
    try {
      localStorage.setItem("pustakakita_admin_session_v1", JSON.stringify(session));
    } catch {}
  };

  const logoutAdminSession = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setAdminSession(null);
    try {
      localStorage.removeItem("pustakakita_admin_session_v1");
    } catch {}
  };

  const saveSchoolProfile = async (
    input: Omit<SchoolProfile, "isConfigured">
  ): Promise<boolean> => {
    const updated: SchoolProfile = {
      ...input,
      isConfigured: true,
    };
    setSchoolProfile(updated);
    setStudent((prev) => ({
      ...prev,
      schoolName: updated.schoolName,
    }));
    setAdminSession((prevAdmin) => {
      if (!prevAdmin) return prevAdmin;
      const nextAdmin = {
        ...prevAdmin,
        fullName: updated.librarianName || prevAdmin.fullName,
      };
      try {
        localStorage.setItem(
          "pustakakita_admin_session_v1",
          JSON.stringify(nextAdmin)
        );
      } catch {}
      return nextAdmin;
    });
    try {
      localStorage.setItem(
        "pustakakita_school_profile_v1",
        JSON.stringify(updated)
      );
    } catch {}

    try {
      await fetch("/api/school-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    } catch {
      // Tetap tersimpan di localStorage jika sedang offline
    }
    setIsSchoolSetupOpen(false);
    return true;
  };

  const updateReaderSettings = (partial: Partial<ReaderSettings>) => {
    setReaderSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(
          "pustakakita_reader_settings",
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
  };

  const cacheBookOffline = async (bookId: string) => {
    const targetBook = books.find((b) => b.id === bookId);
    if (!targetBook) return;
    try {
      await idbSet(`pustakakita_book_content_${bookId}`, targetBook);
      const updatedIds = Array.from(new Set([...offlineCachedIds, bookId]));
      setOfflineCachedIds(updatedIds);
      await idbSet("pustakakita_offline_ids", updatedIds);
    } catch {}
  };

  const clearCompletedOfflineCache = async () => {
    const activeIds = offlineCachedIds.filter((id) => {
      const b = books.find((item) => item.id === id);
      return b && (b.progressPercent ?? 0) < 100;
    });
    setOfflineCachedIds(activeIds);
    try {
      await idbSet("pustakakita_offline_ids", activeIds);
    } catch {}
  };

  return (
    <LibraryContext.Provider
      value={{
        books,
        categories,
        student,
        adminSession,
        schoolProfile,
        isSchoolSetupOpen,
        setIsSchoolSetupOpen,
        saveSchoolProfile,
        readerSettings,
        offlineCachedIds,
        updateBookProgress,
        toggleSaveBook,
        addNewBook,
        updateBook,
        toggleDeleteBook,
        addNewCategory,
        updateExistingCategory,
        deleteExistingCategory,
        updateStudentProfile,
        loginAdminSession,
        logoutAdminSession,
        updateReaderSettings,
        cacheBookOffline,
        clearCompletedOfflineCache,
      }}
    >
      {children}
      <SchoolSetupModal
        open={isSchoolSetupOpen}
        isFirstTimeInstall={!schoolProfile.isConfigured}
        initialProfile={schoolProfile}
        onSave={saveSchoolProfile}
        onClose={() => setIsSchoolSetupOpen(false)}
      />
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return ctx;
}

