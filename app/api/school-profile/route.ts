import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface SchoolProfilePayload {
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
}

async function ensureSchoolSettingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS school_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      school_name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      npsn TEXT DEFAULT '',
      default_grade TEXT DEFAULT 'SMP',
      city TEXT DEFAULT '',
      province TEXT DEFAULT '',
      address TEXT DEFAULT '',
      librarian_name TEXT DEFAULT 'Guru Pustakawan',
      principal_name TEXT DEFAULT 'Kepala Sekolah',
      academic_year TEXT DEFAULT '2026/2027',
      motto TEXT DEFAULT 'Membaca Membuka Jendela Dunia',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT single_row CHECK (id = 1)
    );
  `;
  // Pastikan kolom principal_name tersedia jika tabel sudah dibuat sebelumnya
  await sql`
    ALTER TABLE school_settings
    ADD COLUMN IF NOT EXISTS principal_name TEXT DEFAULT 'Kepala Sekolah';
  `;
}

export async function GET() {
  try {
    await ensureSchoolSettingsTable();
    const rows = await sql`
      SELECT
        school_name,
        short_name,
        npsn,
        default_grade,
        city,
        province,
        address,
        librarian_name,
        principal_name,
        academic_year,
        motto,
        updated_at
      FROM school_settings
      WHERE id = 1
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({
        configured: false,
        profile: null,
      });
    }

    const r = rows[0];
    return NextResponse.json({
      configured: true,
      profile: {
        schoolName: r.school_name,
        shortName: r.short_name,
        npsn: r.npsn || "",
        defaultGrade: (r.default_grade as "SD" | "SMP" | "SMA") || "SMP",
        city: r.city || "",
        province: r.province || "",
        address: r.address || "",
        librarianName: r.librarian_name || "Guru Pustakawan",
        principalName: r.principal_name || "Kepala Sekolah",
        academicYear: r.academic_year || "2026/2027",
        motto: r.motto || "Membaca Membuka Jendela Dunia",
        isConfigured: true,
      },
    });
  } catch (error) {
    console.warn("GET /api/school-profile fallback:", error);
    return NextResponse.json({
      configured: false,
      profile: null,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SchoolProfilePayload>;
    const schoolName = (body.schoolName || "").trim();
    if (!schoolName) {
      return NextResponse.json(
        { error: "Nama lengkap sekolah wajib diisi." },
        { status: 400 }
      );
    }

    const shortName =
      (body.shortName || "").trim() ||
      schoolName
        .replace(/Negeri/gi, "N")
        .replace(/Swasta/gi, "S")
        .slice(0, 28);
    const npsn = (body.npsn || "").replace(/\D/g, "").slice(0, 10);
    const defaultGrade =
      body.defaultGrade === "SD" || body.defaultGrade === "SMP" || body.defaultGrade === "SMA"
        ? body.defaultGrade
        : "SMP";
    const city = (body.city || "").trim();
    const province = (body.province || "").trim();
    const address = (body.address || "").trim();
    const librarianName = (body.librarianName || "Guru Pustakawan").trim();
    const principalName = (body.principalName || "Kepala Sekolah").trim();
    const academicYear = (body.academicYear || "2026/2027").trim();
    const motto =
      (body.motto || "Membaca Membuka Jendela Dunia").trim();

    await ensureSchoolSettingsTable();

    await sql`
      INSERT INTO school_settings (
        id,
        school_name,
        short_name,
        npsn,
        default_grade,
        city,
        province,
        address,
        librarian_name,
        principal_name,
        academic_year,
        motto,
        updated_at
      )
      VALUES (
        1,
        ${schoolName},
        ${shortName},
        ${npsn},
        ${defaultGrade},
        ${city},
        ${province},
        ${address},
        ${librarianName},
        ${principalName},
        ${academicYear},
        ${motto},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        school_name = EXCLUDED.school_name,
        short_name = EXCLUDED.short_name,
        npsn = EXCLUDED.npsn,
        default_grade = EXCLUDED.default_grade,
        city = EXCLUDED.city,
        province = EXCLUDED.province,
        address = EXCLUDED.address,
        librarian_name = EXCLUDED.librarian_name,
        principal_name = EXCLUDED.principal_name,
        academic_year = EXCLUDED.academic_year,
        motto = EXCLUDED.motto,
        updated_at = NOW();
    `;

    // Sinkronkan otomatis Nama Guru Pustakawan & Nama Kepala Sekolah ke tabel admin_users
    try {
      await sql`
        UPDATE admin_users
        SET full_name = ${librarianName}
        WHERE role = 'librarian' OR username = 'pustakawan';
      `;
      await sql`
        UPDATE admin_users
        SET full_name = ${principalName}
        WHERE role = 'principal' OR username = 'kepsek';
      `;
    } catch (syncErr) {
      console.warn("Sinkronisasi nama admin_users dilewati:", syncErr);
    }

    return NextResponse.json({
      message: "Biodata sekolah, Pustakawan, dan Kepala Sekolah berhasil disimpan!",
      profile: {
        schoolName,
        shortName,
        npsn,
        defaultGrade,
        city,
        province,
        address,
        librarianName,
        principalName,
        academicYear,
        motto,
        isConfigured: true,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("POST /api/school-profile error:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan biodata sekolah ke database." },
      { status: 500 }
    );
  }
}
