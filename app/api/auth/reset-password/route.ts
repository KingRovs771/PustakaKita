import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashNISN, hashPIN, verifyPIN, getAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/reset-password
 * Mendukung reset password / PIN untuk semua role:
 * 1. targetRole = "student"   -> Reset 6 digit PIN Siswa (via NISN + PIN Lama / Nama Lengkap / Akses Admin)
 * 2. targetRole = "librarian" -> Reset password Guru Pustakawan
 * 3. targetRole = "principal" -> Reset password Kepala Sekolah
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      targetRole, // "student" | "librarian" | "principal"
      nisn,
      username,
      currentSecret, // PIN lama atau Password lama (opsional jika menggunakan verifikasi nama / admin)
      verifyName, // Nama lengkap untuk verifikasi lupa password/PIN
      newSecret, // PIN baru (6 digit) atau Password baru (min 6 karakter)
      isAdminOverride, // Jika dilakukan langsung dari panel /admin
    } = body;

    if (!targetRole || !newSecret) {
      return NextResponse.json(
        { message: "Peran akun dan kata sandi / PIN baru wajib diisi." },
        { status: 400 }
      );
    }

    // =========================================================================
    // 1. RESET PIN SISWA (Role: student)
    // =========================================================================
    if (targetRole === "student") {
      const cleanNisn = String(nisn || "").replace(/\D/g, "");
      if (cleanNisn.length !== 10) {
        return NextResponse.json(
          { message: "NISN harus terdiri dari tepat 10 digit angka." },
          { status: 400 }
        );
      }

      const cleanNewPin = String(newSecret).replace(/\D/g, "");
      if (cleanNewPin.length !== 6) {
        return NextResponse.json(
          { message: "PIN baru siswa harus terdiri dari tepat 6 digit angka." },
          { status: 400 }
        );
      }

      const nisnHash = hashNISN(cleanNisn);
      const rows = await sql`
        SELECT nisn_hash, pin_hash, full_name
        FROM students
        WHERE nisn_hash = ${nisnHash}
        LIMIT 1;
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { message: "Data siswa dengan NISN tersebut tidak ditemukan." },
          { status: 404 }
        );
      }

      const student = rows[0];
      const adminSession = await getAdminFromRequest(req);

      // Verifikasi otorisasi reset PIN siswa
      if (!adminSession && !isAdminOverride) {
        if (currentSecret) {
          const isOldPinValid = await verifyPIN(String(currentSecret), student.pin_hash);
          if (!isOldPinValid) {
            return NextResponse.json(
              { message: "PIN lama yang kamu masukkan tidak sesuai." },
              { status: 401 }
            );
          }
        } else if (verifyName) {
          const dbName = String(student.full_name || "").trim().toLowerCase();
          const inputName = String(verifyName || "").trim().toLowerCase();
          if (!inputName || dbName !== inputName) {
            return NextResponse.json(
              { message: "Nama lengkap tidak sesuai dengan NISN yang terdaftar." },
              { status: 401 }
            );
          }
        } else {
          return NextResponse.json(
            { message: "Masukkan PIN lama atau Nama Lengkap sesuai absen untuk verifikasi." },
            { status: 400 }
          );
        }
      }

      const newPinHash = await hashPIN(cleanNewPin);
      await sql`
        UPDATE students
        SET pin_hash = ${newPinHash}
        WHERE nisn_hash = ${nisnHash};
      `;

      return NextResponse.json({
        message: `PIN masuk untuk siswa ${student.full_name} berhasil direset!`,
      });
    }

    // =========================================================================
    // 2. RESET PASSWORD STAF: PUSTAKAWAN / KEPALA SEKOLAH (Role: librarian | principal)
    // =========================================================================
    if (targetRole === "librarian" || targetRole === "principal") {
      const cleanNewPass = String(newSecret).trim();
      if (cleanNewPass.length < 6) {
        return NextResponse.json(
          { message: "Kata sandi baru minimal harus terdiri dari 6 karakter." },
          { status: 400 }
        );
      }

      const targetUsername =
        username?.trim() || (targetRole === "librarian" ? "pustakawan" : "kepsek");

      const rows = await sql`
        SELECT id, username, password_hash, role, full_name
        FROM admin_users
        WHERE username = ${targetUsername} OR role = ${targetRole}
        ORDER BY (username = ${targetUsername}) DESC
        LIMIT 1;
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { message: "Akun staf pengelola tidak ditemukan di database." },
          { status: 404 }
        );
      }

      const adminUser = rows[0];
      const adminSession = await getAdminFromRequest(req);

      // Jika bukan dari sesi admin aktif, wajib verifikasi password lama atau nama lengkap staf
      if (!adminSession && !isAdminOverride) {
        if (currentSecret) {
          const isOldPassValid = await verifyPIN(String(currentSecret), adminUser.password_hash);
          if (!isOldPassValid) {
            return NextResponse.json(
              { message: "Kata sandi lama tidak sesuai." },
              { status: 401 }
            );
          }
        } else if (verifyName) {
          const dbName = String(adminUser.full_name || "").trim().toLowerCase();
          const inputName = String(verifyName || "").trim().toLowerCase();
          if (!inputName || !dbName.includes(inputName)) {
            return NextResponse.json(
              { message: "Verifikasi nama staf tidak cocok." },
              { status: 401 }
            );
          }
        } else {
          return NextResponse.json(
            { message: "Masukkan kata sandi lama untuk verifikasi keamanan." },
            { status: 400 }
          );
        }
      }

      const newPassHash = await hashPIN(cleanNewPass);
      await sql`
        UPDATE admin_users
        SET password_hash = ${newPassHash}
        WHERE id = ${adminUser.id};
      `;

      const roleLabel =
        adminUser.role === "librarian" ? "Guru Pustakawan" : "Kepala Sekolah";

      return NextResponse.json({
        message: `Kata sandi untuk ${roleLabel} (${adminUser.username}) berhasil diperbarui!`,
      });
    }

    return NextResponse.json(
      { message: "Kategori role tidak valid." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in POST /api/auth/reset-password:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal saat mereset kata sandi." },
      { status: 500 }
    );
  }
}

