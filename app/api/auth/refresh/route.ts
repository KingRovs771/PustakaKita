import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken, signAccessToken, signRefreshToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: "Tidak ada refresh token." }, { status: 401 });
    }

    const payload = await verifyToken<{ sub: string }>(refreshToken);
    if (!payload?.sub) {
      return NextResponse.json({ message: "Sesi telah berakhir, silakan masuk kembali." }, { status: 401 });
    }

    const sub = payload.sub;

    // Check if sub is student nisn_hash (64 hex characters)
    if (sub.length === 64) {
      const studentRows = await sql`
        SELECT nisn_hash, full_name, grade, class_name, is_active
        FROM students
        WHERE nisn_hash = ${sub}
        LIMIT 1;
      `;

      if (studentRows.length === 0 || !studentRows[0].is_active) {
        return NextResponse.json({ message: "Akun siswa tidak ditemukan atau tidak aktif." }, { status: 401 });
      }

      const s = studentRows[0];
      const gradeLevel = s.grade <= 6 ? "SD" : s.grade <= 9 ? "SMP" : "SMA";
      const newAccess = await signAccessToken({
        nisnHash: s.nisn_hash,
        name: s.full_name,
        grade: gradeLevel as "SD" | "SMP" | "SMA",
        className: s.class_name,
        role: "student",
      });

      return NextResponse.json({ accessToken: newAccess });
    }

    // Otherwise check admin_users
    const adminRows = await sql`
      SELECT id, username, role, is_active
      FROM admin_users
      WHERE id = ${sub}
      LIMIT 1;
    `;

    if (adminRows.length === 0 || !adminRows[0].is_active) {
      return NextResponse.json({ message: "Akun admin tidak ditemukan." }, { status: 401 });
    }

    const a = adminRows[0];
    const newAccess = await signAccessToken({
      adminId: a.id,
      username: a.username,
      role: a.role as "librarian" | "principal",
    });

    return NextResponse.json({ accessToken: newAccess });
  } catch (err: unknown) {
    return NextResponse.json({ message: "Gagal memperbarui sesi." }, { status: 500 });
  }
}

