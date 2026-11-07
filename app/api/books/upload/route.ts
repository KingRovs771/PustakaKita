import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAdminFromRequest } from "@/lib/auth";
import { uploadBufferToS3, isS3Configured, BUCKET_NAME } from "@/lib/s3";

export const dynamic = "force-dynamic";

const MAX_BOOK_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role === "principal") {
      return NextResponse.json(
        { message: "Akses Ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only)." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadType = (formData.get("type") as string) || "book";

    if (!file) {
      return NextResponse.json(
        { message: "File tidak ditemukan dalam permintaan unggahan." },
        { status: 400 }
      );
    }

    const isCover = uploadType === "cover";
    const maxSize = isCover ? MAX_COVER_SIZE : MAX_BOOK_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          message: isCover
            ? "Ukuran gambar sampul maksimal 10 MB."
            : "Ukuran file buku maksimal 50 MB.",
        },
        { status: 400 }
      );
    }

    const origName = file.name || (isCover ? "cover.jpg" : "book.pdf");
    const ext = path.extname(origName).toLowerCase();

    if (isCover) {
      const allowedImageExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
      if (!allowedImageExts.includes(ext)) {
        return NextResponse.json(
          { message: "Format gambar sampul harus berupa JPG, PNG, WEBP, atau SVG." },
          { status: 400 }
        );
      }
    } else {
      const allowedBookExts = [".pdf", ".epub", ".txt"];
      if (!allowedBookExts.includes(ext)) {
        return NextResponse.json(
          { message: "Format file buku harus berupa PDF (.pdf), EPUB (.epub), atau Teks (.txt)." },
          { status: 400 }
        );
      }
    }

    const baseName =
      path
        .basename(origName, ext)
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || (isCover ? "sampul" : "buku");

    const uniqueFileName = `${Date.now()}-${baseName}${ext}`;
    const subFolder = isCover ? "covers" : "books";
    const s3Key = `${subFolder}/${uniqueFileName}`;
    const resolvedContentType =
      file.type || (isCover ? "image/jpeg" : "application/pdf");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Unggah langsung ke S3 Object Storage (Neon S3 / Cloudflare R2) bila dikonfigurasi
    let uploadedToS3 = false;
    if (isS3Configured()) {
      try {
        await uploadBufferToS3(s3Key, buffer, resolvedContentType);
        uploadedToS3 = true;
      } catch (s3Err) {
        console.warn("Peringatan unggah S3 (menyimpan ke mirror lokal):", s3Err);
      }
    }

    // 2. Simpan juga salinan cache lokal di public/uploads/ agar pembaca offline/CDN tetap instan
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", subFolder);
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueFileName);
      await writeFile(filePath, buffer);
    } catch {
      // Abaikan bila filesystem read-only pada serverless tertentu selama S3 sukses
    }

    // URL endpoint streaming yang melayani objek langsung dari S3 (atau cache lokal) tanpa kendala CORS PDF.js
    const serveUrl = `/api/books/file?key=${encodeURIComponent(s3Key)}`;

    // Jika file adalah .txt, ekstrak paragraf teksnya agar dapat dibaca langsung di mode teks
    let extractedParagraphs: string[] | undefined = undefined;
    if (!isCover && ext === ".txt") {
      const rawText = buffer.toString("utf-8");
      extractedParagraphs = rawText
        .split(/\r?\n\s*\r?\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    }

    return NextResponse.json({
      message: isCover
        ? `Gambar sampul berhasil diunggah ke ${uploadedToS3 ? `S3 (${BUCKET_NAME})` : "Storage"}!`
        : `File buku berhasil diunggah ke ${uploadedToS3 ? `S3 (${BUCKET_NAME})` : "Storage"}!`,
      url: serveUrl,
      r2Key: s3Key,
      s3Uploaded: uploadedToS3,
      bucket: BUCKET_NAME,
      filename: origName,
      sizeBytes: file.size,
      contentType: resolvedContentType,
      extractedParagraphs,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("File upload error:", err);
    return NextResponse.json(
      { message: "Gagal mengunggah file: " + err.message },
      { status: 500 }
    );
  }
}
