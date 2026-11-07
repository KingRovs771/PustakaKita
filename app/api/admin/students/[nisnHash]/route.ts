import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest, hashPIN } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PUT /api/admin/students/[nisnHash]: Edit info siswa atau Reset PIN (Pustakawan Only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { nisnHash: string } }
) {
  try {
    const nisnHash = params.nisnHash;
    const body = await req.json();
    const { fullName, grade, className, isActive, newPin } = body;
    const isOnlyResetPin =
      Boolean(newPin) &&
      !fullName &&
      !className &&
      grade === undefined &&
      isActive === undefined;

    const admin = await getAdminFromRequest(req);
    if (admin && admin.role === "principal" && !isOnlyResetPin) {
      return NextResponse.json(
        { message: "Akses Ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only)." },
        { status: 403 }
      );
    }

    let pinHashToUpdate: string | null = null;
    if (newPin) {
      const cleanPin = String(newPin).replace(/\D/g, "");
      if (cleanPin.length !== 6) {
        return NextResponse.json(
          { message: "PIN baru harus tepat 6 digit angka." },
          { status: 400 }
        );
      }
      pinHashToUpdate = await hashPIN(cleanPin);
    }

    let gradeNum: number | null = null;
    if (grade !== undefined && grade !== null) {
      if (typeof grade === "number") gradeNum = grade;
      else if (grade === "SD") gradeNum = 5;
      else if (grade === "SMP") gradeNum = 8;
      else if (grade === "SMA") gradeNum = 11;
    }

    const updated = await sql`
      UPDATE students
      SET
        full_name = COALESCE(${fullName ? String(fullName).trim() : null}, full_name),
        class_name = COALESCE(${className ? String(className).trim() : null}, class_name),
        grade = COALESCE(${gradeNum}, grade),
        is_active = COALESCE(${isActive !== undefined ? Boolean(isActive) : null}, is_active),
        pin_hash = COALESCE(${pinHashToUpdate}, pin_hash)
      WHERE nisn_hash = ${nisnHash}
      RETURNING nisn_hash, full_name, grade, class_name, is_active, last_login_at;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ message: "Siswa tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Data siswa berhasil diperbarui.",
      student: updated[0],
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Update student error:", err);
    return NextResponse.json(
      { message: "Gagal memperbarui data siswa: " + err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/students/[nisnHash]: Hapus atau nonaktifkan siswa (Pustakawan Only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { nisnHash: string } }
) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role === "principal") {
      return NextResponse.json(
        { message: "Akses Ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only)." },
        { status: 403 }
      );
    }

    const nisnHash = params.nisnHash;

    const deleted = await sql`
      DELETE FROM students
      WHERE nisn_hash = ${nisnHash}
      RETURNING nisn_hash, full_name;
    `;

    if (deleted.length === 0) {
      return NextResponse.json({ message: "Siswa tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      message: `Akun siswa ${deleted[0].full_name} berhasil dihapus dari sistem.`,
      nisnHash,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Delete student error:", err);
    return NextResponse.json(
      { message: "Gagal menghapus siswa: " + err.message },
      { status: 500 }
    );
  }
}

