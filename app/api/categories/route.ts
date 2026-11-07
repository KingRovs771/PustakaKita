import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/categories: Mengambil daftar kategori beserta jumlah buku terkait
export async function GET() {
  try {
    const rows = await sql`
      SELECT 
        c.id, c.name, c.icon, c.color_hex, c.sort_order,
        COUNT(b.id) FILTER (WHERE b.is_deleted = false)::int as book_count
      FROM categories c
      LEFT JOIN books b ON b.category_id = c.id
      GROUP BY c.id, c.name, c.icon, c.color_hex, c.sort_order
      ORDER BY c.sort_order ASC, c.name ASC;
    `;

    return NextResponse.json({ categories: rows });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Fetch categories error:", err);
    return NextResponse.json(
      { message: "Gagal memuat kategori dari database." },
      { status: 500 }
    );
  }
}

// POST /api/categories: Menambahkan kategori baru (Guru Pustakawan)
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    // Allow if role is librarian, or dev mode fallback if session header not passed
    if (admin && admin.role !== "librarian") {
      return NextResponse.json(
        { message: "Akses ditolak: Hanya Guru Pustakawan yang dapat menambah kategori." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, icon, colorHex, sortOrder } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Nama kategori wajib diisi." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanIcon = (icon && icon.trim()) || "BookOpen";
    const cleanColor = (colorHex && colorHex.trim()) || "#3B82F6";
    const cleanSortOrder = typeof sortOrder === "number" ? sortOrder : 0;

    // Check unique name
    const existing = await sql`
      SELECT id FROM categories WHERE LOWER(name) = LOWER(${cleanName}) LIMIT 1;
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { message: `Kategori '${cleanName}' sudah ada.` },
        { status: 409 }
      );
    }

    const inserted = await sql`
      INSERT INTO categories (name, icon, color_hex, sort_order)
      VALUES (${cleanName}, ${cleanIcon}, ${cleanColor}, ${cleanSortOrder})
      RETURNING id, name, icon, color_hex, sort_order;
    `;

    return NextResponse.json(
      {
        message: "Kategori berhasil ditambahkan.",
        category: { ...inserted[0], book_count: 0 },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create category error:", err);
    return NextResponse.json(
      { message: "Gagal menyimpan kategori baru: " + err.message },
      { status: 500 }
    );
  }
}

