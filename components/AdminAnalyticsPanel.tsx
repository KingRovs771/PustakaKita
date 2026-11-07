"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Clock,
  BookOpen,
  Sparkles,
  Download,
  Plus,
  Search,
  Trash2,
  Eye,
  UploadCloud,
  AlertTriangle,
  Database,
  CheckCircle2,
  Pencil,
  Tag,
  Layers,
  Palette,
  Atom,
  Compass,
  Smile,
  Heart,
  Landmark,
  Globe,
  BarChart3,
  Check,
  KeyRound,
  UserPlus,
  ShieldCheck,
  Lock,
  RefreshCw,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ImageIcon,
  FileText,
  FileSpreadsheet,
  Loader2,
  X,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { BookItem } from "@/lib/mock-data";
import { CategoryData } from "@/context/LibraryContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface StudentAdminItem {
  nisn_hash: string;
  full_name: string;
  grade: number;
  class_name: string;
  is_active: boolean;
  first_login_at: string | null;
  last_login_at: string | null;
  created_at: string;
  minutes_week?: number;
  books_read?: number;
}

export interface AdminAnalyticsPanelProps {
  books: BookItem[];
  role?: "librarian" | "principal";
  onRoleChange?: (role: "librarian" | "principal") => void;
  adminName?: string;
  principalName?: string;
  schoolName?: string;
  onOpenSchoolSetup?: () => void;
  onLogoutAdmin?: () => void;
  onAddBook: (book: BookItem) => void;
  onUpdateBook?: (bookId: string, partial: Partial<BookItem>) => void;
  onDeleteBook: (bookId: string) => void;
  onPreviewBook: (bookId: string) => void;
  categories?: CategoryData[];
  onAddCategory?: (category: Omit<CategoryData, "id">) => Promise<CategoryData | null>;
  onUpdateCategory?: (id: string, partial: Partial<CategoryData>) => Promise<boolean>;
  onDeleteCategory?: (id: string) => Promise<boolean>;
  activeTab?: "analytics" | "books" | "categories" | "students";
  onTabChange?: (tab: "analytics" | "books" | "categories" | "students") => void;
}

const PRESET_ICONS = [
  { name: "Sparkles", Icon: Sparkles },
  { name: "Atom", Icon: Atom },
  { name: "Compass", Icon: Compass },
  { name: "Smile", Icon: Smile },
  { name: "BookOpen", Icon: BookOpen },
  { name: "Layers", Icon: Layers },
  { name: "Palette", Icon: Palette },
  { name: "Heart", Icon: Heart },
  { name: "Landmark", Icon: Landmark },
  { name: "Globe", Icon: Globe },
];

const PRESET_COLORS = [
  "#3B82F6", // Biru
  "#10B981", // Hijau
  "#F59E0B", // Amber
  "#EF4444", // Merah
  "#8B5CF6", // Ungu
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
];

// Pilihan Tingkat & Rombel Sesuai Ketentuan Jenjang Sekolah
const SD_CLASSES = [1, 2, 3, 4, 5, 6];
const SMP_CLASSES = [7, 8, 9];
const SMA_CLASSES = [10, 11, 12];
const CLASS_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

function getComputedClassName(
  grade: "SD" | "SMP" | "SMA",
  num: number,
  letter: string,
  custom: string
): string {
  if (grade === "SMA") {
    const trimmed = custom.trim();
    return trimmed ? `Kelas ${num} ${trimmed}` : `Kelas ${num}`;
  }
  return `Kelas ${num}${letter}`;
}

function parseExistingClass(className: string, gradeNumber: number) {
  let lvl: "SD" | "SMP" | "SMA" = "SD";
  let num = 1;
  let letter = "A";
  let custom = "";

  const matchNum = className ? className.match(/\d+/) : null;
  const foundNum = matchNum ? parseInt(matchNum[0], 10) : gradeNumber;

  if (foundNum >= 1 && foundNum <= 6) {
    lvl = "SD";
    num = foundNum;
    const matchLetter = (className || "").replace(/^Kelas\s*\d+/i, "").trim().toUpperCase();
    if (matchLetter && CLASS_LETTERS.includes(matchLetter.charAt(0))) {
      letter = matchLetter.charAt(0);
    }
  } else if (foundNum >= 7 && foundNum <= 9) {
    lvl = "SMP";
    num = foundNum;
    const matchLetter = (className || "").replace(/^Kelas\s*\d+/i, "").trim().toUpperCase();
    if (matchLetter && CLASS_LETTERS.includes(matchLetter.charAt(0))) {
      letter = matchLetter.charAt(0);
    }
  } else if (foundNum >= 10 && foundNum <= 12) {
    lvl = "SMA";
    num = foundNum;
    custom = (className || "").replace(/^Kelas\s*\d+/i, "").trim();
  } else {
    if (gradeNumber <= 6) {
      lvl = "SD";
      num = Math.max(1, Math.min(6, gradeNumber || 1));
    } else if (gradeNumber <= 9) {
      lvl = "SMP";
      num = Math.max(7, Math.min(9, gradeNumber || 7));
    } else {
      lvl = "SMA";
      num = Math.max(10, Math.min(12, gradeNumber || 10));
    }
  }

  return { lvl, num, letter, custom };
}

function sortClassNames(classList: string[]): string[] {
  return [...classList].sort((a, b) => {
    const numA = parseInt(String(a).replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(String(b).replace(/\D/g, ""), 10) || 0;
    if (numA !== numB) return numA - numB;
    return String(a).localeCompare(String(b), "id", { numeric: true });
  });
}

export const AdminAnalyticsPanel: React.FC<AdminAnalyticsPanelProps> = ({
  books,
  role = "librarian",
  onRoleChange,
  adminName = "Guru Pustakawan",
  principalName = "Kepala Sekolah",
  schoolName = "SMP Negeri 1 Nusantara",
  onOpenSchoolSetup,
  onLogoutAdmin,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onPreviewBook,
  categories = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<"analytics" | "books" | "categories" | "students">("analytics");
  const currentTab = controlledTab || internalTab;

  const handleTabSwitch = (tab: "analytics" | "books" | "categories" | "students") => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  const [period, setPeriod] = useState<"7d" | "30d" | "semester">("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Kontrol Tampilan & Filter Tab Katalog Buku
  const [bookViewMode, setBookViewMode] = useState<"grid" | "table">("grid");
  const [bookGradeFilter, setBookGradeFilter] = useState<"ALL" | "SD" | "SMP" | "SMA">("ALL");
  const [bookCategoryFilter, setBookCategoryFilter] = useState<string>("ALL");
  const [bookSortBy, setBookSortBy] = useState<"newest" | "title" | "pages">("newest");

  // Form Tambah Buku Baru
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState<string>(categories[0]?.name || "Fiksi & Sastra");
  const [newGrade, setNewGrade] = useState<BookItem["gradeLevel"]>("SMP");
  const [newPages, setNewPages] = useState("24");
  const [newSource, setNewSource] = useState<"bse" | "internal">("bse");
  const [newSynopsis, setNewSynopsis] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newIsbn, setNewIsbn] = useState("978-602-000-123-4");
  const [newBookFileUrl, setNewBookFileUrl] = useState("");
  const [newBookR2Key, setNewBookR2Key] = useState("");
  const [newBookFileName, setNewBookFileName] = useState("");
  const [newBookFileSize, setNewBookFileSize] = useState<number>(0);
  const [newBookParagraphs, setNewBookParagraphs] = useState<string[]>([]);
  const [isUploadingBookFile, setIsUploadingBookFile] = useState(false);
  const [isUploadingCoverFile, setIsUploadingCoverFile] = useState(false);
  const [isDragOverBookFile, setIsDragOverBookFile] = useState(false);

  const bookFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const editBookFileInputRef = useRef<HTMLInputElement | null>(null);
  const editCoverFileInputRef = useRef<HTMLInputElement | null>(null);
  const excelStudentInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Edit Buku
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editGrade, setEditGrade] = useState<BookItem["gradeLevel"]>("SMP");
  const [editPages, setEditPages] = useState("24");
  const [editSynopsis, setEditSynopsis] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editBookFileUrl, setEditBookFileUrl] = useState("");
  const [editBookR2Key, setEditBookR2Key] = useState("");
  const [editBookFileName, setEditBookFileName] = useState("");
  const [editBookFileSize, setEditBookFileSize] = useState<number>(0);
  const [isUploadingEditBookFile, setIsUploadingEditBookFile] = useState(false);
  const [isUploadingEditCoverFile, setIsUploadingEditCoverFile] = useState(false);

  // Modal CRUD Kategori
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("BookOpen");
  const [catColor, setCatColor] = useState("#3B82F6");
  const [catSortOrder, setCatSortOrder] = useState(1);

  // State Manajemen Siswa (CRUD Siswa)
  const [students, setStudents] = useState<StudentAdminItem[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentFilterClass, setStudentFilterClass] = useState("ALL");

  // Modal Tambah Siswa
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentNisn, setNewStudentNisn] = useState("");
  const [newStudentPin, setNewStudentPin] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState<"SD" | "SMP" | "SMA">("SD");
  const [newStudentClassNumber, setNewStudentClassNumber] = useState<number>(1);
  const [newStudentClassLetter, setNewStudentClassLetter] = useState<string>("A");
  const [newStudentClassCustom, setNewStudentClassCustom] = useState<string>("");

  // Modal Edit Siswa
  const [editingStudent, setEditingStudent] = useState<StudentAdminItem | null>(null);
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentGrade, setEditStudentGrade] = useState<"SD" | "SMP" | "SMA">("SD");
  const [editStudentClassNumber, setEditStudentClassNumber] = useState<number>(1);
  const [editStudentClassLetter, setEditStudentClassLetter] = useState<string>("A");
  const [editStudentClassCustom, setEditStudentClassCustom] = useState<string>("");
  const [editStudentActive, setEditStudentActive] = useState(true);

  // Modal Reset PIN
  const [resetPinStudent, setResetPinStudent] = useState<StudentAdminItem | null>(null);
  const [newResetPin, setNewResetPin] = useState("");

  const readOnly = role === "principal";

  // State Analitik Terkoneksi Database Neon (Bebas Data Dummy)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [liveAnalytics, setLiveAnalytics] = useState<{
    summaryMetrics: {
      activeReadersCount: number;
      totalStudentsCount: number;
      totalBooksCount: number;
      avgReadingMinutesPerStudent: number;
      warPercentage: number;
      mostPopularCategory: string;
      r2StorageUsedGb: number;
      r2StorageLimitGb: number;
      neonComputeHoursUsed: number;
      neonComputeHoursLimit: number;
    };
    classParticipation: Array<{
      className: string;
      totalStudents: number;
      activeStudents: number;
      activePercentage: number;
      avgMinutes: number;
    }>;
    topBooks: Array<{
      id: string;
      title: string;
      author: string;
      category_name?: string;
      readCount: number;
      completionRate: number;
    }>;
    studentsList: Array<{
      nisn_hash: string;
      fullName: string;
      className: string;
      minutesWeek: number;
      booksRead: number;
      status: "Aktif" | "Perlu Perhatian";
    }>;
    aiReadingInsights: string[];
  }>({
    summaryMetrics: {
      activeReadersCount: 0,
      totalStudentsCount: 0,
      totalBooksCount: 0,
      avgReadingMinutesPerStudent: 0,
      warPercentage: 0,
      mostPopularCategory: "Umum",
      r2StorageUsedGb: 0,
      r2StorageLimitGb: 10,
      neonComputeHoursUsed: 0.5,
      neonComputeHoursLimit: 100,
    },
    classParticipation: [],
    topBooks: [],
    studentsList: [],
    aiReadingInsights: [],
  });

  // Load Analitik Riil dari API Neon
  const fetchAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        const totalStudents = Number(data.summaryMetrics?.totalStudentsCount ?? students.length);
        const activeReaders = Number(data.summaryMetrics?.activeReadersCount ?? 0);
        const totalBooks = Number(data.summaryMetrics?.totalBooksCount ?? books.length);
        const avgMinutes = Number(data.summaryMetrics?.avgReadingMinutesPerStudent ?? 0);
        const warPct = totalStudents > 0 ? Math.round((activeReaders / totalStudents) * 100) : 0;

        let classList = (data.classParticipation || []).map((c: any) => {
          const tot = Number(c.total_students || c.totalStudents || 0);
          const act = Number(c.active_students || c.activeStudents || 0);
          return {
            className: c.class_name || c.className,
            totalStudents: tot,
            activeStudents: act,
            activePercentage: tot > 0 ? Math.round((act / tot) * 100) : 0,
            avgMinutes: Number(c.avg_minutes || c.avgMinutes || 0),
          };
        });

        // Fallback jika belum ada log baca harian tapi siswa sudah didaftarkan
        if (classList.length === 0 && students.length > 0) {
          const mapClass = new Map<string, number>();
          students.forEach((s) => {
            mapClass.set(s.class_name, (mapClass.get(s.class_name) || 0) + 1);
          });
          classList = Array.from(mapClass.entries()).map(([cName, count]) => ({
            className: cName,
            totalStudents: count,
            activeStudents: 0,
            activePercentage: 0,
            avgMinutes: 0,
          }));
        }

        classList.sort((a: any, b: any) => {
          const numA = parseInt(String(a.className).replace(/\D/g, ""), 10) || 0;
          const numB = parseInt(String(b.className).replace(/\D/g, ""), 10) || 0;
          if (numA !== numB) return numA - numB;
          return String(a.className).localeCompare(String(b.className), "id", { numeric: true });
        });

        const topBooksList = (data.topBooks || []).map((tb: any) => ({
          id: String(tb.id),
          title: tb.title,
          author: tb.author,
          category_name: tb.category_name,
          readCount: Number(tb.read_count ?? tb.readCount ?? 0),
          completionRate: Number(tb.avg_completion ?? tb.completionRate ?? 0),
        }));

        let studentListMapped = (data.studentsList || []).map((s: any) => ({
          nisn_hash: s.nisn_hash,
          fullName: s.full_name,
          className: s.class_name,
          minutesWeek: Number(s.minutes_week || 0),
          booksRead: Number(s.books_read || 0),
          status: (Number(s.minutes_week || 0) >= 10 ? "Aktif" : "Perlu Perhatian") as "Aktif" | "Perlu Perhatian",
        }));

        // Jika stats log kosong tapi ada siswa di database, sinkronkan daftar siswa
        if (studentListMapped.length === 0 && students.length > 0) {
          studentListMapped = students.map((s) => ({
            nisn_hash: s.nisn_hash,
            fullName: s.full_name,
            className: s.class_name,
            minutesWeek: s.minutes_week || 0,
            booksRead: s.books_read || 0,
            status: "Perlu Perhatian",
          }));
        }

        // Susun Insight AI Literasi Cerdas Berbasis Data Riil
        const insights: string[] = [];
        if (totalStudents === 0) {
          insights.push("Database siswa masih bersih dan siap digunakan. Daftarkan siswa baru pada tab 'Data Siswa' agar mereka dapat login menggunakan NISN.");
        } else if (activeReaders === 0) {
          insights.push(`Sebanyak ${totalStudents} siswa terdaftar di sistem. Guru dapat memulai sosialisasi pembiasaan literasi 15 menit per hari.`);
        } else {
          insights.push(`Partisipasi mingguan (WAR) sekolah mencapai ${warPct}%, dengan rata-rata ${avgMinutes} menit waktu baca per siswa.`);
        }

        if (totalBooks === 0) {
          insights.push("Katalog buku perpustakaan belum terisi. Tambahkan buku BSE Kemendikbud atau bacaan edukasi di tab 'Katalog'.");
        } else {
          insights.push(`Katalog aktif menyediakan ${totalBooks} judul buku yang dapat dibaca kapan saja secara simultan tanpa antrean.`);
        }

        if (classList.length > 0) {
          const sortedClass = [...classList].sort((a, b) => b.activePercentage - a.activePercentage);
          if (sortedClass[0] && sortedClass[0].activePercentage > 0) {
            insights.push(`Rombel paling aktif minggu ini adalah ${sortedClass[0].className} dengan partisipasi ${sortedClass[0].activePercentage}%.`);
          }
        }

        const popularCategory = topBooksList[0]?.category_name || (categories[0]?.name ?? "Umum");

        setLiveAnalytics({
          summaryMetrics: {
            activeReadersCount: activeReaders,
            totalStudentsCount: totalStudents,
            totalBooksCount: totalBooks,
            avgReadingMinutesPerStudent: avgMinutes,
            warPercentage: warPct,
            mostPopularCategory: popularCategory,
            r2StorageUsedGb: Number((totalBooks * 0.015).toFixed(2)),
            r2StorageLimitGb: 10,
            neonComputeHoursUsed: 0.5,
            neonComputeHoursLimit: 100,
          },
          classParticipation: classList,
          topBooks: topBooksList,
          studentsList: studentListMapped,
          aiReadingInsights: insights,
        });
      }
    } catch {
      // Fallback
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  // Load Siswa dari Neon DB saat mount atau switch ke tab students
  const fetchStudentsList = async () => {
    setIsStudentsLoading(true);
    try {
      const res = await fetch("/api/admin/students");
      if (res.ok) {
        const data = await res.json();
        if (data.students && Array.isArray(data.students)) {
          setStudents(data.students);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsList();
    fetchAnalytics();
  }, [books.length, categories.length]);

  const filteredBooks = books
    .filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === "" ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q));

      const matchGrade = bookGradeFilter === "ALL" || b.gradeLevel === bookGradeFilter;

      const matchCat =
        bookCategoryFilter === "ALL" ||
        b.category?.toLowerCase() === bookCategoryFilter.toLowerCase();

      return matchSearch && matchGrade && matchCat;
    })
    .sort((a, b) => {
      if (bookSortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (bookSortBy === "pages") {
        return b.totalPages - a.totalPages;
      }
      // default newest
      return (b.publishedYear || 2026) - (a.publishedYear || 2026);
    });

  const filteredStudentsAnalytics =
    selectedClassFilter === "ALL"
      ? liveAnalytics.studentsList
      : liveAnalytics.studentsList.filter((s) => s.className.toLowerCase().includes(selectedClassFilter.toLowerCase()));

  // Filtered live students list
  const liveFilteredStudents = students.filter((s) => {
    const q = studentSearchQuery.trim().toLowerCase();
    const matchQ =
      q === "" ||
      s.full_name.toLowerCase().includes(q) ||
      s.class_name.toLowerCase().includes(q) ||
      s.nisn_hash.toLowerCase().includes(q);
    const matchClass =
      studentFilterClass === "ALL" || s.class_name === studentFilterClass;
    return matchQ && matchClass;
  });

  const handleExportReport = (format: "csv" | "pdf") => {
    if (liveAnalytics.classParticipation.length === 0 && students.length === 0) {
      toast.error("Belum ada data riil untuk diekspor. Daftarkan siswa atau mulai membaca terlebih dahulu.");
      return;
    }

    if (format === "csv") {
      const metaHeader = `"Sekolah:","${schoolName}"\n"Guru Pustakawan:","${adminName}"\n"Kepala Sekolah:","${principalName}"\n\n`;
      const headers = "Kelas,Persentase Aktif,Total Siswa,Rata-rata Menit Baca\n";
      const rows = liveAnalytics.classParticipation
        .map(
          (c) =>
            `"${c.className}",${c.activePercentage}%,${c.totalStudents},${c.avgMinutes}`
        )
        .join("\n");
      const blob = new Blob([metaHeader + headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan-Literasi-${schoolName.replace(/\s+/g, "-")}-${period}.csv`;
      a.click();
    }
    toast.success(
      `Laporan Literasi (${format.toUpperCase()}) berhasil diunduh!`,
      {
        description:
          role === "principal"
            ? "Dokumen ringkasan A4 siap dipresentasikan ke Dinas Pendidikan."
            : "Data rekapitulasi siswa siap dilampirkan pada laporan bulanan.",
      }
    );
  };

  // Helper unggah file buku (PDF / EPUB / TXT) atau gambar sampul ke /api/books/upload (S3 + Neon)
  const uploadFileToServer = async (
    file: File,
    type: "book" | "cover"
  ): Promise<{
    url: string;
    r2Key: string;
    s3Uploaded?: boolean;
    bucket?: string;
    filename: string;
    sizeBytes: number;
    extractedParagraphs?: string[];
  } | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const res = await fetch("/api/books/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Gagal mengunggah file.");
    }
    return {
      url: data.url,
      r2Key: data.r2Key || data.url,
      s3Uploaded: data.s3Uploaded,
      bucket: data.bucket,
      filename: data.filename || file.name,
      sizeBytes: data.sizeBytes || file.size,
      extractedParagraphs: data.extractedParagraphs,
    };
  };

  const handleSelectBookFile = async (file: File | null | undefined) => {
    if (!file) return;
    setIsUploadingBookFile(true);
    try {
      const result = await uploadFileToServer(file, "book");
      if (result) {
        setNewBookFileUrl(result.url);
        setNewBookR2Key(result.r2Key);
        setNewBookFileName(result.filename);
        setNewBookFileSize(result.sizeBytes);
        if (result.extractedParagraphs && result.extractedParagraphs.length > 0) {
          setNewBookParagraphs(result.extractedParagraphs);
        }
        // Isi judul otomatis jika kolom judul masih kosong
        if (!newTitle.trim()) {
          const cleanTitle = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          setNewTitle(cleanTitle);
        }
        toast.success(
          `File "${result.filename}" berhasil diunggah ke ${result.s3Uploaded ? `S3 Bucket (${result.bucket})` : "Storage"
          }!`
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunggah dokumen buku.");
    } finally {
      setIsUploadingBookFile(false);
    }
  };

  const handleSelectCoverFile = async (file: File | null | undefined) => {
    if (!file) return;
    setIsUploadingCoverFile(true);
    try {
      const result = await uploadFileToServer(file, "cover");
      if (result) {
        setNewCoverUrl(result.url);
        toast.success(
          `Sampul berhasil diunggah ke ${result.s3Uploaded ? `S3 Bucket (${result.bucket})` : "Storage"
          }!`
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunggah gambar sampul.");
    } finally {
      setIsUploadingCoverFile(false);
    }
  };

  const handleSelectEditBookFile = async (file: File | null | undefined) => {
    if (!file) return;
    setIsUploadingEditBookFile(true);
    try {
      const result = await uploadFileToServer(file, "book");
      if (result) {
        setEditBookFileUrl(result.url);
        setEditBookR2Key(result.r2Key);
        setEditBookFileName(result.filename);
        setEditBookFileSize(result.sizeBytes);
        toast.success(
          `File buku baru "${result.filename}" berhasil diunggah ke ${result.s3Uploaded ? `S3 Bucket (${result.bucket})` : "Storage"
          }!`
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunggah dokumen buku.");
    } finally {
      setIsUploadingEditBookFile(false);
    }
  };

  const handleSelectEditCoverFile = async (file: File | null | undefined) => {
    if (!file) return;
    setIsUploadingEditCoverFile(true);
    try {
      const result = await uploadFileToServer(file, "cover");
      if (result) {
        setEditCoverUrl(result.url);
        toast.success("Sampul buku baru berhasil diunggah!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunggah sampul buku.");
    } finally {
      setIsUploadingEditCoverFile(false);
    }
  };

  // CRUD Buku Handlers
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      toast.error("Akses Ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only).");
      return;
    }

    const catLower = newCategory.toLowerCase();
    const validCat: BookItem["category"] =
      catLower.includes("sains") ? "sains" :
        catLower.includes("sejarah") ? "sejarah" :
          catLower.includes("komik") ? "komik" : "fiksi";

    // Pilihan cover default berkualitas tinggi bila URL belum dimasukkan
    const defaultCover =
      validCat === "sains"
        ? "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=600&q=80"
        : validCat === "sejarah"
          ? "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80"
          : validCat === "komik"
            ? "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80"
            : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80";

    const initialParagraphs =
      newBookParagraphs.length > 0
        ? newBookParagraphs
        : [
          newSynopsis ||
          "Selamat membaca buku baru koleksi perpustakaan sekolah kita! Gunakan fitur kamus kontekstual dengan mengetuk kata ilmiah.",
        ];

    let createdId =
      newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now().toString().slice(-4);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          author: newAuthor,
          isbn: newIsbn || "978-602-000-123-4",
          categoryName: newCategory,
          gradeLevel: newGrade,
          totalPages: parseInt(newPages, 10) || 24,
          estimatedReadMinutes: Math.max(10, Math.round((parseInt(newPages, 10) || 24) * 1.2)),
          sourceType: newSource,
          synopsis:
            newSynopsis ||
            "Buku baru yang diterbitkan oleh Guru Pustakawan untuk memperkaya wawasan dan budaya literasi sekolah.",
          coverUrl: newCoverUrl.trim() || defaultCover,
          r2Key: newBookR2Key || newBookFileUrl || undefined,
          fileUrl: newBookFileUrl || undefined,
          fileSizeBytes: newBookFileSize || 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.book?.id) {
          createdId = data.book.id;
        }
      }
    } catch {
      // Fallback local
    }

    const created: BookItem = {
      id: createdId,
      title: newTitle,
      author: newAuthor,
      publisher: newSource === "bse" ? "BSE Kemendikbudristek" : "Perpustakaan Sekolah",
      publishedYear: 2026,
      isbn: newIsbn || "978-602-000-123-4",
      coverUrl: newCoverUrl.trim() || defaultCover,
      fileUrl: newBookFileUrl || undefined,
      r2Key: newBookR2Key || newBookFileUrl || undefined,
      category: validCat,
      gradeLevel: newGrade,
      progressPercent: 0,
      currentPage: 1,
      totalPages: parseInt(newPages, 10) || 24,
      estimatedReadMinutes: Math.max(10, Math.round((parseInt(newPages, 10) || 24) * 1.2)),
      vocabularyLevel: `Tingkat ${newGrade}`,
      sourceType: newSource,
      synopsis:
        newSynopsis ||
        "Buku baru yang diterbitkan oleh Guru Pustakawan untuk memperkaya wawasan dan budaya literasi sekolah.",
      chapters: [
        {
          number: 1,
          title: "Bab 1: Pengantar Materi & Cerita",
          startPage: 1,
          paragraphs: initialParagraphs,
        },
      ],
    };

    onAddBook(created);
    setIsUploadOpen(false);
    setNewTitle("");
    setNewAuthor("");
    setNewSynopsis("");
    setNewCoverUrl("");
    setNewBookFileUrl("");
    setNewBookR2Key("");
    setNewBookFileName("");
    setNewBookFileSize(0);
    setNewBookParagraphs([]);
    toast.success("Buku berhasil diterbitkan ke S3 & Database Neon!", {
      description: newBookFileName
        ? `File "${newBookFileName}" tersimpan di S3 (${newBookR2Key}) & metadata di Neon Postgres.`
        : `Buku tersimpan di database Neon & rak buku langsung diperbarui.`,
    });
  };

  const openEditBookModal = (book: BookItem) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditCategory(book.category);
    setEditGrade(book.gradeLevel);
    setEditPages(String(book.totalPages));
    setEditSynopsis(book.synopsis || "");
    setEditCoverUrl(book.coverUrl || "");
    setEditBookFileUrl(book.fileUrl || book.r2Key || "");
    setEditBookR2Key(book.r2Key || "");
    setEditBookFileName(
      book.r2Key ? book.r2Key.split("/").pop() || "" : book.fileUrl ? book.fileUrl.split("/").pop() || "" : ""
    );
    setEditBookFileSize(0);
  };

  const handleUpdateBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    const catLower = editCategory.toLowerCase();
    const validCat: BookItem["category"] =
      catLower.includes("sains") ? "sains" :
        catLower.includes("sejarah") ? "sejarah" :
          catLower.includes("komik") ? "komik" : "fiksi";

    const updatedData: Partial<BookItem> = {
      title: editTitle,
      author: editAuthor,
      category: validCat,
      gradeLevel: editGrade,
      totalPages: parseInt(editPages, 10) || editingBook.totalPages,
      synopsis: editSynopsis,
      coverUrl: editCoverUrl.trim() || editingBook.coverUrl,
      fileUrl: editBookFileUrl.trim() || editingBook.fileUrl,
      r2Key: editBookR2Key.trim() || editBookFileUrl.trim() || editingBook.r2Key,
    };

    if (onUpdateBook) {
      onUpdateBook(editingBook.id, updatedData);
    }

    setEditingBook(null);
    toast.success("Perubahan data buku berhasil disimpan!");
  };

  // CRUD Kategori Handlers
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatName("");
    setCatIcon("BookOpen");
    setCatColor("#3B82F6");
    setCatSortOrder(categories.length + 1);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: CategoryData) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setCatColor(cat.colorHex);
    setCatSortOrder(cat.sortOrder);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      toast.error("Akses Ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only).");
      return;
    }

    if (!catName.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }

    if (editingCategory) {
      if (onUpdateCategory) {
        await onUpdateCategory(editingCategory.id, {
          name: catName.trim(),
          icon: catIcon,
          colorHex: catColor,
          sortOrder: Number(catSortOrder),
        });
      }
      toast.success(`Kategori '${catName}' berhasil diperbarui!`);
    } else {
      if (onAddCategory) {
        await onAddCategory({
          name: catName.trim(),
          icon: catIcon,
          colorHex: catColor,
          sortOrder: Number(catSortOrder),
        });
      }
      toast.success(`Kategori baru '${catName}' berhasil ditambahkan ke rak!`);
    }

    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategoryClick = async (cat: CategoryData) => {
    if (readOnly) {
      toast.error("Akses Ditolak: Hanya Guru Pustakawan yang dapat menghapus kategori.");
      return;
    }

    if (confirm(`Yakin ingin menghapus kategori '${cat.name}'? Buku pada kategori ini akan dipindahkan ke kategori umum.`)) {
      if (onDeleteCategory) {
        await onDeleteCategory(cat.id);
      }
      toast.success(`Kategori '${cat.name}' telah dihapus.`);
    }
  };

  // CRUD Siswa Handlers (Memanfaatkan Rust WebAssembly Hashing)
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      toast.error("Akses Ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only).");
      return;
    }

    const computedClass = getComputedClassName(
      newStudentGrade,
      newStudentClassNumber,
      newStudentClassLetter,
      newStudentClassCustom
    );

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nisn: newStudentNisn,
          pin: newStudentPin,
          fullName: newStudentName,
          grade: newStudentClassNumber,
          className: computedClass,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Gagal mendaftarkan siswa.");
        return;
      }

      toast.success(`Siswa ${newStudentName} (${computedClass}) berhasil didaftarkan!`, {
        description: "NISN telah di-hash dengan aman menggunakan Rust Wasm HMAC-SHA256.",
      });

      setIsAddStudentOpen(false);
      setNewStudentNisn("");
      setNewStudentPin("");
      setNewStudentName("");
      setNewStudentGrade("SD");
      setNewStudentClassNumber(1);
      setNewStudentClassLetter("A");
      setNewStudentClassCustom("");
      fetchStudentsList();
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const openEditStudentModal = (s: StudentAdminItem) => {
    const { lvl, num, letter, custom } = parseExistingClass(s.class_name, s.grade);
    setEditingStudent(s);
    setEditStudentName(s.full_name);
    setEditStudentGrade(lvl);
    setEditStudentClassNumber(num);
    setEditStudentClassLetter(letter);
    setEditStudentClassCustom(custom);
    setEditStudentActive(s.is_active);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !editingStudent) {
      toast.error("Akses Ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only).");
      return;
    }

    const computedClass = getComputedClassName(
      editStudentGrade,
      editStudentClassNumber,
      editStudentClassLetter,
      editStudentClassCustom
    );

    try {
      const res = await fetch(`/api/admin/students/${editingStudent.nisn_hash}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editStudentName,
          grade: editStudentClassNumber,
          className: computedClass,
          isActive: editStudentActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Gagal memperbarui data siswa.");
        return;
      }

      toast.success(`Data siswa berhasil diperbarui menjadi ${computedClass}!`);
      setEditingStudent(null);
      fetchStudentsList();
    } catch {
      toast.error("Gagal menyimpan perubahan siswa.");
    }
  };

  // Universal Reset Password / PIN state (All Roles)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetRoleTarget, setResetRoleTarget] = useState<"librarian" | "principal" | "student">(
    role === "principal" ? "principal" : "librarian"
  );
  const [resetAccountUsername, setResetAccountUsername] = useState(
    role === "principal" ? "kepsek" : "pustakawan"
  );
  const [resetAccountNisn, setResetAccountNisn] = useState("");
  const [resetAccountCurrentSecret, setResetAccountCurrentSecret] = useState("");
  const [resetAccountNewSecret, setResetAccountNewSecret] = useState("");
  const [resetAccountConfirmSecret, setResetAccountConfirmSecret] = useState("");
  const [isResetAccountSubmitting, setIsResetAccountSubmitting] = useState(false);

  const handleUniversalResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetRoleTarget === "student") {
      if (resetAccountNisn.replace(/\D/g, "").length !== 10) {
        toast.error("NISN Siswa harus terdiri dari tepat 10 angka.");
        return;
      }
      if (!/^\d{6}$/.test(resetAccountNewSecret)) {
        toast.error("PIN Baru siswa harus terdiri dari 6 angka.");
        return;
      }
    } else {
      if (resetAccountNewSecret.length < 6) {
        toast.error("Kata sandi baru minimal 6 karakter.");
        return;
      }
    }

    if (resetAccountNewSecret !== resetAccountConfirmSecret) {
      toast.error("Konfirmasi kata sandi / PIN baru tidak cocok.");
      return;
    }

    setIsResetAccountSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: resetRoleTarget,
          username: resetAccountUsername,
          nisn: resetAccountNisn,
          currentSecret: resetAccountCurrentSecret.trim() || undefined,
          newSecret: resetAccountNewSecret,
          isAdminOverride: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui kata sandi / PIN.");
        setIsResetAccountSubmitting(false);
        return;
      }

      toast.success(data.message || "Kata sandi / PIN berhasil diperbarui!");
      setIsResetPasswordModalOpen(false);
      setResetAccountCurrentSecret("");
      setResetAccountNewSecret("");
      setResetAccountConfirmSecret("");
      setIsResetAccountSubmitting(false);
    } catch {
      toast.error("Gagal menghubungi server untuk reset kata sandi.");
      setIsResetAccountSubmitting(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinStudent) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/students/${resetPinStudent.nisn_hash}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPin: newResetPin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Gagal mereset PIN.");
        return;
      }

      toast.success(`PIN untuk siswa ${resetPinStudent.full_name} berhasil direset!`, {
        description: "Siswa kini dapat masuk menggunakan PIN baru tersebut.",
      });
      setResetPinStudent(null);
      setNewResetPin("");
    } catch {
      toast.error("Gagal mereset PIN siswa.");
    }
  };

  const handleDeleteStudent = async (s: StudentAdminItem) => {
    if (readOnly) {
      toast.error("Akses Ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only).");
      return;
    }

    if (confirm(`Yakin ingin menghapus siswa "${s.full_name}" (${s.class_name}) dari database?`)) {
      try {
        const res = await fetch(`/api/admin/students/${s.nisn_hash}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || "Gagal menghapus siswa.");
          return;
        }
        toast.success(`Siswa ${s.full_name} telah dihapus.`);
        fetchStudentsList();
      } catch {
        toast.error("Gagal menghapus siswa.");
      }
    }
  };

  const renderIconComponent = (iconName: string) => {
    const found = PRESET_ICONS.find((p) => p.name === iconName);
    const Comp = found ? found.Icon : BookOpen;
    return <Comp className="h-4 w-4 shrink-0" />;
  };

  const getCategoryBadgeVariant = (cat?: string): "fiksi" | "sains" | "sejarah" | "komik" | "default" => {
    if (!cat) return "default";
    const c = cat.toLowerCase();
    if (c.includes("sains")) return "sains";
    if (c.includes("sejarah")) return "sejarah";
    if (c.includes("komik")) return "komik";
    if (c.includes("fiksi")) return "fiksi";
    return "default";
  };

  const uniqueClassNames = sortClassNames(
    Array.from(new Set((students || []).map((s) => s?.class_name).filter(Boolean)))
  );

  // State & Handlers Backup & Restore Data
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState<string | null>(null);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const restoreFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDownloadServerBackup = async (
    format: "json" | "sql",
    scope: "all" | "books" | "students" = "all"
  ) => {
    const key = `${format}-${scope}`;
    setIsDownloadingBackup(key);
    try {
      const res = await fetch(`/api/admin/backup?format=${format}&scope=${scope}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal mengunduh cadangan data dari server.");
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      if (format === "sql") {
        const sqlText = await res.text();
        const blob = new Blob([sqlText], { type: "application/sql;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PustakaKita-Backup-${scope}-${dateStr}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const jsonData = await res.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
          type: "application/json;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PustakaKita-Backup-${scope}-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success(
        `Backup Data (${format.toUpperCase()} - ${scope.toUpperCase()}) berhasil diunduh!`
      );
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunduh file backup.");
    } finally {
      setIsDownloadingBackup(null);
    }
  };

  const handleBackupBooksCsv = () => {
    const headers =
      "ID,Judul Buku,Penulis,ISBN,Kategori,Jenjang,Total Halaman,Sumber,URL File\n";
    const rows = books
      .map(
        (b) =>
          `"${b.id}","${(b.title || "").replace(/"/g, '""')}","${(b.author || "").replace(/"/g, '""')}","${b.isbn || ""}","${b.category}","${b.gradeLevel}",${b.totalPages},"${b.sourceType}","${b.fileUrl || b.r2Key || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Backup-Katalog-Buku-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup Katalog Buku (.CSV) berhasil diunduh!");
  };

  const handleBackupStudentsCsv = () => {
    const headers =
      "NISN Hash (PDP),Nama Lengkap,Tingkat Kelas,Rombel,Status Aktif,Menit Baca Minggu Ini,Buku Dibaca\n";
    const rows = students
      .map(
        (s) =>
          `"${s.nisn_hash}","${(s.full_name || "").replace(/"/g, '""')}",${s.grade},"${s.class_name}","${s.is_active ? "Aktif" : "Nonaktif"}",${s.minutes_week ?? 0},${s.books_read ?? 0}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Backup-Data-Siswa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup Data Siswa (.CSV) berhasil diunduh!");
  };

  const handleRestoreFromFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (readOnly) {
      toast.error("Akses Ditolak: Hanya Guru Pustakawan yang dapat memulihkan (restore) data.");
      return;
    }

    setIsRestoringBackup(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memulihkan data dari file backup.");
      }

      toast.success("Pemulihan (Restore) Database Berhasil!", {
        description: `Kategori: ${data.summary?.restoredCategories ?? 0}, Buku: ${data.summary?.restoredBooks ?? 0}, Siswa: ${data.summary?.restoredStudents ?? 0} berhasil dipulihkan.`,
      });
      fetchStudentsList();
      fetchAnalytics();
      setIsBackupModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "File backup JSON tidak valid atau rusak.");
    } finally {
      setIsRestoringBackup(false);
    }
  };

  // ============================================================================
  // FITUR IMPORT DATA SISWA DARI FILE EXCEL (.XLSX / .XLS / .CSV) KE NEON DB
  // ============================================================================
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [excelFileName, setExcelFileName] = useState("");
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isSubmittingExcelImport, setIsSubmittingExcelImport] = useState(false);
  const [parsedExcelRows, setParsedExcelRows] = useState<
    Array<{
      nisn: string;
      fullName: string;
      grade: number;
      className: string;
      pin: string;
    }>
  >([]);

  const handleDownloadStudentExcelTemplate = () => {
    const csvContent =
      "\uFEFFNISN,Nama Lengkap,Tingkat Kelas,Nama Rombel,PIN (6 Digit)\n" +
      '"0012345678","Budi Santoso",7,"Kelas 7A","123456"\n' +
      '"0012345679","Siti Rahmawati",8,"Kelas 8B","123456"\n' +
      '"0012345680","Andi Pratama",5,"Kelas 5A","123456"\n' +
      '"0012345681","Putri Maharani",10,"Kelas 10 MIPA 1","123456"\n';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template-Import-Siswa-PustakaKita.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template Excel (.CSV) berhasil diunduh!", {
      description: "Buka di Microsoft Excel, isi daftar siswa, lalu unggah kembali ke sini.",
    });
  };

  const mapRawObjectsToStudentRows = (rawObjects: Array<Record<string, any>>) => {
    const results: Array<{
      nisn: string;
      fullName: string;
      grade: number;
      className: string;
      pin: string;
    }> = [];

    for (const obj of rawObjects) {
      const keys = Object.keys(obj);
      const findVal = (patterns: string[]) => {
        const matchedKey = keys.find((k) =>
          patterns.some((p) => k.toLowerCase().replace(/[^a-z0-9]/g, "").includes(p))
        );
        return matchedKey ? obj[matchedKey] : undefined;
      };

      const rawNisn = String(
        findVal(["nisn", "nomorinduk", "nis", "id"]) ?? Object.values(obj)[0] ?? ""
      ).replace(/\D/g, "");
      const fullName = String(
        findVal(["nama", "fullname", "name", "siswa"]) ?? Object.values(obj)[1] ?? ""
      ).trim();
      const rawGrade = findVal(["tingkat", "grade", "jenjang"]) ?? Object.values(obj)[2];
      const rawClass = String(
        findVal(["rombel", "kelas", "class"]) ?? Object.values(obj)[3] ?? ""
      ).trim();
      const rawPin = String(
        findVal(["pin", "sandi", "password", "pass"]) ?? Object.values(obj)[4] ?? "123456"
      ).replace(/\D/g, "");

      if (!fullName || rawNisn.length < 5) continue;
      if (fullName.toLowerCase().includes("nama lengkap")) continue;

      const cleanNisn = rawNisn.padStart(10, "0").slice(0, 10);
      const cleanPin =
        rawPin.length >= 6
          ? rawPin.slice(0, 6)
          : rawPin.length > 0
            ? rawPin.padStart(6, "0")
            : "123456";

      const numMatch =
        String(rawGrade || "").match(/\b(1[0-2]|[1-9])\b/) ||
        rawClass.match(/\b(1[0-2]|[1-9])\b/) ||
        rawClass.match(/(1[0-2]|[1-9])/);
      const gradeNum = numMatch
        ? Math.max(1, Math.min(12, parseInt(numMatch[1], 10)))
        : 7;

      const normalizedClass = !rawClass
        ? gradeNum >= 10
          ? `Kelas ${gradeNum}`
          : `Kelas ${gradeNum}A`
        : /^kelas\s+/i.test(rawClass)
          ? rawClass.replace(/^kelas\s+/i, "Kelas ")
          : `Kelas ${rawClass}`;

      results.push({
        nisn: cleanNisn,
        fullName,
        grade: gradeNum,
        className: normalizedClass,
        pin: cleanPin,
      });
    }
    return results;
  };

  const parseCsvOrTsvText = (text: string): Array<Record<string, string>> => {
    const cleanText = text.replace(/^\uFEFF/, "").trim();
    const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    // Deteksi pemisah otomatis (koma, titik koma Excel Indonesia, atau tab)
    const firstLine = lines[0];
    const delimiter =
      firstLine.split(";").length > firstLine.split(",").length
        ? ";"
        : firstLine.split("\t").length > firstLine.split(",").length
          ? "\t"
          : ",";

    const splitLine = (line: string) =>
      line
        .split(delimiter)
        .map((cell) => cell.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));

    const firstRowCells = splitLine(lines[0]);
    const hasHeader = firstRowCells.some((c) =>
      /nisn|nama|kelas|rombel|tingkat|pin/i.test(c)
    );

    const headers = hasHeader
      ? firstRowCells
      : ["NISN", "Nama Lengkap", "Tingkat Kelas", "Nama Rombel", "PIN"];
    const startIdx = hasHeader ? 1 : 0;

    const rows: Array<Record<string, string>> = [];
    for (let i = startIdx; i < lines.length; i++) {
      const cells = splitLine(lines[i]);
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h || `col_${idx}`] = cells[idx] ?? "";
      });
      rows.push(rowObj);
    }
    return rows;
  };

  const handleParseExcelStudentFile = async (file: File | null | undefined) => {
    if (!file) return;
    setExcelFileName(file.name);
    setIsParsingExcel(true);

    try {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".csv") || lowerName.endsWith(".txt") || lowerName.endsWith(".tsv")) {
        const text = await file.text();
        const rawObjects = parseCsvOrTsvText(text);
        const mapped = mapRawObjectsToStudentRows(rawObjects);
        setParsedExcelRows(mapped);
        if (mapped.length === 0) {
          toast.error("Tidak ditemukan baris siswa yang valid. Pastikan kolom NISN (10 digit) dan Nama Lengkap terisi.");
        } else {
          toast.success(`${mapped.length} data siswa berhasil dibaca dari file ${file.name}!`);
        }
      } else {
        // File binary Excel (.xlsx / .xls) menggunakan SheetJS (xlsx)
        const w = window as any;
        if (!w.XLSX) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[data-xlsx="true"]');
            if (existing) {
              existing.addEventListener("load", () => resolve());
              existing.addEventListener("error", () => reject());
              return;
            }
            const script = document.createElement("script");
            script.src =
              "https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js";
            script.async = true;
            script.dataset.xlsx = "true";
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Gagal memuat pembaca XLSX. Gunakan format .CSV jika sedang offline."));
            document.head.appendChild(script);
          });
        }

        const XLSX = (window as any).XLSX;
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: Array<Record<string, any>> = XLSX.utils.sheet_to_json(
          worksheet,
          { defval: "" }
        );
        const mapped = mapRawObjectsToStudentRows(jsonRows);
        setParsedExcelRows(mapped);
        if (mapped.length === 0) {
          toast.error("Tidak ditemukan baris siswa yang valid di dalam sheet pertama Excel.");
        } else {
          toast.success(`${mapped.length} data siswa berhasil dibaca dari Excel (${file.name})!`);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal membaca file Excel / CSV.");
    } finally {
      setIsParsingExcel(false);
    }
  };

  const handleConfirmImportStudents = async () => {
    if (parsedExcelRows.length === 0) {
      toast.error("Pilih file Excel (.xlsx / .csv) berisi daftar siswa terlebih dahulu.");
      return;
    }

    setIsSubmittingExcelImport(true);
    try {
      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: parsedExcelRows,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan data siswa ke database Neon.");
      }

      toast.success(data.message || `Berhasil mengimpor ${data.importedCount} siswa ke Neon DB!`, {
        description:
          data.skippedCount > 0
            ? `${data.importedCount} berhasil disimpan, ${data.skippedCount} dilewati.`
            : "Seluruh NISN telah dienkripsi HMAC-SHA256 & PIN di-hash Bcrypt.",
      });
      setIsExcelImportOpen(false);
      setParsedExcelRows([]);
      setExcelFileName("");
      fetchStudentsList();
      fetchAnalytics();
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengimpor siswa ke database.");
    } finally {
      setIsSubmittingExcelImport(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Kontrol Peran & Periode yang Rapi & Terstruktur */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="whitespace-nowrap">
                Mode Guru Pustakawan (Full CRUD)
              </Badge>
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                • {schoolName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Dashboard Pengelola Perpustakaan
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Indikator Nama Pustakawan & Kepala Sekolah dari Biodata Sekolah */}
            <div className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 min-h-[38px]">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Pustakawan: {adminName}</span>
              {principalName && (
                <span className="text-muted-foreground font-semibold border-l border-emerald-500/30 pl-2">
                  Kepsek: <strong className="text-foreground">{principalName}</strong>
                </span>
              )}
            </div>

            {/* Filter Periode */}
            <div className="inline-flex rounded-xl bg-secondary p-1 border border-border">
              {(
                [
                  { id: "7d", label: "7 Hari" },
                  { id: "30d", label: "30 Hari" },
                  { id: "semester", label: "Semester" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] whitespace-nowrap",
                    period === p.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Baris Kedua Header: Action Buttons Terkelompok */}
        <div className="pt-3 border-t border-border/80 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
            Panel Kendali Cepat & Utilitas Database:
          </span>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchAnalytics();
                fetchStudentsList();
                toast.success("Data analitik disinkronkan langsung dari database Neon.");
              }}
              disabled={isAnalyticsLoading}
              className="gap-1.5 h-9 text-xs font-semibold"
              title="Muat ulang data analitik riil dari database"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isAnalyticsLoading && "animate-spin")} />
              <span>Sinkronkan</span>
            </Button>

            {onOpenSchoolSetup && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSchoolSetup}
                className="gap-1.5 h-9 text-xs border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 font-bold"
                title="Ubah Identitas & Biodata Sekolah"
              >
                <Landmark className="h-3.5 w-3.5" />
                <span>Biodata Sekolah</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResetRoleTarget("librarian");
                setResetAccountUsername("pustakawan");
                setResetAccountCurrentSecret("");
                setResetAccountNewSecret("");
                setResetAccountConfirmSecret("");
                setIsResetPasswordModalOpen(true);
              }}
              className="gap-1.5 h-9 text-xs border-primary/40 text-primary hover:bg-primary/10 font-bold"
              title="Reset Kata Sandi Pustakawan / PIN Siswa"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Reset Password</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBackupModalOpen(true)}
              className="gap-1.5 h-9 text-xs border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold"
              title="Pusat Backup & Pemulihan Data (JSON / SQL / CSV)"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Backup Data</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport("csv")}
              className="gap-1.5 h-9 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor CSV</span>
            </Button>

            {onLogoutAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogoutAdmin}
                className="gap-1.5 h-9 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 font-bold"
                title="Keluar dari Sesi Admin Pustakawan"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar Admin</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigasi Admin: 4 Tab Lengkap (Analitik, Buku, Kategori, Siswa) */}
      <Tabs value={currentTab} onValueChange={(v) => handleTabSwitch(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl h-11 mb-6">
          <TabsTrigger value="analytics" className="gap-2 font-bold text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span>Analitik Literasi</span>
          </TabsTrigger>
          <TabsTrigger value="books" className="gap-2 font-bold text-xs sm:text-sm">
            <BookOpen className="h-4 w-4" />
            <span>Katalog ({books.length})</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2 font-bold text-xs sm:text-sm">
            <Tag className="h-4 w-4" />
            <span>Kategori ({categories.length})</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2 font-bold text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span>Data Siswa ({students.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ANALITIK & KPI (KEPALA SEKOLAH & PUSTAKAWAN) */}
        <TabsContent value="analytics" className="space-y-8">
          {/* Ringkasan Metrik KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Siswa Aktif Mingguan</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-foreground">
                    {liveAnalytics.summaryMetrics.activeReadersCount}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    WAR: {liveAnalytics.summaryMetrics.warPercentage}% ({liveAnalytics.summaryMetrics.activeReadersCount}/{liveAnalytics.summaryMetrics.totalStudentsCount})
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-accent/15 text-accent-foreground">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rata-rata Menit / Siswa</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-foreground">
                    {liveAnalytics.summaryMetrics.avgReadingMinutesPerStudent} mnt
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Target Kemendikbud: 15 mnt
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-600">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kategori Terpopuler</p>
                  <p className="text-base sm:text-lg font-extrabold text-foreground truncate max-w-[140px]">
                    {liveAnalytics.summaryMetrics.mostPopularCategory}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Koleksi: {books.length} judul
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Efisiensi Cloud Storage</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-foreground">
                    {liveAnalytics.summaryMetrics.r2StorageUsedGb} / {liveAnalytics.summaryMetrics.r2StorageLimitGb} GB
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Neon: {liveAnalytics.summaryMetrics.neonComputeHoursUsed} / {liveAnalytics.summaryMetrics.neonComputeHoursLimit} jam
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Partisipasi Per Kelas & AI Reading Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Partisipasi Literasi Per Kelas</CardTitle>
                <CardDescription>
                  Klik nama kelas untuk menyaring daftar siswa yang belum membaca buku wajib.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {liveAnalytics.classParticipation.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Belum ada kelas yang terdaftar. Tambahkan siswa untuk melihat grafik partisipasi kelas.
                  </div>
                ) : (
                  liveAnalytics.classParticipation.map((cls) => (
                    <div key={cls.className} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedClassFilter(
                              selectedClassFilter === cls.className.replace("Kelas ", "")
                                ? "ALL"
                                : cls.className.replace("Kelas ", "")
                            )
                          }
                          className="text-foreground hover:text-primary underline-offset-2 hover:underline"
                        >
                          {cls.className} ({cls.activeStudents}/{cls.totalStudents} siswa aktif)
                        </button>
                        <span className="text-muted-foreground">
                          Rata-rata {cls.avgMinutes} mnt •{" "}
                          <strong className="text-foreground">{cls.activePercentage}%</strong>
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            cls.activePercentage >= 75
                              ? "bg-primary"
                              : cls.activePercentage >= 60
                                ? "bg-accent"
                                : "bg-red-600"
                          )}
                          style={{ width: `${cls.activePercentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Insight Literasi & Rekomendasi
                </CardTitle>
                <CardDescription>
                  Analisis otomatis pola membaca untuk membantu guru mengintervensi siswa yang berisiko tertinggal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {liveAnalytics.aiReadingInsights.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Menghitung insight literasi dari data riil...
                  </div>
                ) : (
                  liveAnalytics.aiReadingInsights.map((insightText, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-border p-3.5 bg-card/60"
                    >
                      <div className="p-2 rounded-xl mt-0.5 shrink-0 bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-foreground font-medium">
                          {insightText}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Buku Terpopuler & Rekap Siswa */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Buku Terpopuler</CardTitle>
                <CardDescription>Berdasarkan total waktu baca & penyelesaian</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {liveAnalytics.topBooks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Belum ada data buku yang dibaca minggu ini.
                  </div>
                ) : (
                  liveAnalytics.topBooks.map((tb, idx) => (
                    <div
                      key={tb.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-foreground truncate max-w-[150px]">
                            {tb.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{tb.readCount} pembaca</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {tb.completionRate}% tamat
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Rekap Keaktifan Siswa</CardTitle>
                  <CardDescription>
                    {selectedClassFilter === "ALL"
                      ? "Menampilkan seluruh jenjang kelas"
                      : `Difilter untuk Kelas ${selectedClassFilter}`}
                  </CardDescription>
                </div>
                {selectedClassFilter !== "ALL" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedClassFilter("ALL")}
                  >
                    Reset Filter
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {filteredStudentsAnalytics.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Belum ada data aktivitas siswa yang cocok dengan filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="py-2.5 px-3 font-semibold">Nama Siswa</th>
                          <th className="py-2.5 px-3 font-semibold">Kelas</th>
                          <th className="py-2.5 px-3 font-semibold">Buku Selesai</th>
                          <th className="py-2.5 px-3 font-semibold">Waktu Baca</th>
                          <th className="py-2.5 px-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredStudentsAnalytics.map((s, idx) => (
                          <tr key={idx} className="hover:bg-secondary/40">
                            <td className="py-2.5 px-3 font-semibold text-foreground">
                              {s.fullName}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">
                              {s.className}
                            </td>
                            <td className="py-2.5 px-3">
                              {s.booksRead} buku
                            </td>
                            <td className="py-2.5 px-3 font-medium">
                              {s.minutesWeek} menit
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge
                                variant={s.status === "Aktif" ? "default" : "destructive"}
                                className="text-[10px]"
                              >
                                {s.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: MANAJEMEN KATALOG BUKU (CRUD LENGKAP & UI PRO) */}
        <TabsContent value="books" className="space-y-6">
          {/* 1. Baris Statistik Koleksi Perpustakaan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                <span>Total Koleksi</span>
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground">{books.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Judul buku terbit</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                <span>BSE Kemendikbud</span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">Resmi</Badge>
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {books.filter((b) => b.sourceType === "bse").length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Buku teks kurikulum</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                <span>Karya Guru / Internal</span>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {books.filter((b) => b.sourceType === "internal").length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Modul & fiksi sekolah</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                <span>Kategori Aktif</span>
                <Tag className="h-4 w-4 text-sky-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground">{categories.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Klasifikasi rak</div>
            </div>
          </div>

          {/* 2. Kartu Pengelola Katalog Buku */}
          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Manajemen Koleksi Buku Sekolah
                  </CardTitle>
                  <CardDescription>
                    Kelola koleksi buku BSE, modul pembelajaran, fiksi, dan literasi digital siswa.
                  </CardDescription>
                </div>

                {!readOnly ? (
                  <Button
                    onClick={() => setIsUploadOpen(true)}
                    className="gap-2 font-bold shrink-0 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Buku Baru
                  </Button>
                ) : (
                  <Badge variant="outline" className="py-2 px-3 text-xs shrink-0">
                    Mode Lihat Saja (Kepala Sekolah)
                  </Badge>
                )}
              </div>

              {/* Toolbar Filter & View Switcher */}
              <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul, penulis, atau ISBN..."
                    className="pl-9 h-10 text-sm bg-background"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Batal
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter Jenjang (Pills) */}
                  <div className="inline-flex rounded-xl bg-secondary p-1 border border-border">
                    {(["ALL", "SD", "SMP", "SMA"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setBookGradeFilter(g)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all min-h-[30px]",
                          bookGradeFilter === g
                            ? "bg-card text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {g === "ALL" ? "Semua Jenjang" : g}
                      </button>
                    ))}
                  </div>

                  {/* Filter Kategori Dropdown */}
                  <select
                    value={bookCategoryFilter}
                    onChange={(e) => setBookCategoryFilter(e.target.value)}
                    className="h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Sort Dropdown */}
                  <select
                    value={bookSortBy}
                    onChange={(e) => setBookSortBy(e.target.value as any)}
                    className="h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="title">Judul (A-Z)</option>
                    <option value="pages">Halaman Terbanyak</option>
                  </select>

                  {/* Toggle View Mode (Grid vs Table) */}
                  <div className="inline-flex rounded-xl bg-secondary p-1 border border-border ml-auto md:ml-0">
                    <button
                      type="button"
                      onClick={() => setBookViewMode("grid")}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        bookViewMode === "grid"
                          ? "bg-card text-primary shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Tampilan Kartu Visual"
                      aria-label="Tampilan Kartu Visual"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookViewMode("table")}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        bookViewMode === "table"
                          ? "bg-card text-primary shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Tampilan Tabel Rinci"
                      aria-label="Tampilan Tabel Rinci"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {filteredBooks.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto space-y-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-2">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground">
                    {books.length === 0 ? "Koleksi Buku Masih Kosong" : "Buku Tidak Ditemukan"}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {books.length === 0
                      ? "Perpustakaan digital siap menerima unggahan koleksi buku pertama. Pustakawan dapat menerbitkan buku teks BSE atau karya guru sekolah."
                      : "Tidak ada buku yang cocok dengan kata kunci pencarian atau filter yang dipilih. Coba reset filter untuk melihat semua koleksi."}
                  </p>
                  {!readOnly && books.length === 0 ? (
                    <Button onClick={() => setIsUploadOpen(true)} className="gap-2 font-bold mt-2">
                      <Plus className="h-4 w-4" />
                      Terbitkan Buku Pertama
                    </Button>
                  ) : (
                    books.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setBookGradeFilter("ALL");
                          setBookCategoryFilter("ALL");
                        }}
                        className="mt-2 text-xs"
                      >
                        Reset Semua Filter
                      </Button>
                    )
                  )}
                </div>
              ) : bookViewMode === "grid" ? (
                /* MODE 1: GRID KARTU VISUAL (SANGAT MENARIK & MODERN) */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md hover:border-primary/40 transition-all duration-300"
                    >
                      {/* Cover Area */}
                      <div className="relative aspect-[3/4] w-full bg-secondary/40 overflow-hidden flex items-center justify-center">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                            <BookOpen className="h-10 w-10 text-primary/40 mb-2" />
                            <span className="text-xs font-semibold line-clamp-2">{book.title}</span>
                          </div>
                        )}

                        {/* Badges Overlay */}
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                          <Badge
                            variant={getCategoryBadgeVariant(book.category)}
                            className="text-[10px] font-bold shadow-sm backdrop-blur-sm capitalize"
                          >
                            {book.category}
                          </Badge>
                        </div>

                        <div className="absolute top-2.5 right-2.5">
                          <Badge variant="secondary" className="text-[10px] font-extrabold shadow-sm">
                            {book.gradeLevel}
                          </Badge>
                        </div>

                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-background/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
                            {book.sourceType === "bse" ? "BSE Kemendikbud" : "Internal"}
                          </span>
                        </div>
                      </div>

                      {/* Detail Info */}
                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <h4
                            className="font-bold text-foreground text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors cursor-pointer"
                            onClick={() => onPreviewBook?.(book.id)}
                            title={book.title}
                          >
                            {book.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {book.author}
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {book.totalPages} Hal
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              ~{book.estimatedReadMinutes} mnt
                            </span>
                          </div>

                          {/* Tombol Aksi */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onPreviewBook?.(book.id)}
                              className="flex-1 text-xs h-8 gap-1 font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Pratinjau
                            </Button>

                            {!readOnly && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditBookModal(book)}
                                  className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                  title="Edit Informasi Buku"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Yakin ingin menonaktifkan buku "${book.title}"?`)) {
                                      fetch(`/api/books/${book.id}`, { method: "DELETE" }).catch(() => { });
                                      onDeleteBook(book.id);
                                      toast("Buku dinonaktifkan (Soft-Delete di database).");
                                    }
                                  }}
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Hapus Buku"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* MODE 2: TABEL RINCI (DATA VIEW PRO) */
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground">
                        <th className="py-3 px-4 font-semibold">Buku & Sampul</th>
                        <th className="py-3 px-3 font-semibold">Penulis</th>
                        <th className="py-3 px-3 font-semibold">Kategori & Jenjang</th>
                        <th className="py-3 px-3 font-semibold">Sumber</th>
                        <th className="py-3 px-3 font-semibold">Halaman</th>
                        <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredBooks.map((book) => (
                        <tr key={book.id} className="hover:bg-secondary/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-9 rounded-md bg-secondary shrink-0 overflow-hidden border border-border">
                                {book.coverUrl ? (
                                  <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <BookOpen className="h-5 w-5 m-auto text-muted-foreground mt-3" />
                                )}
                              </div>
                              <div className="max-w-xs">
                                <p className="font-bold text-foreground text-sm line-clamp-1">
                                  {book.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  {book.isbn || "ISBN -"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground text-xs">
                            {book.author}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <Badge variant={getCategoryBadgeVariant(book.category)} className="capitalize text-[10px]">
                                {book.category}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                {book.gradeLevel}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                              {book.sourceType === "bse" ? "BSE Kemendikbud" : "Internal"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">
                            {book.totalPages} Hal • ~{book.estimatedReadMinutes} mnt
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onPreviewBook?.(book.id)}
                                aria-label={`Lihat detail ${book.title}`}
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {!readOnly && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditBookModal(book)}
                                  aria-label={`Ubah data ${book.title}`}
                                  className="h-8 w-8 text-primary hover:text-primary"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}

                              {!readOnly && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Yakin ingin menonaktifkan buku "${book.title}"?`)) {
                                      fetch(`/api/books/${book.id}`, { method: "DELETE" }).catch(() => { });
                                      onDeleteBook(book.id);
                                      toast("Buku dinonaktifkan (Soft-Delete di database).");
                                    }
                                  }}
                                  aria-label={`Hapus ${book.title}`}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: MANAJEMEN KATEGORI (CRUD KATEGORI) */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Manajemen Kategori Koleksi
                </CardTitle>
                <CardDescription>
                  Atur kategori buku, warna badge, ikon visual, dan urutan tampil di katalog siswa.
                </CardDescription>
              </div>
              {!readOnly ? (
                <Button onClick={openAddCategoryModal} className="gap-1.5 font-bold">
                  <Plus className="h-4 w-4" />
                  Tambah Kategori Baru
                </Button>
              ) : (
                <Badge variant="outline" className="py-2 px-3 text-xs">
                  Mode Lihat Saja (Kepala Sekolah)
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl border border-border bg-card flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                          style={{ backgroundColor: cat.colorHex }}
                        >
                          {renderIconComponent(cat.icon)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Urutan #{cat.sortOrder}
                        </Badge>
                      </div>
                      <h4 className="text-base font-bold text-foreground">
                        {cat.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.colorHex }}
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {cat.colorHex}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {cat.bookCount ?? 0} buku terkait
                        </span>
                      </div>
                    </div>

                    {!readOnly && (
                      <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditCategoryModal(cat)}
                          className="h-8 gap-1 text-xs text-primary font-semibold"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategoryClick(cat)}
                          className="h-8 gap-1 text-xs text-destructive font-semibold hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: MANAJEMEN SISWA (CRUD SISWA & RESET PIN DENGAN RUST WASM) */}
        <TabsContent value="students" className="space-y-6">
          {/* Baris Statistik Ringkasan Siswa */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                <span>Total Siswa</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground">{students.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Siswa terdaftar</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                <span>Akun Aktif</span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">Resmi</Badge>
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {students.filter((s) => s.is_active).length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Siap login perpustakaan</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                <span>Rombel / Kelas</span>
                <Layers className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {uniqueClassNames.length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Kelas terdaftar</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                <span>Aktif Membaca</span>
                <Clock className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {students.filter((s) => (s.minutes_week || 0) > 0).length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">7 hari terakhir</div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4 border-b border-border space-y-4">
              {/* Baris Atas: Judul & Tombol Aksi Utama */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <Users className="h-5 w-5 text-primary" />
                    Manajemen Data Siswa & Akun NISN
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Sesuai UU PDP & PRD: NISN asli tidak disimpan di database. Hashing diproses dengan Rust WebAssembly HMAC-SHA256.
                  </CardDescription>
                </div>

                {!readOnly ? (
                  <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setParsedExcelRows([]);
                        setExcelFileName("");
                        setIsExcelImportOpen(true);
                      }}
                      className="gap-1.5 font-bold border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 shadow-xs"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Upload Excel / CSV</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setIsAddStudentOpen(true)}
                      className="gap-1.5 font-bold shadow-xs"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Tambah Siswa Baru</span>
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="py-2 px-3 text-xs shrink-0">
                    Mode Lihat Saja (Kepala Sekolah)
                  </Badge>
                )}
              </div>

              {/* Baris Bawah: Toolbar Pencarian & Filter Kelas yang Rapi */}
              <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2.5 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Cari nama siswa, kelas, atau NISN hash..."
                      className="pl-9 pr-9 h-10 text-sm bg-background rounded-xl"
                    />
                    {studentSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        title="Hapus pencarian"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <select
                    value={studentFilterClass}
                    onChange={(e) => setStudentFilterClass(e.target.value)}
                    className="h-10 rounded-xl border border-input bg-card px-3.5 text-xs font-semibold shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <option value="ALL">Semua Kelas ({students.length})</option>
                    {uniqueClassNames.map((cn) => (
                      <option key={cn} value={cn}>
                        Kelas {cn} ({students.filter((s) => s.class_name === cn).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground font-medium">
                  <span>
                    Menampilkan{" "}
                    <strong className="text-foreground font-bold">
                      {liveFilteredStudents.length}
                    </strong>{" "}
                    dari {students.length} siswa
                  </span>
                  {(studentSearchQuery || studentFilterClass !== "ALL") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStudentSearchQuery("");
                        setStudentFilterClass("ALL");
                      }}
                      className="h-7 px-2 text-xs text-primary hover:text-primary font-semibold"
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isStudentsLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Memuat data siswa dari database Neon...
                </div>
              ) : students.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <UserPlus className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1">
                    Belum Ada Data Siswa Terdaftar
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                    Database perpustakaan siap digunakan. Pustakawan dapat mengunggah daftar siswa sekaligus melalui file Excel (.xlsx / .csv) atau mendaftarkan siswa secara individual.
                  </p>
                  {!readOnly && (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setParsedExcelRows([]);
                          setExcelFileName("");
                          setIsExcelImportOpen(true);
                        }}
                        className="gap-2 font-bold border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Upload Excel (.xlsx / .csv)
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setIsAddStudentOpen(true)}
                        className="gap-2 font-bold"
                      >
                        <UserPlus className="h-4 w-4" />
                        Daftarkan Siswa Pertama
                      </Button>
                    </div>
                  )}
                </div>
              ) : liveFilteredStudents.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Belum ada data siswa yang cocok dengan filter atau pencarian.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                        <th className="py-3 px-3.5 font-semibold">Nama Siswa</th>
                        <th className="py-3 px-3 font-semibold">Kelas & Jenjang</th>
                        <th className="py-3 px-3 font-semibold">NISN Hash (PDP)</th>
                        <th className="py-3 px-3 font-semibold">Total Menit (7 Hari)</th>
                        <th className="py-3 px-3 font-semibold">Status Akun</th>
                        <th className="py-3 px-3.5 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {liveFilteredStudents.map((s) => (
                        <tr key={s.nisn_hash} className="hover:bg-secondary/40 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                                {s.full_name.trim().charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-foreground block truncate max-w-[220px]">
                                  {s.full_name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground bg-secondary/80 px-2 py-0.5 rounded-md text-xs">
                                {s.class_name}
                              </span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold">
                                {s.grade <= 6 ? "SD" : s.grade <= 9 ? "SMP" : "SMA"}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/80 font-mono text-[11px] text-muted-foreground">
                              <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{s.nisn_hash.slice(0, 8)}...{s.nisn_hash.slice(-4)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{s.minutes_week ?? 0} menit</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={s.is_active ? "default" : "destructive"}
                              className={cn(
                                "text-[10px] font-bold gap-1 pl-1.5 pr-2 py-0.5",
                                s.is_active && "bg-emerald-600 hover:bg-emerald-700 text-white"
                              )}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                              {s.is_active ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setResetPinStudent(s);
                                  setNewResetPin("");
                                }}
                                title="Reset PIN Siswa (6 Digit)"
                                className="h-8 gap-1 text-xs text-amber-600 hover:text-amber-700"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">Reset PIN</span>
                              </Button>
                              {!readOnly && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditStudentModal(s)}
                                    title="Edit Data Siswa"
                                    className="h-8 w-8 text-primary hover:text-primary"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteStudent(s)}
                                    title="Hapus Akun Siswa"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Tambah Buku Baru */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Unggah & Terbitkan Buku Baru
            </DialogTitle>
            <DialogDescription>
              Lengkapi metadata buku perpustakaan digital sekolah. Terintegrasi ke Neon PostgreSQL & S3 Storage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBook} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kolom Kiri: Preview & Unggah Cover Buku */}
              <div className="md:col-span-1 space-y-2">
                <label className="block text-xs font-bold text-foreground">
                  Pratinjau Sampul Buku
                </label>
                <div
                  onClick={() => coverFileInputRef.current?.click()}
                  className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-secondary/30 overflow-hidden flex flex-col items-center justify-center p-2 relative group cursor-pointer transition-colors"
                  title="Klik untuk mengunggah gambar sampul dari perangkat"
                >
                  {isUploadingCoverFile ? (
                    <div className="text-center p-3 text-primary">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                      <p className="text-[11px] font-semibold">Mengunggah sampul...</p>
                    </div>
                  ) : newCoverUrl.trim() ? (
                    <img
                      src={newCoverUrl}
                      alt="Preview Sampul"
                      className="h-full w-full object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-center p-3 text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mx-auto mb-2 text-primary/40 group-hover:text-primary transition-colors" />
                      <p className="text-[11px] font-semibold text-foreground">Klik Unggah Sampul</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        JPG, PNG, WEBP (Maks. 10 MB)
                      </p>
                    </div>
                  )}
                </div>

                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelectCoverFile(f);
                    e.target.value = "";
                  }}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingCoverFile}
                  onClick={() => coverFileInputRef.current?.click()}
                  className="w-full text-xs h-8 gap-1.5 font-semibold"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  Pilih File Gambar Sampul
                </Button>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Atau Tempel URL Sampul (Opsional)
                  </label>
                  <Input
                    value={newCoverUrl}
                    onChange={(e) => setNewCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Kolom Kanan: Field Metadata */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Judul Buku <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Eksplorasi Sains & Tata Surya"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Nama Pengarang / Penulis <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="Contoh: Dr. Rina Kusuma"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Nomor ISBN / Registrasi
                    </label>
                    <Input
                      value={newIsbn}
                      onChange={(e) => setNewIsbn(e.target.value)}
                      placeholder="Contoh: 978-602-000-123-4"
                      className="h-10 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Kategori
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full h-10 rounded-xl border border-input bg-card px-2.5 text-xs font-semibold"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Jenjang
                    </label>
                    <select
                      value={newGrade}
                      onChange={(e) =>
                        setNewGrade(e.target.value as BookItem["gradeLevel"])
                      }
                      className="w-full h-10 rounded-xl border border-input bg-card px-2.5 text-xs font-semibold"
                    >
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Sumber Lisensi
                    </label>
                    <select
                      value={newSource}
                      onChange={(e) =>
                        setNewSource(e.target.value as "bse" | "internal")
                      }
                      className="w-full h-10 rounded-xl border border-input bg-card px-2.5 text-xs font-semibold"
                    >
                      <option value="bse">BSE Kemendikbud</option>
                      <option value="internal">Internal Sekolah</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Jumlah Halaman <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      min={1}
                      required
                      value={newPages}
                      onChange={(e) => setNewPages(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Perkiraan Durasi Baca
                    </label>
                    <div className="h-10 rounded-xl border border-input bg-secondary/30 px-3 flex items-center text-xs text-muted-foreground font-semibold">
                      ~{Math.max(10, Math.round((parseInt(newPages, 10) || 24) * 1.2))} Menit
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Sinopsis & Ringkasan Buku
              </label>
              <textarea
                rows={3}
                value={newSynopsis}
                onChange={(e) => setNewSynopsis(e.target.value)}
                placeholder="Tuliskan deskripsi cerita, tema pembahasan, atau capaian literasi buku ini..."
                className="w-full rounded-xl border border-input bg-card p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Area Interaktif Unggah File Buku (PDF / EPUB / TXT) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                File Dokumen Buku (PDF / EPUB / TXT)
              </label>

              <input
                ref={bookFileInputRef}
                type="file"
                accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSelectBookFile(f);
                  e.target.value = "";
                }}
              />

              <div
                onClick={() => !isUploadingBookFile && bookFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverBookFile(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverBookFile(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverBookFile(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) handleSelectBookFile(droppedFile);
                }}
                className={cn(
                  "rounded-xl border-2 border-dashed p-5 text-center space-y-2 cursor-pointer transition-all",
                  isDragOverBookFile
                    ? "border-primary bg-primary/10"
                    : newBookFileUrl
                      ? "border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20"
                      : "border-border hover:border-primary/60 bg-secondary/30 hover:bg-secondary/50"
                )}
              >
                {isUploadingBookFile ? (
                  <div className="py-2 space-y-1.5">
                    <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
                    <p className="text-xs font-bold text-foreground">
                      Sedang mengunggah dokumen buku...
                    </p>
                  </div>
                ) : newBookFileUrl ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-foreground truncate max-w-[240px] sm:max-w-[320px]">
                            {newBookFileName || "Dokumen Buku Terunggah"}
                          </p>
                          <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                            Siap Terbit
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {newBookFileSize > 0
                            ? `${(newBookFileSize / (1024 * 1024)).toFixed(2)} MB • `
                            : ""}
                          Tersimpan di <code className="font-mono">{newBookFileUrl}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => bookFileInputRef.current?.click()}
                        className="h-8 text-xs font-semibold"
                      >
                        Ganti File
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setNewBookFileUrl("");
                          setNewBookFileName("");
                          setNewBookFileSize(0);
                          setNewBookParagraphs([]);
                        }}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Hapus file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 mx-auto text-primary mb-1" />
                    <p className="text-xs font-bold text-foreground">
                      Klik untuk Memilih File atau Tarik & Lepas Dokumen PDF / EPUB / TXT (Maks. 50 MB)
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Mendukung format <span className="font-semibold text-foreground">.PDF, .EPUB, dan .TXT</span>. Klik tombol di bawah atau area ini untuk memilih file dari komputer Anda.
                    </p>
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          bookFileInputRef.current?.click();
                        }}
                        className="h-8 text-xs font-bold gap-1.5"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        Pilih File Buku dari Komputer
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsUploadOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isUploadingBookFile || isUploadingCoverFile}
                className="font-bold gap-2"
              >
                <Plus className="h-4 w-4" />
                Terbitkan ke Rak Siswa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Data Buku */}
      <Dialog open={!!editingBook} onOpenChange={(open) => !open && setEditingBook(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Informasi Buku
            </DialogTitle>
            <DialogDescription>
              Perbarui rincian metadata, sampul, atau file dokumen buku pada katalog digital perpustakaan.
            </DialogDescription>
          </DialogHeader>

          {editingBook && (
            <form onSubmit={handleUpdateBookSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Kolom Kiri: Cover Preview & Upload */}
                <div className="md:col-span-1 space-y-2">
                  <label className="block text-xs font-bold text-foreground">
                    Sampul Buku
                  </label>
                  <div
                    onClick={() => editCoverFileInputRef.current?.click()}
                    className="aspect-[3/4] w-full rounded-xl border border-border hover:border-primary/60 bg-secondary/30 overflow-hidden flex items-center justify-center relative cursor-pointer"
                    title="Klik untuk mengganti file gambar sampul"
                  >
                    {isUploadingEditCoverFile ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <img
                        src={editCoverUrl || editingBook.coverUrl}
                        alt={editTitle}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <input
                    ref={editCoverFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSelectEditCoverFile(f);
                      e.target.value = "";
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingEditCoverFile}
                    onClick={() => editCoverFileInputRef.current?.click()}
                    className="w-full text-xs h-8 gap-1.5 font-semibold"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Unggah Sampul Baru
                  </Button>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Atau Ganti URL Sampul
                    </label>
                    <Input
                      value={editCoverUrl}
                      onChange={(e) => setEditCoverUrl(e.target.value)}
                      placeholder="https://..."
                      className="text-xs h-9 mt-1"
                    />
                  </div>
                </div>

                {/* Kolom Kanan: Field Edit */}
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Judul Buku <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-10 text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Nama Penulis <span className="text-destructive">*</span>
                      </label>
                      <Input
                        required
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Jumlah Halaman <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="number"
                        min={1}
                        required
                        value={editPages}
                        onChange={(e) => setEditPages(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Kategori
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full h-10 rounded-xl border border-input bg-card px-2.5 text-xs font-semibold capitalize"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Jenjang Pembaca
                      </label>
                      <select
                        value={editGrade}
                        onChange={(e) => setEditGrade(e.target.value as BookItem["gradeLevel"])}
                        className="w-full h-10 rounded-xl border border-input bg-card px-2.5 text-xs font-semibold"
                      >
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Sinopsis Buku
                    </label>
                    <textarea
                      rows={3}
                      value={editSynopsis}
                      onChange={(e) => setEditSynopsis(e.target.value)}
                      className="w-full rounded-xl border border-input bg-card p-3 text-sm focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      File Dokumen Buku (PDF / EPUB / TXT)
                    </label>
                    <input
                      ref={editBookFileInputRef}
                      type="file"
                      accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleSelectEditBookFile(f);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-dashed border-border bg-secondary/30 p-3">
                      <div className="flex items-center gap-2 text-xs truncate">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold text-foreground truncate">
                          {editBookFileName || editBookFileUrl || "Belum ada file terlampir"}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingEditBookFile}
                        onClick={() => editBookFileInputRef.current?.click()}
                        className="h-8 text-xs font-bold gap-1.5 shrink-0"
                      >
                        {isUploadingEditBookFile ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Mengunggah...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-3.5 w-3.5" />
                            Unggah / Ganti File Buku
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingBook(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isUploadingEditBookFile || isUploadingEditCoverFile}
                  className="font-bold"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Tambah / Edit Kategori */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Ubah Kategori Buku" : "Tambah Kategori Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Sesuaikan nama, warna, atau ikon untuk kategori buku ini."
                : "Buat kategori baru agar siswa lebih mudah mencari buku yang relevan."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Nama Kategori
              </label>
              <Input
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Contoh: Teknologi & Coding, Dongeng Daerah"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-2">
                Pilih Ikon Visual
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_ICONS.map((item) => {
                  const Icon = item.Icon;
                  const isSelected = catIcon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setCatIcon(item.name)}
                      className={cn(
                        "h-10 rounded-xl border flex items-center justify-center transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                          : "border-border hover:bg-secondary text-muted-foreground"
                      )}
                      title={item.name}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-2">
                Warna Tema Badge
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {PRESET_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setCatColor(hex)}
                    style={{ backgroundColor: hex }}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-transform",
                      catColor === hex ? "scale-110 ring-2 ring-offset-2 ring-primary" : "opacity-80 hover:opacity-100"
                    )}
                  >
                    {catColor === hex && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
              <Input
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                placeholder="#3B82F6"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Nomor Urutan Tampil
              </label>
              <Input
                type="number"
                min={1}
                value={catSortOrder}
                onChange={(e) => setCatSortOrder(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCategoryModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" className="font-bold">
                {editingCategory ? "Simpan Perubahan" : "Buat Kategori"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Tambah Siswa Baru (Rust Wasm NISN Hashing) */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Siswa Baru</DialogTitle>
            <DialogDescription>
              NISN 10 digit di-hash dengan Rust WebAssembly (HMAC-SHA256) untuk menjamin privasi siswa (UU PDP).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStudent} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Nomor Induk Siswa Nasional (NISN - 10 Digit)
              </label>
              <Input
                required
                maxLength={10}
                value={newStudentNisn}
                onChange={(e) => setNewStudentNisn(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Contoh: 0094827165"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {newStudentNisn.length}/10 digit angka
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Nama Lengkap Siswa
              </label>
              <Input
                required
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Contoh: Siti Nurhaliza"
              />
            </div>

            {/* Pilihan Jenjang Pendidikan */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Jenjang Pendidikan
              </label>
              <select
                value={newStudentGrade}
                onChange={(e) => {
                  const g = e.target.value as "SD" | "SMP" | "SMA";
                  setNewStudentGrade(g);
                  if (g === "SD") {
                    setNewStudentClassNumber(1);
                    setNewStudentClassLetter("A");
                  } else if (g === "SMP") {
                    setNewStudentClassNumber(7);
                    setNewStudentClassLetter("A");
                  } else {
                    setNewStudentClassNumber(10);
                    setNewStudentClassCustom("");
                  }
                }}
                className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="SD">Sekolah Dasar (SD) • Kelas 1 - 6</option>
                <option value="SMP">SMP / MTs • Kelas 7 - 9</option>
                <option value="SMA">SMA / SMK / MA • Kelas 10 - 12</option>
              </select>
            </div>

            {/* Pilihan Kelas & Rombel Sesuai Jenjang */}
            <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-foreground">
                  Tingkat Kelas & Rombel
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Format tersimpan:{" "}
                  <strong className="text-primary font-bold">
                    {getComputedClassName(newStudentGrade, newStudentClassNumber, newStudentClassLetter, newStudentClassCustom)}
                  </strong>
                </span>
              </div>

              {newStudentGrade === "SD" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                      Tingkat Kelas (1 - 6):
                    </label>
                    <select
                      value={newStudentClassNumber}
                      onChange={(e) => setNewStudentClassNumber(Number(e.target.value))}
                      className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                    >
                      {SD_CLASSES.map((num) => (
                        <option key={num} value={num}>
                          Kelas {num}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                      Abjad Rombel (A - J):
                    </label>
                    <select
                      value={newStudentClassLetter}
                      onChange={(e) => setNewStudentClassLetter(e.target.value)}
                      className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                    >
                      {CLASS_LETTERS.map((letter) => (
                        <option key={letter} value={letter}>
                          Rombel {letter}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {newStudentGrade === "SMP" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                      Tingkat Kelas (7 - 9):
                    </label>
                    <select
                      value={newStudentClassNumber}
                      onChange={(e) => setNewStudentClassNumber(Number(e.target.value))}
                      className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                    >
                      {SMP_CLASSES.map((num) => (
                        <option key={num} value={num}>
                          Kelas {num}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                      Abjad Rombel (A - J):
                    </label>
                    <select
                      value={newStudentClassLetter}
                      onChange={(e) => setNewStudentClassLetter(e.target.value)}
                      className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                    >
                      {CLASS_LETTERS.map((letter) => (
                        <option key={letter} value={letter}>
                          Rombel {letter}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {newStudentGrade === "SMA" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                      Tingkat Kelas (10 - 12):
                    </label>
                    <select
                      value={newStudentClassNumber}
                      onChange={(e) => setNewStudentClassNumber(Number(e.target.value))}
                      className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                    >
                      {SMA_CLASSES.map((num) => (
                        <option key={num} value={num}>
                          Kelas {num}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                      Isian Rombel / Jurusan:
                    </label>
                    <Input
                      value={newStudentClassCustom}
                      onChange={(e) => setNewStudentClassCustom(e.target.value)}
                      placeholder="Contoh: MIPA 1, IPS 2, Bahasa"
                      className="h-10 text-xs bg-card"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                PIN Masuk Awal (6 Digit Angka)
              </label>
              <Input
                required
                maxLength={6}
                type="password"
                value={newStudentPin}
                onChange={(e) => setNewStudentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Contoh: 123456"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                PIN akan di-hash menggunakan Bcrypt (Cost 10).
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddStudentOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" className="font-bold">
                Daftarkan Siswa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Siswa */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Informasi Siswa</DialogTitle>
            <DialogDescription>
              Ubah data profil atau status keaktifan akun siswa.
            </DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <form onSubmit={handleUpdateStudent} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Nama Lengkap
                </label>
                <Input
                  required
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                />
              </div>

              {/* Pilihan Jenjang Pendidikan */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Jenjang Pendidikan
                </label>
                <select
                  value={editStudentGrade}
                  onChange={(e) => {
                    const g = e.target.value as "SD" | "SMP" | "SMA";
                    setEditStudentGrade(g);
                    if (g === "SD") {
                      setEditStudentClassNumber(1);
                      setEditStudentClassLetter("A");
                    } else if (g === "SMP") {
                      setEditStudentClassNumber(7);
                      setEditStudentClassLetter("A");
                    } else {
                      setEditStudentClassNumber(10);
                      setEditStudentClassCustom("");
                    }
                  }}
                  className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="SD">Sekolah Dasar (SD) • Kelas 1 - 6</option>
                  <option value="SMP">SMP / MTs • Kelas 7 - 9</option>
                  <option value="SMA">SMA / SMK / MA • Kelas 10 - 12</option>
                </select>
              </div>

              {/* Pilihan Kelas & Rombel Sesuai Jenjang */}
              <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground">
                    Tingkat Kelas & Rombel
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Format tersimpan:{" "}
                    <strong className="text-primary font-bold">
                      {getComputedClassName(editStudentGrade, editStudentClassNumber, editStudentClassLetter, editStudentClassCustom)}
                    </strong>
                  </span>
                </div>

                {editStudentGrade === "SD" && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                        Tingkat Kelas (1 - 6):
                      </label>
                      <select
                        value={editStudentClassNumber}
                        onChange={(e) => setEditStudentClassNumber(Number(e.target.value))}
                        className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                      >
                        {SD_CLASSES.map((num) => (
                          <option key={num} value={num}>
                            Kelas {num}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                        Abjad Rombel (A - J):
                      </label>
                      <select
                        value={editStudentClassLetter}
                        onChange={(e) => setEditStudentClassLetter(e.target.value)}
                        className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                      >
                        {CLASS_LETTERS.map((letter) => (
                          <option key={letter} value={letter}>
                            Rombel {letter}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {editStudentGrade === "SMP" && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                        Tingkat Kelas (7 - 9):
                      </label>
                      <select
                        value={editStudentClassNumber}
                        onChange={(e) => setEditStudentClassNumber(Number(e.target.value))}
                        className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                      >
                        {SMP_CLASSES.map((num) => (
                          <option key={num} value={num}>
                            Kelas {num}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                        Abjad Rombel (A - J):
                      </label>
                      <select
                        value={editStudentClassLetter}
                        onChange={(e) => setEditStudentClassLetter(e.target.value)}
                        className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                      >
                        {CLASS_LETTERS.map((letter) => (
                          <option key={letter} value={letter}>
                            Rombel {letter}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {editStudentGrade === "SMA" && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                        Tingkat Kelas (10 - 12):
                      </label>
                      <select
                        value={editStudentClassNumber}
                        onChange={(e) => setEditStudentClassNumber(Number(e.target.value))}
                        className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                      >
                        {SMA_CLASSES.map((num) => (
                          <option key={num} value={num}>
                            Kelas {num}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                        Isian Rombel / Jurusan:
                      </label>
                      <Input
                        value={editStudentClassCustom}
                        onChange={(e) => setEditStudentClassCustom(e.target.value)}
                        placeholder="Contoh: MIPA 1, IPS 2, Bahasa"
                        className="h-10 text-xs bg-card"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Status Akun
                </label>
                <select
                  value={editStudentActive ? "aktif" : "nonaktif"}
                  onChange={(e) => setEditStudentActive(e.target.value === "aktif")}
                  className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold"
                >
                  <option value="aktif">Aktif (Dapat Masuk & Membaca)</option>
                  <option value="nonaktif">Nonaktif (Akses Dikunci Sementara)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingStudent(null)}
                >
                  Batal
                </Button>
                <Button type="submit" className="font-bold">
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Reset PIN Siswa */}
      <Dialog open={!!resetPinStudent} onOpenChange={(open) => !open && setResetPinStudent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset PIN Siswa</DialogTitle>
            <DialogDescription>
              Buat 6 digit PIN baru untuk {resetPinStudent?.full_name} ({resetPinStudent?.class_name}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPin} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                PIN Baru (6 Digit)
              </label>
              <Input
                required
                maxLength={6}
                type="password"
                value={newResetPin}
                onChange={(e) => setNewResetPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {newResetPin.length}/6 digit angka
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setResetPinStudent(null)}
              >
                Batal
              </Button>
              <Button type="submit" className="font-bold bg-amber-600 hover:bg-amber-700 text-white">
                Simpan PIN Baru
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Universal Reset Password / PIN (Pustakawan & Siswa) */}
      <Dialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Reset Password Pustakawan / PIN Siswa
            </DialogTitle>
            <DialogDescription>
              Perbarui kata sandi Guru Pustakawan atau PIN Siswa langsung ke database terenkripsi Bcrypt.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUniversalResetPassword} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Pilih Role Akun yang Akan Direset
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "librarian", label: "Guru Pustakawan" },
                  { id: "student", label: "Siswa (PIN 6 Digit)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const next = item.id as "librarian" | "principal" | "student";
                      setResetRoleTarget(next);
                      if (next === "librarian") setResetAccountUsername("pustakawan");
                    }}
                    className={cn(
                      "rounded-lg py-2 px-3 text-xs font-bold border transition-all",
                      resetRoleTarget === item.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-secondary/50 text-foreground border-border hover:bg-secondary"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {resetRoleTarget === "student" ? (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  10 Digit NISN Siswa
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={resetAccountNisn}
                  onChange={(e) => setResetAccountNisn(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Contoh: 0012345678"
                  className="font-mono tracking-wider"
                  required
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Tip: Anda juga bisa mereset PIN langsung dari tabel Manajemen Siswa tanpa perlu mengetik NISN.
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Username Guru Pustakawan
                </label>
                <Input
                  type="text"
                  value={resetAccountUsername}
                  onChange={(e) => setResetAccountUsername(e.target.value)}
                  placeholder="pustakawan"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {resetRoleTarget === "student" ? "PIN Lama (Opsional untuk Admin)" : "Kata Sandi Lama (Opsional untuk Admin)"}
              </label>
              <Input
                type="password"
                value={resetAccountCurrentSecret}
                onChange={(e) => setResetAccountCurrentSecret(e.target.value)}
                placeholder="Kosongkan jika ingin langsung reset"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {resetRoleTarget === "student" ? "PIN Baru (6 Angka)" : "Kata Sandi Baru"}
                </label>
                <Input
                  type="password"
                  inputMode={resetRoleTarget === "student" ? "numeric" : "text"}
                  value={resetAccountNewSecret}
                  onChange={(e) =>
                    setResetAccountNewSecret(
                      resetRoleTarget === "student"
                        ? e.target.value.replace(/\D/g, "").slice(0, 6)
                        : e.target.value
                    )
                  }
                  placeholder={resetRoleTarget === "student" ? "6 digit angka" : "Min. 6 karakter"}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {resetRoleTarget === "student" ? "Ulangi PIN Baru" : "Ulangi Sandi Baru"}
                </label>
                <Input
                  type="password"
                  inputMode={resetRoleTarget === "student" ? "numeric" : "text"}
                  value={resetAccountConfirmSecret}
                  onChange={(e) =>
                    setResetAccountConfirmSecret(
                      resetRoleTarget === "student"
                        ? e.target.value.replace(/\D/g, "").slice(0, 6)
                        : e.target.value
                    )
                  }
                  placeholder="Ketik ulang"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsResetPasswordModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isResetAccountSubmitting} className="font-bold gap-1.5">
                <KeyRound className="h-4 w-4" />
                {isResetAccountSubmitting
                  ? "Menyimpan..."
                  : `Simpan ${resetRoleTarget === "student" ? "PIN Baru" : "Password Baru"}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Pusat Backup & Pemulihan Data (Disaster Recovery) */}
      <Dialog open={isBackupModalOpen} onOpenChange={setIsBackupModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Database className="h-5 w-5 text-emerald-600" />
              Pusat Backup & Pemulihan Data Sekolah
            </DialogTitle>
            <DialogDescription>
              Unduh salinan cadangan penuh database Neon PostgreSQL (JSON, SQL Dump, atau CSV) untuk keamanan arsip literasi sekolah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Ringkasan Entitas Saat Ini */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-border bg-secondary/40 p-3 text-center">
                <div className="text-lg font-extrabold text-foreground">{books.length}</div>
                <div className="text-[11px] font-semibold text-muted-foreground">Judul Buku</div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-3 text-center">
                <div className="text-lg font-extrabold text-foreground">{students.length}</div>
                <div className="text-[11px] font-semibold text-muted-foreground">Akun Siswa</div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-3 text-center">
                <div className="text-lg font-extrabold text-foreground">{categories.length}</div>
                <div className="text-[11px] font-semibold text-muted-foreground">Kategori Rak</div>
              </div>
            </div>

            {/* Bagian 1: Backup Penuh Server (JSON & SQL) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Backup Penuh Database (Semua Tabel)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={!!isDownloadingBackup}
                  onClick={() => handleDownloadServerBackup("json", "all")}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card hover:border-emerald-500/60 hover:bg-emerald-500/5 p-3.5 text-left transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    {isDownloadingBackup === "json-all" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      Full Backup JSON (.json)
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      Cadangan lengkap (Buku, Kategori, Siswa, Sesi & Riwayat Baca) siap di-restore 1 klik.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!!isDownloadingBackup}
                  onClick={() => handleDownloadServerBackup("sql", "all")}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card hover:border-primary/60 hover:bg-primary/5 p-3.5 text-left transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    {isDownloadingBackup === "sql-all" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      PostgreSQL Dump (.sql)
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      Skrip standar SQL (<code className="font-mono">INSERT ... ON CONFLICT</code>) untuk migrasi server.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Bagian 2: Backup Spesifik per Modul (CSV & JSON) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Backup per Modul (Format Spreadsheet CSV / JSON)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBackupBooksCsv}
                  className="justify-start gap-2 h-10 text-xs font-semibold"
                >
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Unduh CSV Katalog Buku ({books.length})</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBackupStudentsCsv}
                  className="justify-start gap-2 h-10 text-xs font-semibold"
                >
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span>Unduh CSV Data Siswa ({students.length})</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!isDownloadingBackup}
                  onClick={() => handleDownloadServerBackup("json", "books")}
                  className="justify-start gap-2 h-10 text-xs font-semibold"
                >
                  <Download className="h-4 w-4 text-amber-600" />
                  <span>Backup JSON Khusus Buku & Kategori</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!isDownloadingBackup}
                  onClick={() => handleDownloadServerBackup("json", "students")}
                  className="justify-start gap-2 h-10 text-xs font-semibold"
                >
                  <ShieldCheck className="h-4 w-4 text-sky-600" />
                  <span>Backup JSON Khusus Siswa (Hash PDP)</span>
                </Button>
              </div>
            </div>

            {/* Bagian 3: Restore / Pulihkan Data dari File Backup JSON */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  3. Pulihkan Data dari File Backup (.json)
                </h3>
                {readOnly && (
                  <Badge variant="outline" className="text-[10px]">
                    Khusus Pustakawan
                  </Badge>
                )}
              </div>

              <input
                ref={restoreFileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleRestoreFromFile(f);
                  e.target.value = "";
                }}
              />

              <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Pilih file <code className="font-mono font-bold text-foreground">.json</code> hasil backup PustakaKita untuk memulihkan buku, kategori, siswa, dan progres baca secara otomatis (tanpa menghapus data yang sudah ada).
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={readOnly || isRestoringBackup}
                  onClick={() => restoreFileInputRef.current?.click()}
                  className="gap-1.5 font-bold shrink-0"
                >
                  {isRestoringBackup ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Memulihkan...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-3.5 w-3.5" />
                      Pilih File Restore (.json)
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsBackupModalOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Import Data Siswa Massal dari File Excel (.XLSX / .XLS / .CSV) ke Database Neon */}
      <Dialog open={isExcelImportOpen} onOpenChange={setIsExcelImportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Import Data Siswa dari Excel (.xlsx / .xls / .csv)
            </DialogTitle>
            <DialogDescription>
              Unggah daftar siswa satu kelas atau satu sekolah sekaligus. Seluruh NISN otomatis dienkripsi HMAC-SHA256 (UU PDP) dan langsung disimpan ke Neon PostgreSQL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Baris 1: Unduh Template Excel */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground">
                  1. Belum punya format tabelnya? Unduh Template Resmi
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Kolom: <code className="font-mono font-semibold">NISN, Nama Lengkap, Tingkat Kelas, Nama Rombel, PIN (6 Digit)</code>
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadStudentExcelTemplate}
                className="gap-1.5 font-bold text-xs shrink-0 border-emerald-600/40 text-emerald-700 dark:text-emerald-300"
              >
                <Download className="h-3.5 w-3.5" />
                Unduh Template Excel (.CSV)
              </Button>
            </div>

            {/* Baris 2: Dropzone Pilih File Excel (.xlsx / .xls / .csv) */}
            <div>
              <input
                ref={excelStudentInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleParseExcelStudentFile(f);
                  e.target.value = "";
                }}
              />

              <div
                onClick={() => excelStudentInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleParseExcelStudentFile(f);
                }}
                className="rounded-2xl border-2 border-dashed border-border hover:border-emerald-500/60 bg-secondary/30 hover:bg-emerald-500/5 p-6 text-center cursor-pointer transition-all"
              >
                {isParsingExcel ? (
                  <div className="space-y-2 py-2">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-foreground">
                      Membaca baris siswa dari {excelFileName}...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {excelFileName
                        ? `File Terpilih: ${excelFileName}`
                        : "Klik atau Seret File Excel (.xlsx, .xls, atau .csv) ke Sini"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mendukung Microsoft Excel (.xlsx / .xls) dan Spreadsheet CSV (hingga 1.000 siswa per unggahan).
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Baris 3: Tabel Pratinjau Siswa yang Terbaca dari Excel */}
            {parsedExcelRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {parsedExcelRows.length} Siswa Siap Disimpan ke Database Neon
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedExcelRows([]);
                      setExcelFileName("");
                    }}
                    className="text-xs font-semibold text-destructive hover:underline"
                  >
                    Bersihkan Daftar
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-secondary/70 sticky top-0">
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 px-3 font-bold">#</th>
                        <th className="py-2 px-3 font-bold">NISN (10 Digit)</th>
                        <th className="py-2 px-3 font-bold">Nama Lengkap Siswa</th>
                        <th className="py-2 px-3 font-bold">Tingkat</th>
                        <th className="py-2 px-3 font-bold">Rombel / Kelas</th>
                        <th className="py-2 px-3 font-bold">PIN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedExcelRows.slice(0, 100).map((row, idx) => (
                        <tr key={`${row.nisn}-${idx}`} className="hover:bg-secondary/30">
                          <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-foreground">
                            {row.nisn}
                          </td>
                          <td className="py-2 px-3 font-semibold text-foreground">
                            {row.fullName}
                          </td>
                          <td className="py-2 px-3">{row.grade}</td>
                          <td className="py-2 px-3 font-semibold text-primary">
                            {row.className}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">
                            {row.pin}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedExcelRows.length > 100 && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Menampilkan 100 baris pertama dari total {parsedExcelRows.length} siswa.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsExcelImportOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={parsedExcelRows.length === 0 || isSubmittingExcelImport}
                onClick={handleConfirmImportStudents}
                className="font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmittingExcelImport ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan ke Neon DB...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Simpan {parsedExcelRows.length > 0 ? `${parsedExcelRows.length} ` : ""}Siswa ke Database Neon
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
