import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/books/[id]: Detail buku berdasarkan UUID atau R2 key
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;
    const rows = await sql`
      SELECT 
        b.id, b.title, b.author, b.isbn, b.r2_key, b.cover_url, b.source_type,
        b.grade_level, b.total_pages, b.estimated_read_minutes, b.vocabulary_level,
        b.synopsis, b.is_published, b.created_at,
        c.id as category_id, c.name as category_name, c.color_hex as category_color
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE (b.id::text = ${bookId} OR b.r2_key = ${bookId}) AND b.is_deleted = false
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ message: "Buku tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ book: rows[0] });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// PUT /api/books/[id]: Mengubah data buku (Update) oleh Guru Pustakawan
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role === "principal") {
      return NextResponse.json(
        { message: "Akses ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only)." },
        { status: 403 }
      );
    }

    const bookId = params.id;
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
      isPublished,
    } = body;

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

    const nextR2Key = r2Key || fileUrl || null;

    const updated = await sql`
      UPDATE books
      SET
        title = COALESCE(${title}, title),
        author = COALESCE(${author}, author),
        category_id = COALESCE(${targetCatId}, category_id),
        isbn = COALESCE(${isbn}, isbn),
        r2_key = COALESCE(${nextR2Key}, r2_key),
        file_size_bytes = COALESCE(${fileSizeBytes !== undefined ? parseInt(String(fileSizeBytes), 10) : null}, file_size_bytes),
        cover_url = COALESCE(${coverUrl}, cover_url),
        source_type = COALESCE(${sourceType}, source_type),
        grade_level = COALESCE(${gradeLevel}, grade_level),
        total_pages = COALESCE(${totalPages ? parseInt(totalPages, 10) : null}, total_pages),
        estimated_read_minutes = COALESCE(${estimatedReadMinutes ? parseInt(estimatedReadMinutes, 10) : null}, estimated_read_minutes),
        vocabulary_level = COALESCE(${vocabularyLevel}, vocabulary_level),
        synopsis = COALESCE(${synopsis}, synopsis),
        is_published = COALESCE(${isPublished !== undefined ? Boolean(isPublished) : null}, is_published)
      WHERE (id::text = ${bookId} OR r2_key = ${bookId}) AND is_deleted = false
      RETURNING id, title, author, r2_key, grade_level, total_pages, cover_url, is_published;
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { message: "Buku tidak ditemukan untuk diperbarui." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Buku berhasil diperbarui.",
      book: updated[0],
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Update book error:", err);
    return NextResponse.json(
      { message: "Gagal memperbarui buku: " + err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id]: Soft-delete buku oleh Guru Pustakawan
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role === "principal") {
      return NextResponse.json(
        { message: "Akses ditolak: Hanya pustakawan yang dapat menghapus buku." },
        { status: 403 }
      );
    }

    const bookId = params.id;
    await sql`
      UPDATE books
      SET is_deleted = true, is_published = false
      WHERE (id::text = ${bookId} OR r2_key = ${bookId});
    `;

    return NextResponse.json({ message: "Buku berhasil dinonaktifkan dari katalog." });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
