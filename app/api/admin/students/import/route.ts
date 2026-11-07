import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest, hashNISN, hashPIN } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RawStudentImportItem {
  nisn?: string | number;
  fullName?: string;
  grade?: string | number;
  className?: string;
  pin?: string | number;
}

function normalizeGradeAndClass(
  rawGrade?: string | number,
  rawClass?: string
): { gradeNum: number; className: string } {
  const classStr = String(rawClass || "").trim();
  const gradeStr = String(rawGrade || "").trim().toUpperCase();

  // Cari angka tingkat kelas 1-12 dari nama kelas atau kolom grade
  const classNumMatch = classStr.match(/\b(1[0-2]|[1-9])\b/) || classStr.match(/(1[0-2]|[1-9])/);
  const gradeNumMatch = gradeStr.match(/\b(1[0-2]|[1-9])\b/);

  let gradeNum = 7;
  if (gradeNumMatch) {
    gradeNum = parseInt(gradeNumMatch[1], 10);
  } else if (classNumMatch) {
    gradeNum = parseInt(classNumMatch[1], 10);
  } else if (gradeStr.includes("SD")) {
    gradeNum = 5;
  } else if (gradeStr.includes("SMA") || gradeStr.includes("SMK")) {
    gradeNum = 10;
  } else if (gradeStr.includes("SMP")) {
    gradeNum = 7;
  }

  gradeNum = Math.max(1, Math.min(12, gradeNum));

  let normalizedClass = classStr;
  if (!normalizedClass) {
    normalizedClass = gradeNum >= 10 ? `Kelas ${gradeNum}` : `Kelas ${gradeNum}A`;
  } else if (!/^kelas\s+/i.test(normalizedClass)) {
    // Jika di Excel hanya tertulis "7A" atau "10 MIPA 1", tambahkan awalan "Kelas "
    normalizedClass = `Kelas ${normalizedClass}`;
  } else {
    normalizedClass = normalizedClass.replace(/^kelas\s+/i, "Kelas ");
  }

  return { gradeNum, className: normalizedClass };
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role === "principal") {
      return NextResponse.json(
        { message: "Akses Ditolak: Hanya Guru Pustakawan yang dapat mengimpor data siswa." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const items: RawStudentImportItem[] = Array.isArray(body.students)
      ? body.students
      : [];

    if (items.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada baris data siswa ditemukan di dalam file Excel / CSV." },
        { status: 400 }
      );
    }

    if (items.length > 1000) {
      return NextResponse.json(
        { message: "Maksimal 1.000 siswa per unggahan batch." },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Optimasi: cache hash untuk PIN yang sama (misal PIN default "123456") agar proses ratusan siswa dari Excel selesai dalam < 1 detik!
    const pinHashCache = new Map<string, string>();

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const fullName = String(row.fullName || "").trim();
      const rawNisnDigits = String(row.nisn ?? "").replace(/\D/g, "");

      if (!fullName || rawNisnDigits.length < 5) {
        skippedCount++;
        errors.push(`Baris ${i + 1}: Nama atau NISN tidak valid.`);
        continue;
      }

      // Excel sering menghilangkan angka 0 di depan NISN (misal 0012345678 menjadi 12345678).
      // Kita pad otomatis dengan '0' di depan hingga 10 digit.
      const cleanNisn = rawNisnDigits.padStart(10, "0").slice(0, 10);

      const rawPinDigits = String(row.pin ?? "").replace(/\D/g, "");
      const cleanPin =
        rawPinDigits.length >= 6
          ? rawPinDigits.slice(0, 6)
          : rawPinDigits.length > 0
            ? rawPinDigits.padStart(6, "0")
            : "123456";

      const { gradeNum, className } = normalizeGradeAndClass(
        row.grade,
        row.className
      );

      const nisnHash = hashNISN(cleanNisn);

      let pinHash = pinHashCache.get(cleanPin);
      if (!pinHash) {
        pinHash = await hashPIN(cleanPin);
        pinHashCache.set(cleanPin, pinHash);
      }

      try {
        await sql`
          INSERT INTO students (
            nisn_hash, pin_hash, full_name, grade, class_name, is_active
          )
          VALUES (
            ${nisnHash}, ${pinHash}, ${fullName}, ${gradeNum}, ${className}, true
          )
          ON CONFLICT (nisn_hash) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            grade = EXCLUDED.grade,
            class_name = EXCLUDED.class_name,
            pin_hash = EXCLUDED.pin_hash,
            is_active = true;
        `;
        importedCount++;
      } catch (dbErr: any) {
        skippedCount++;
        errors.push(`Baris ${i + 1} (${fullName}): ${dbErr?.message || "Gagal simpan DB"}`);
      }
    }

    return NextResponse.json({
      message: `Berhasil mengimpor ${importedCount} siswa ke database Neon PostgreSQL!`,
      importedCount,
      skippedCount,
      totalProcessed: items.length,
      errors: errors.slice(0, 10),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Import Excel students error:", err);
    return NextResponse.json(
      { message: "Gagal memproses import data siswa: " + err.message },
      { status: 500 }
    );
  }
}

