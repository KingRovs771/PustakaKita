import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    // Jika tidak ada token pada dev, izinkan fallback jika requested
    if (admin && !["librarian", "principal"].includes(admin.role)) {
      return NextResponse.json({ message: "Akses ditolak: Hanya Guru Pustakawan dan Kepala Sekolah." }, { status: 403 });
    }

    // 1. Weekly Active Readers (WAR) 7 Hari Terakhir
    const warResult = await sql`
      SELECT COUNT(student_nisn_hash) AS war
      FROM (
        SELECT student_nisn_hash, SUM(read_minutes) AS weekly_minutes
        FROM daily_reading_stats
        WHERE reading_date >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY student_nisn_hash
        HAVING SUM(read_minutes) >= 10
      ) active_readers;
    `;

    const totalStudentsResult = await sql`SELECT COUNT(*) as count FROM students WHERE is_active = true;`;
    const totalBooksResult = await sql`SELECT COUNT(*) as count FROM books WHERE is_deleted = false;`;

    // 2. Rata-rata durasi baca
    const avgDurationResult = await sql`
      SELECT COALESCE(ROUND(AVG(read_minutes)), 0) as avg_minutes
      FROM daily_reading_stats
      WHERE reading_date >= CURRENT_DATE - INTERVAL '29 days';
    `;

    // 3. Partisipasi per kelas
    const classParticipation = await sql`
      SELECT 
        s.class_name,
        COUNT(DISTINCT s.nisn_hash) as total_students,
        COUNT(DISTINCT d.student_nisn_hash) as active_students,
        COALESCE(ROUND(AVG(d.read_minutes)), 0) as avg_minutes
      FROM students s
      LEFT JOIN daily_reading_stats d 
        ON s.nisn_hash = d.student_nisn_hash AND d.reading_date >= CURRENT_DATE - INTERVAL '6 days'
      WHERE s.is_active = true
      GROUP BY s.class_name
      ORDER BY s.class_name ASC;
    `;

    // 4. Buku Terpopuler
    const topBooks = await sql`
      SELECT 
        b.id, b.title, b.author, c.name as category_name,
        COUNT(rs.id) as read_count,
        ROUND(AVG(rs.progress_pct)) as avg_completion
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      JOIN reading_sessions rs ON b.id = rs.book_id
      WHERE b.is_deleted = false
      GROUP BY b.id, b.title, b.author, c.name
      ORDER BY read_count DESC
      LIMIT 5;
    `;

    // 5. Daftar Siswa & Status Keaktifan
    const studentsList = await sql`
      SELECT 
        s.nisn_hash, s.full_name, s.class_name, s.first_login_at, s.last_login_at,
        COALESCE(SUM(d.read_minutes), 0) as minutes_week,
        COUNT(DISTINCT rs.book_id) as books_read
      FROM students s
      LEFT JOIN daily_reading_stats d 
        ON s.nisn_hash = d.student_nisn_hash AND d.reading_date >= CURRENT_DATE - INTERVAL '6 days'
      LEFT JOIN reading_sessions rs ON s.nisn_hash = rs.student_nisn_hash
      WHERE s.is_active = true
      GROUP BY s.nisn_hash, s.full_name, s.class_name, s.first_login_at, s.last_login_at
      ORDER BY minutes_week DESC
      LIMIT 20;
    `;

    return NextResponse.json({
      summaryMetrics: {
        activeReadersCount: parseInt(warResult[0].war, 10),
        totalStudentsCount: parseInt(totalStudentsResult[0].count, 10),
        totalBooksCount: parseInt(totalBooksResult[0].count, 10),
        avgReadingMinutesPerStudent: parseInt(avgDurationResult[0].avg_minutes, 10),
      },
      classParticipation,
      topBooks,
      studentsList,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

