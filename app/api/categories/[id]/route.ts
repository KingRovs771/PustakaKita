import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PUT /api/categories/[id]: Mengubah detail kategori (nama, ikon, warna, urutan)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role !== "librarian") {
      return NextResponse.json(
        { message: "Akses ditolak: Hanya Guru Pustakawan yang dapat mengubah kategori." },
        { status: 403 }
      );
    }

    const categoryId = params.id;
    const body = await req.json();
    const { name, icon, colorHex, sortOrder } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Nama kategori tidak boleh kosong." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanIcon = (icon && icon.trim()) || "BookOpen";
    const cleanColor = (colorHex && colorHex.trim()) || "#3B82F6";
    const cleanSort = typeof sortOrder === "number" ? sortOrder : 0;

    // Cek duplikasi nama kategori dengan id berbeda
    const duplicate = await sql`
      SELECT id FROM categories 
      WHERE LOWER(name) = LOWER(${cleanName}) AND id != ${categoryId}
      LIMIT 1;
    `;
    if (duplicate.length > 0) {
      return NextResponse.json(
        { message: `Kategori '${cleanName}' sudah digunakan oleh kategori lain.` },
        { status: 409 }
      );
    }

    const updated = await sql`
      UPDATE categories
      SET 
        name = ${cleanName},
        icon = ${cleanIcon},
        color_hex = ${cleanColor},
        sort_order = ${cleanSort}
      WHERE id = ${categoryId}
      RETURNING id, name, icon, color_hex, sort_order;
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { message: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Kategori berhasil diperbarui.",
      category: updated[0],
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Update category error:", err);
    return NextResponse.json(
      { message: "Gagal memperbarui kategori: " + err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id]: Menghapus kategori
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role !== "librarian") {
      return NextResponse.json(
        { message: "Akses ditolak: Hanya Guru Pustakawan yang dapat menghapus kategori." },
        { status: 403 }
      );
    }

    const categoryId = params.id;

    // Lepas relasi category_id di buku terlebih dahulu (ON DELETE SET NULL)
    await sql`
      UPDATE books
      SET category_id = NULL
      WHERE category_id = ${categoryId};
    `;

    const deleted = await sql`
      DELETE FROM categories
      WHERE id = ${categoryId}
      RETURNING id, name;
    `;

    if (deleted.length === 0) {
      return NextResponse.json(
        { message: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Kategori '${deleted[0].name}' berhasil dihapus.`,
      categoryId,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Delete category error:", err);
    return NextResponse.json(
      { message: "Gagal menghapus kategori: " + err.message },
      { status: 500 }
    );
  }
}

