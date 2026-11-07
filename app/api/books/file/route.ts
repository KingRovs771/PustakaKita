import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getObjectBufferFromS3, isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

function guessContentType(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".epub")) return "application/epub+zip";
  if (lower.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawKey = searchParams.get("key") || "";

    if (!rawKey) {
      return NextResponse.json(
        { message: "Parameter key wajib disertakan." },
        { status: 400 }
      );
    }

    // Normalisasi key agar aman dari path traversal
    const cleanKey = rawKey
      .replace(/^\/+/, "")
      .replace(/^uploads\//, "")
      .replace(/\.\./g, "");

    // 1. Ambil dari S3 Object Storage bila terkonfigurasi
    if (isS3Configured()) {
      try {
        const s3Obj = await getObjectBufferFromS3(cleanKey);
        return new NextResponse(new Uint8Array(s3Obj.buffer), {
          status: 200,
          headers: {
            "Content-Type": s3Obj.contentType || guessContentType(cleanKey),
            "Content-Disposition": "inline",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (s3Err) {
        console.warn("Fallback ke cache lokal untuk objek S3:", cleanKey, s3Err);
      }
    }

    // 2. Fallback ke file cache lokal di public/uploads/
    const localPath = path.join(process.cwd(), "public", "uploads", cleanKey);
    const localBuffer = await readFile(localPath);

    return new NextResponse(new Uint8Array(localBuffer), {
      status: 200,
      headers: {
        "Content-Type": guessContentType(cleanKey),
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "File buku atau sampul tidak ditemukan di S3 maupun cache lokal." },
      { status: 404 }
    );
  }
}

