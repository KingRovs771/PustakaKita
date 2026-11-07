import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/books: Ambil daftar buku dengan filter kategori, jenjang, pencarian, dan pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "semua";
    const grade = searchParams.get("grade") || "ALL";
    const query = searchParams.get("q") || "";
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    // Base query filter
    let booksQuery;

    if (query.trim().length >= 3) {
      // Full-Text Search via PostgreSQL GIN tsvector
      const formattedQ = query.trim().split(/\s+/).join(" & ");
      booksQuery = await sql`
        SELECT 
          b.id, b.title, b.author, b.isbn, b.r2_key, b.cover_url, b.source_type,
          b.grade_level, b.total_pages, b.estimated_read_minutes, b.vocabulary_level,
          b.synopsis, b.is_published, b.created_at,
          c.name as category_name, c.color_hex as category_color
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.is_deleted = false AND b.is_published = true
          AND b.search_vector @@ to_tsquery('indonesian', ${formattedQ})
          AND (${grade} = 'ALL' OR b.grade_level = ${grade})
        ORDER BY b.created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `;
    } else {
      booksQuery = await sql`
        SELECT 
          b.id, b.title, b.author, b.isbn, b.r2_key, b.cover_url, b.source_type,
          b.grade_level, b.total_pages, b.estimated_read_minutes, b.vocabulary_level,
          b.synopsis, b.is_published, b.created_at,
          c.name as category_name, c.color_hex as category_color
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.is_deleted = false AND b.is_published = true
          AND (${category} = 'semua' OR LOWER(c.name) LIKE LOWER(${`%${category}%`}))
          AND (${grade} = 'ALL' OR b.grade_level = ${grade})
        ORDER BY b.created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `;
    }

    const categoriesQuery = await sql`
      SELECT id, name, icon, color_hex, sort_order
      FROM categories
      ORDER BY sort_order ASC;
    `;

    return NextResponse.json({
      books: booksQuery,
      categories: categoriesQuery,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Fetch books error:", err);
    return NextResponse.json(
      { message: "Gagal memuat katalog buku dari database." },
      { status: 500 }
    );
  }
}

// POST /api/books: Admin Pustakawan menerbitkan buku baru
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role === "principal") {
      return NextResponse.json(
        { message: "Akses ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only)." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      author,
      categoryId,
      categoryName,
      isbn,
      r2Key,
      fileUrl,
      fileSizeBytes,
      coverUrl,
      sourceType,
      gradeLevel,
      totalPages,
      estimatedReadMinutes,
      vocabularyLevel,
      synopsis,
    } = body;

    if (!title || !author || !gradeLevel || !totalPages) {
      return NextResponse.json(
        { message: "Judul, pengarang, jenjang, dan jumlah halaman wajib diisi." },
        { status: 400 }
      );
    }

    // Resolve categoryId if categoryName provided
    let targetCatId: string | null = categoryId || null;
    if (!targetCatId && categoryName) {
      const catRows = await sql`
        SELECT id FROM categories WHERE LOWER(name) = LOWER(${categoryName}) LIMIT 1;
      `;
      if (catRows.length > 0) {
        targetCatId = catRows[0].id;
      }
    }

    // Resolve uploader admin id
    let uploaderId = admin?.adminId || null;
    if (!uploaderId) {
      const anyAdmin = await sql`SELECT id FROM admin_users WHERE role = 'librarian' LIMIT 1;`;
      if (anyAdmin.length > 0) {
        uploaderId = anyAdmin[0].id;
      }
    }

    const finalR2Key =
      r2Key ||
      fileUrl ||
      `books/${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;

    const inserted = await sql`
      INSERT INTO books (
        title, author, category_id, isbn, r2_key, cover_url, source_type,
        grade_level, total_pages, file_size_bytes, estimated_read_minutes, vocabulary_level,
        synopsis, is_published, uploaded_by
      )
      VALUES (
        ${title}, ${author}, ${targetCatId}, ${isbn || null}, ${finalR2Key},
        ${coverUrl || null}, ${sourceType || "bse"}, ${gradeLevel},
        ${parseInt(totalPages, 10)}, ${parseInt(String(fileSizeBytes || 0), 10)},
        ${parseInt(estimatedReadMinutes || "30", 10)},
        ${vocabularyLevel || "Menengah"}, ${synopsis || ""}, true, ${uploaderId}
      )
      RETURNING id, title, author, r2_key, is_published, grade_level, total_pages, cover_url, file_size_bytes;
    `;

    return NextResponse.json({
      message: "Buku berhasil diterbitkan ke katalog sekolah.",
      book: inserted[0],
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create book error:", err);
    return NextResponse.json(
      { message: "Gagal menyimpan buku baru ke database: " + err.message },
      { status: 500 }
    );
  }
}

