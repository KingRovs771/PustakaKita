import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return Number.isFinite(val) ? String(val) : "0";
  if (val instanceof Date) return `'${val.toISOString()}'`;
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

// GET /api/admin/backup?format=json|sql&scope=all|books|students
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "json").toLowerCase();
    const scope = (searchParams.get("scope") || "all").toLowerCase();

    const [
      categories,
      books,
      students,
      readingSessions,
      dailyStats,
      readingHistory,
      adminUsers,
    ] = await Promise.all([
      sql`SELECT id, name, icon, color_hex, sort_order FROM categories ORDER BY sort_order ASC;`,
      sql`SELECT id, title, author, category_id, isbn, r2_key, cover_url, source_type, grade_level, total_pages, file_size_bytes, estimated_read_minutes, vocabulary_level, synopsis, is_published, is_deleted, uploaded_by, created_at FROM books ORDER BY created_at DESC;`,
      sql`SELECT nisn_hash, pin_hash, full_name, grade, class_name, is_active, first_login_at, last_login_at, created_at FROM students ORDER BY class_name ASC, full_name ASC;`,
      sql`SELECT id, student_nisn_hash, book_id, current_page, progress_pct, total_read_minutes, started_at, last_read_at FROM reading_sessions ORDER BY last_read_at DESC;`,
      sql`SELECT id, student_nisn_hash, reading_date, read_minutes, books_opened_count, updated_at FROM daily_reading_stats ORDER BY reading_date DESC;`,
      sql`SELECT id, student_nisn_hash, book_id, completed_at, total_read_minutes FROM reading_history ORDER BY completed_at DESC;`,
      sql`SELECT id, username, role, full_name, is_active, created_at FROM admin_users ORDER BY created_at ASC;`,
    ]);

    const timestamp = new Date().toISOString();
    const dateSlug = timestamp.slice(0, 10);

    if (format === "sql") {
      const lines: string[] = [
        "-- ============================================================================",
        "-- PUSTAKAKITA DATABASE BACKUP (SQL DUMP)",
        `-- Generated At: ${timestamp}`,
        `-- Scope: ${scope.toUpperCase()}`,
        "-- ============================================================================",
        "BEGIN;",
        "",
      ];

      if (scope === "all" || scope === "books") {
        lines.push("-- 1. CATEGORIES");
        for (const c of categories) {
          lines.push(
            `INSERT INTO categories (id, name, icon, color_hex, sort_order) VALUES (${escapeSqlValue(c.id)}, ${escapeSqlValue(c.name)}, ${escapeSqlValue(c.icon)}, ${escapeSqlValue(c.color_hex)}, ${escapeSqlValue(c.sort_order)}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, color_hex = EXCLUDED.color_hex, sort_order = EXCLUDED.sort_order;`
          );
        }
        lines.push("");

        lines.push("-- 2. BOOKS");
        for (const b of books) {
          lines.push(
            `INSERT INTO books (id, title, author, category_id, isbn, r2_key, cover_url, source_type, grade_level, total_pages, file_size_bytes, estimated_read_minutes, vocabulary_level, synopsis, is_published, is_deleted) VALUES (${escapeSqlValue(b.id)}, ${escapeSqlValue(b.title)}, ${escapeSqlValue(b.author)}, ${escapeSqlValue(b.category_id)}, ${escapeSqlValue(b.isbn)}, ${escapeSqlValue(b.r2_key)}, ${escapeSqlValue(b.cover_url)}, ${escapeSqlValue(b.source_type)}, ${escapeSqlValue(b.grade_level)}, ${escapeSqlValue(b.total_pages)}, ${escapeSqlValue(b.file_size_bytes || 0)}, ${escapeSqlValue(b.estimated_read_minutes)}, ${escapeSqlValue(b.vocabulary_level)}, ${escapeSqlValue(b.synopsis)}, ${escapeSqlValue(b.is_published)}, ${escapeSqlValue(b.is_deleted)}) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, author = EXCLUDED.author, category_id = EXCLUDED.category_id, cover_url = EXCLUDED.cover_url, total_pages = EXCLUDED.total_pages, synopsis = EXCLUDED.synopsis, is_published = EXCLUDED.is_published, is_deleted = EXCLUDED.is_deleted;`
          );
        }
        lines.push("");
      }

      if (scope === "all" || scope === "students") {
        lines.push("-- 3. STUDENTS");
        for (const s of students) {
          lines.push(
            `INSERT INTO students (nisn_hash, pin_hash, full_name, grade, class_name, is_active) VALUES (${escapeSqlValue(s.nisn_hash)}, ${escapeSqlValue(s.pin_hash)}, ${escapeSqlValue(s.full_name)}, ${escapeSqlValue(s.grade)}, ${escapeSqlValue(s.class_name)}, ${escapeSqlValue(s.is_active)}) ON CONFLICT (nisn_hash) DO UPDATE SET full_name = EXCLUDED.full_name, grade = EXCLUDED.grade, class_name = EXCLUDED.class_name, is_active = EXCLUDED.is_active;`
          );
        }
        lines.push("");
      }

      if (scope === "all") {
        lines.push("-- 4. READING SESSIONS");
        for (const rs of readingSessions) {
          lines.push(
            `INSERT INTO reading_sessions (id, student_nisn_hash, book_id, current_page, progress_pct, total_read_minutes) VALUES (${escapeSqlValue(rs.id)}, ${escapeSqlValue(rs.student_nisn_hash)}, ${escapeSqlValue(rs.book_id)}, ${escapeSqlValue(rs.current_page)}, ${escapeSqlValue(rs.progress_pct)}, ${escapeSqlValue(rs.total_read_minutes)}) ON CONFLICT (student_nisn_hash, book_id) DO UPDATE SET current_page = EXCLUDED.current_page, progress_pct = EXCLUDED.progress_pct, total_read_minutes = EXCLUDED.total_read_minutes;`
          );
        }
        lines.push("");
      }

      lines.push("COMMIT;");

      return new NextResponse(lines.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename="PustakaKita-Backup-${scope}-${dateSlug}.sql"`,
        },
      });
    }

    // Default: JSON Backup Bundle
    const payload = {
      meta: {
        app: "PustakaKita - Perpustakaan Digital Siswa",
        version: "1.0.0",
        backupCreatedAt: timestamp,
        scope,
        counts: {
          categories: categories.length,
          books: books.length,
          students: students.length,
          readingSessions: readingSessions.length,
          dailyStats: dailyStats.length,
          readingHistory: readingHistory.length,
          adminUsers: adminUsers.length,
        },
      },
      data: {
        categories: scope === "all" || scope === "books" ? categories : [],
        books: scope === "all" || scope === "books" ? books : [],
        students: scope === "all" || scope === "students" ? students : [],
        readingSessions: scope === "all" ? readingSessions : [],
        dailyStats: scope === "all" ? dailyStats : [],
        readingHistory: scope === "all" ? readingHistory : [],
        adminUsers: scope === "all" ? adminUsers : [],
      },
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="PustakaKita-Backup-${scope}-${dateSlug}.json"`,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Backup GET error:", err);
    return NextResponse.json(
      { message: "Gagal membuat cadangan (backup) database: " + err.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/backup: Restore / Pulihkan Data dari File JSON Backup
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role === "principal") {
      return NextResponse.json(
        { message: "Akses Ditolak: Hanya Guru Pustakawan yang dapat memulihkan (restore) database." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const backupData = body?.data || body;

    if (!backupData || typeof backupData !== "object") {
      return NextResponse.json(
        { message: "Format file backup JSON tidak valid." },
        { status: 400 }
      );
    }

    let restoredCategories = 0;
    let restoredBooks = 0;
    let restoredStudents = 0;
    let restoredSessions = 0;

    // 1. Restore Categories
    if (Array.isArray(backupData.categories)) {
      for (const c of backupData.categories) {
        if (!c.name) continue;
        await sql`
          INSERT INTO categories (id, name, icon, color_hex, sort_order)
          VALUES (
            COALESCE(${c.id || null}, gen_random_uuid()),
            ${c.name},
            ${c.icon || "BookOpen"},
            ${c.color_hex || c.colorHex || "#3B82F6"},
            ${Number(c.sort_order ?? c.sortOrder ?? 1)}
          )
          ON CONFLICT (name) DO UPDATE SET
            icon = EXCLUDED.icon,
            color_hex = EXCLUDED.color_hex,
            sort_order = EXCLUDED.sort_order;
        `;
        restoredCategories++;
      }
    }

    // 2. Restore Books
    if (Array.isArray(backupData.books)) {
      for (const b of backupData.books) {
        if (!b.title || !b.author) continue;
        const r2Key =
          b.r2_key ||
          b.r2Key ||
          b.fileUrl ||
          `books/restored-${Date.now()}-${String(b.title).toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;
        await sql`
          INSERT INTO books (
            title, author, category_id, isbn, r2_key, cover_url, source_type,
            grade_level, total_pages, file_size_bytes, estimated_read_minutes,
            vocabulary_level, synopsis, is_published, is_deleted
          )
          VALUES (
            ${b.title},
            ${b.author},
            ${b.category_id || null},
            ${b.isbn || null},
            ${r2Key},
            ${b.cover_url || b.coverUrl || null},
            ${b.source_type || b.sourceType || "bse"},
            ${b.grade_level || b.gradeLevel || "SMP"},
            ${Number(b.total_pages ?? b.totalPages ?? 24)},
            ${Number(b.file_size_bytes ?? 0)},
            ${Number(b.estimated_read_minutes ?? b.estimatedReadMinutes ?? 30)},
            ${b.vocabulary_level || b.vocabularyLevel || "Menengah"},
            ${b.synopsis || ""},
            ${b.is_published !== undefined ? Boolean(b.is_published) : true},
            ${b.is_deleted !== undefined ? Boolean(b.is_deleted) : false}
          )
          ON CONFLICT (r2_key) DO UPDATE SET
            title = EXCLUDED.title,
            author = EXCLUDED.author,
            cover_url = EXCLUDED.cover_url,
            total_pages = EXCLUDED.total_pages,
            synopsis = EXCLUDED.synopsis,
            is_published = EXCLUDED.is_published,
            is_deleted = EXCLUDED.is_deleted;
        `;
        restoredBooks++;
      }
    }

    // 3. Restore Students
    if (Array.isArray(backupData.students)) {
      for (const s of backupData.students) {
        if (!s.nisn_hash || !s.full_name || !s.pin_hash) continue;
        await sql`
          INSERT INTO students (
            nisn_hash, pin_hash, full_name, grade, class_name, is_active
          )
          VALUES (
            ${s.nisn_hash},
            ${s.pin_hash},
            ${s.full_name},
            ${Number(s.grade || 7)},
            ${s.class_name || "Kelas 7A"},
            ${s.is_active !== undefined ? Boolean(s.is_active) : true}
          )
          ON CONFLICT (nisn_hash) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            grade = EXCLUDED.grade,
            class_name = EXCLUDED.class_name,
            is_active = EXCLUDED.is_active;
        `;
        restoredStudents++;
      }
    }

    // 4. Restore Reading Sessions
    if (Array.isArray(backupData.readingSessions)) {
      for (const rs of backupData.readingSessions) {
        if (!rs.student_nisn_hash || !rs.book_id) continue;
        try {
          await sql`
            INSERT INTO reading_sessions (
              student_nisn_hash, book_id, current_page, progress_pct, total_read_minutes
            )
            VALUES (
              ${rs.student_nisn_hash},
              ${rs.book_id},
              ${Number(rs.current_page || 1)},
              ${Number(rs.progress_pct || 0)},
              ${Number(rs.total_read_minutes || 0)}
            )
            ON CONFLICT (student_nisn_hash, book_id) DO UPDATE SET
              current_page = GREATEST(reading_sessions.current_page, EXCLUDED.current_page),
              progress_pct = GREATEST(reading_sessions.progress_pct, EXCLUDED.progress_pct),
              total_read_minutes = GREATEST(reading_sessions.total_read_minutes, EXCLUDED.total_read_minutes);
          `;
          restoredSessions++;
        } catch {
          // Ignore foreign key mismatch if a specific book/student was excluded
        }
      }
    }

    return NextResponse.json({
      message: "Data cadangan (backup) berhasil dipulihkan ke database!",
      summary: {
        restoredCategories,
        restoredBooks,
        restoredStudents,
        restoredSessions,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Restore POST error:", err);
    return NextResponse.json(
      { message: "Gagal memulihkan data backup: " + err.message },
      { status: 500 }
    );
  }
}

