import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPIN, signAccessToken, signRefreshToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, username, password_hash, role, full_name, is_active
      FROM admin_users
      WHERE LOWER(username) = LOWER(${String(username).trim()})
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Username atau kata sandi tidak sesuai." },
        { status: 401 }
      );
    }

    const user = rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { message: "Akun ini dinonaktifkan." },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPIN(String(password), user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Username atau kata sandi tidak sesuai." },
        { status: 401 }
      );
    }

    // Ambil nama Pustakawan / Kepala Sekolah terbaru dari Biodata Sekolah (school_settings) bila sudah dikonfigurasi
    let resolvedFullName = user.full_name;
    try {
      const schoolRows = await sql`
        SELECT librarian_name, principal_name
        FROM school_settings
        WHERE id = 1
        LIMIT 1;
      `;
      if (schoolRows.length > 0) {
        const s = schoolRows[0];
        if (
          user.role === "principal" ||
          String(user.username).toLowerCase() === "kepsek"
        ) {
          if (s.principal_name) resolvedFullName = s.principal_name;
        } else {
          if (s.librarian_name) resolvedFullName = s.librarian_name;
        }
      }
    } catch {
      // Gunakan user.full_name jika tabel school_settings belum ada
    }

    const tokenPayload = {
      adminId: user.id,
      username: user.username,
      fullName: resolvedFullName,
      role: "librarian" as const,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(user.id);

    const response = NextResponse.json({
      message: `Selamat datang, ${resolvedFullName}`,
      user: {
        id: user.id,
        username: user.username,
        role: "librarian",
        fullName: resolvedFullName,
      },
      accessToken,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60, // 7 hari
      path: "/",
    };

    response.cookies.set("accessToken", accessToken, cookieOptions);
    response.cookies.set("admin_token", accessToken, cookieOptions);
    response.cookies.set("refreshToken", refreshToken, cookieOptions);

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Admin login error:", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
