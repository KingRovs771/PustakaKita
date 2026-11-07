import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  hashNISN,
  verifyPIN,
  signAccessToken,
  signRefreshToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nisn, pin, grade } = body;

    if (!nisn || !pin) {
      return NextResponse.json(
        { message: "NISN dan PIN wajib diisi." },
        { status: 400 }
      );
    }

    const cleanNisn = String(nisn).replace(/\D/g, "");
    if (cleanNisn.length !== 10) {
      return NextResponse.json(
        { message: "NISN harus terdiri dari 10 digit angka." },
        { status: 400 }
      );
    }

    // 1. Compute HMAC-SHA256 hash (never query or log raw NISN)
    const nisnHash = hashNISN(cleanNisn);

    // 2. Fetch student from Neon Postgres
    const rows = await sql`
      SELECT nisn_hash, pin_hash, full_name, grade, class_name, is_active, first_login_at
      FROM students
      WHERE nisn_hash = ${nisnHash}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      // Intentionally neutral error message to prevent student enumeration
      return NextResponse.json(
        { message: "NISN belum terdaftar atau PIN tidak cocok. Tanyakan pada guru perpustakaan ya!" },
        { status: 401 }
      );
    }

    const student = rows[0];

    if (!student.is_active) {
      return NextResponse.json(
        { message: "Akun dinonaktifkan sementara oleh pihak sekolah." },
        { status: 403 }
      );
    }

    // 3. Verify PIN with bcrypt
    const isValidPin = await verifyPIN(String(pin), student.pin_hash);
    if (!isValidPin) {
      return NextResponse.json(
        { message: "NISN belum terdaftar atau PIN tidak cocok. Tanyakan pada guru perpustakaan ya!" },
        { status: 401 }
      );
    }

    // 4. Update login timestamps (first_login_at if NULL, and last_login_at)
    await sql`
      UPDATE students
      SET 
        first_login_at = COALESCE(first_login_at, NOW()),
        last_login_at = NOW()
      WHERE nisn_hash = ${nisnHash};
    `;

    // 5. Generate JWT tokens
    const gradeLevel = student.grade <= 6 ? "SD" : student.grade <= 9 ? "SMP" : "SMA";
    const tokenPayload = {
      nisnHash: student.nisn_hash,
      name: student.full_name,
      grade: gradeLevel as "SD" | "SMP" | "SMA",
      className: student.class_name,
      role: "student" as const,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(student.nisn_hash);

    const response = NextResponse.json({
      message: "Berhasil masuk ke perpustakaan.",
      student: {
        nisn: cleanNisn,
        nisnHash: student.nisn_hash,
        name: student.full_name,
        grade: gradeLevel,
        className: student.class_name,
      },
      accessToken,
    });

    // Set secure httpOnly cookie for refresh token
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Student login error:", err);
    return NextResponse.json(
      { message: "Terjadi gangguan sistem saat verifikasi. Silakan coba sesaat lagi." },
      { status: 500 }
    );
  }
}

