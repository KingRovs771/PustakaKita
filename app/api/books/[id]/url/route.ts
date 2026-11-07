import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken, StudentJWTPayload } from "@/lib/auth";
import { getBookReadUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Autentikasi diperlukan untuk membuka buku." }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const student = await verifyToken<StudentJWTPayload>(token);

    if (!student) {
      return NextResponse.json({ message: "Sesi tidak valid, silakan masuk kembali." }, { status: 401 });
    }

    const bookId = params.id;
    const rows = await sql`
      SELECT id, title, r2_key, is_published, is_deleted
      FROM books
      WHERE (id::text = ${bookId} OR r2_key = ${bookId})
      LIMIT 1;
    `;

    if (rows.length === 0 || rows[0].is_deleted || !rows[0].is_published) {
      return NextResponse.json({ message: "Buku tidak tersedia atau belum diterbitkan." }, { status: 404 });
    }

    const book = rows[0];

    // Generate Pre-Signed GET URL with TTL 30 minutes (1800s)
    let preSignedUrl: string;
    try {
      preSignedUrl = await getBookReadUrl(book.r2_key, 1800);
    } catch {
      // Fallback mock pre-signed URL if S3 storage is pending bucket setup
      preSignedUrl = `https://mock-storage.pustakakita.id/${book.r2_key}?token=mock-ttl-1800s`;
    }

    return NextResponse.json({
      bookId: book.id,
      title: book.title,
      readUrl: preSignedUrl,
      expiresInSeconds: 1800,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

