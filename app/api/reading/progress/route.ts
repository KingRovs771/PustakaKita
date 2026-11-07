import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken, StudentJWTPayload } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/reading/progress: Mengambil progres buku aktif siswa
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Autentikasi diperlukan." }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const student = await verifyToken<StudentJWTPayload>(token);

    if (!student) {
      return NextResponse.json({ message: "Sesi tidak valid." }, { status: 401 });
    }

    const rows = await sql`
      SELECT 
        rs.book_id, rs.current_page, rs.progress_pct, rs.total_read_minutes, rs.last_read_at,
        b.title, b.author, b.total_pages, b.cover_url, b.grade_level
      FROM reading_sessions rs
      JOIN books b ON rs.book_id = b.id
      WHERE rs.student_nisn_hash = ${student.nisnHash}
      ORDER BY rs.last_read_at DESC;
    `;

    // Also fetch weekly total minutes for student dashboard
    const weeklyStats = await sql`
      SELECT COALESCE(SUM(read_minutes), 0) as weekly_minutes
      FROM daily_reading_stats
      WHERE student_nisn_hash = ${student.nisnHash}
        AND reading_date >= CURRENT_DATE - INTERVAL '6 days';
    `;

    return NextResponse.json({
      activeSessions: rows,
      minutesReadThisWeek: parseInt(weeklyStats[0].weekly_minutes, 10),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// POST /api/reading/progress: Menyimpan progress (autosave / heartbeat / beforeunload)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Autentikasi diperlukan." }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const student = await verifyToken<StudentJWTPayload>(token);

    if (!student) {
      return NextResponse.json({ message: "Sesi tidak valid." }, { status: 401 });
    }

    const body = await req.json();
    const { bookId, currentPage, totalPages, additionalMinutes = 1 } = body;

    if (!bookId || !currentPage || !totalPages) {
      return NextResponse.json(
        { message: "bookId, currentPage, dan totalPages wajib disertakan." },
        { status: 400 }
      );
    }

    const clampedPage = Math.max(1, Math.min(currentPage, totalPages));
    const progressPct = parseFloat(((clampedPage / totalPages) * 100).toFixed(2));
    const minutesDelta = Math.max(0, parseInt(String(additionalMinutes), 10));

    // 1. Upsert reading_sessions (ON CONFLICT DO UPDATE)
    await sql`
      INSERT INTO reading_sessions (
        student_nisn_hash, book_id, current_page, progress_pct, total_read_minutes, started_at, last_read_at
      )
      VALUES (
        ${student.nisnHash}, ${bookId}, ${clampedPage}, ${progressPct}, ${minutesDelta}, NOW(), NOW()
      )
      ON CONFLICT (student_nisn_hash, book_id) DO UPDATE
      SET 
        current_page = EXCLUDED.current_page,
        progress_pct = EXCLUDED.progress_pct,
        total_read_minutes = reading_sessions.total_read_minutes + EXCLUDED.total_read_minutes,
        last_read_at = NOW();
    `;

    // 2. Upsert daily_reading_stats untuk kalkulasi WAR 7-hari yang akurat
    await sql`
      INSERT INTO daily_reading_stats (
        student_nisn_hash, reading_date, read_minutes, books_opened_count, updated_at
      )
      VALUES (
        ${student.nisnHash}, CURRENT_DATE, ${minutesDelta}, 1, NOW()
      )
      ON CONFLICT (student_nisn_hash, reading_date) DO UPDATE
      SET 
        read_minutes = daily_reading_stats.read_minutes + EXCLUDED.read_minutes,
        updated_at = NOW();
    `;

    // 3. Jika progress = 100%, simpan juga ke reading_history
    if (progressPct >= 100) {
      await sql`
        INSERT INTO reading_history (student_nisn_hash, book_id, completed_at, total_read_minutes)
        VALUES (${student.nisnHash}, ${bookId}, NOW(), ${minutesDelta})
        ON CONFLICT DO NOTHING;
      `;
    }

    return NextResponse.json({
      message: "Progres membaca berhasil disimpan.",
      currentPage: clampedPage,
      progressPct,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Save progress error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

