import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest, hashNISN, hashPIN } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/students: Daftar siswa untuk Pustakawan dan Kepala Sekolah
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && !["librarian", "principal"].includes(admin.role)) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const classFilter = searchParams.get("class") || "ALL";
    const statusFilter = searchParams.get("status") || "ALL";

    let rows;

    if (query.trim().length > 0) {
      const qWildcard = `%${query.trim()}%`;
      rows = await sql`
        SELECT 
          s.nisn_hash, s.full_name, s.grade, s.class_name, s.is_active,
          s.first_login_at, s.last_login_at, s.created_at,
          COALESCE(SUM(d.read_minutes), 0)::int as minutes_week,
          COUNT(DISTINCT rs.book_id)::int as books_read
        FROM students s
        LEFT JOIN daily_reading_stats d 
          ON s.nisn_hash = d.student_nisn_hash AND d.reading_date >= CURRENT_DATE - INTERVAL '6 days'
        LEFT JOIN reading_sessions rs ON s.nisn_hash = rs.student_nisn_hash
        WHERE LOWER(s.full_name) LIKE LOWER(${qWildcard}) OR LOWER(s.class_name) LIKE LOWER(${qWildcard})
        GROUP BY s.nisn_hash, s.full_name, s.grade, s.class_name, s.is_active, s.first_login_at, s.last_login_at, s.created_at
        ORDER BY s.class_name ASC, s.full_name ASC;
      `;
    } else {
      rows = await sql`
        SELECT 
          s.nisn_hash, s.full_name, s.grade, s.class_name, s.is_active,
          s.first_login_at, s.last_login_at, s.created_at,
          COALESCE(SUM(d.read_minutes), 0)::int as minutes_week,
          COUNT(DISTINCT rs.book_id)::int as books_read
        FROM students s
        LEFT JOIN daily_reading_stats d 
          ON s.nisn_hash = d.student_nisn_hash AND d.reading_date >= CURRENT_DATE - INTERVAL '6 days'
        LEFT JOIN reading_sessions rs ON s.nisn_hash = rs.student_nisn_hash
        WHERE (${classFilter} = 'ALL' OR s.class_name = ${classFilter})
          AND (${statusFilter} = 'ALL' OR (${statusFilter} = 'active' AND s.is_active = true) OR (${statusFilter} = 'inactive' AND s.is_active = false))
        GROUP BY s.nisn_hash, s.full_name, s.grade, s.class_name, s.is_active, s.first_login_at, s.last_login_at, s.created_at
        ORDER BY s.class_name ASC, s.full_name ASC;
      `;
    }

    return NextResponse.json({
      students: rows,
      totalCount: rows.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Fetch students error:", err);
    return NextResponse.json(
      { message: "Gagal memuat data siswa: " + err.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/students: Tambah siswa baru (Guru Pustakawan Only - Menggunakan Rust Wasm NISN Hashing)
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role === "principal") {
      return NextResponse.json(
        { message: "Akses Ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only)." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nisn, pin, fullName, grade, className } = body;

    if (!nisn || !pin || !fullName || !className) {
      return NextResponse.json(
        { message: "NISN, PIN, Nama Lengkap, dan Kelas wajib diisi." },
        { status: 400 }
      );
    }

    const cleanNisn = String(nisn).replace(/\D/g, "");
    if (cleanNisn.length !== 10) {
      return NextResponse.json(
        { message: "NISN harus terdiri dari 10 digit angka sesuai standar Kemendikbud." },
        { status: 400 }
      );
    }

    const cleanPin = String(pin).replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      return NextResponse.json(
        { message: "PIN harus terdiri dari 6 digit angka." },
        { status: 400 }
      );
    }

    // 1. Hitung NISN Hash via Rust WebAssembly HMAC-SHA256 (OPSI A PRD)
    const nisnHash = hashNISN(cleanNisn);

    // 2. Hash PIN via Bcrypt (Cost 10)
    const pinHash = await hashPIN(cleanPin);

    // 3. Konversi jenjang
    let gradeNum = 8;
    if (typeof grade === "number") {
      gradeNum = grade;
    } else if (grade === "SD") {
      gradeNum = 5;
    } else if (grade === "SMP") {
      gradeNum = 8;
    } else if (grade === "SMA") {
      gradeNum = 11;
    }

    // 4. Cek duplikasi
    const existing = await sql`
      SELECT nisn_hash FROM students WHERE nisn_hash = ${nisnHash} LIMIT 1;
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Siswa dengan NISN ini sudah terdaftar di sistem." },
        { status: 409 }
      );
    }

    const inserted = await sql`
      INSERT INTO students (nisn_hash, pin_hash, full_name, grade, class_name, is_active)
      VALUES (${nisnHash}, ${pinHash}, ${fullName.trim()}, ${gradeNum}, ${className.trim()}, true)
      RETURNING nisn_hash, full_name, grade, class_name, is_active, created_at;
    `;

    return NextResponse.json({
      message: `Siswa ${inserted[0].full_name} berhasil didaftarkan.`,
      student: inserted[0],
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create student error:", err);
    return NextResponse.json(
      { message: "Gagal mendaftarkan siswa baru: " + err.message },
      { status: 500 }
    );
  }
}

