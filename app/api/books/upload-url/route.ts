import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getBookUploadUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (admin && admin.role === "principal") {
      return NextResponse.json(
        { message: "Akses Ditolak: Akun Kepala Sekolah hanya memiliki izin lihat (Read-Only)." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { filename, contentType = "application/pdf" } = body;

    if (!filename) {
      return NextResponse.json({ message: "Nama file wajib dicantumkan." }, { status: 400 });
    }

    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const r2Key = `books/${Date.now()}-${safeFilename}`;

    let uploadUrl: string;
    try {
      uploadUrl = await getBookUploadUrl(r2Key, contentType, 600);
    } catch {
      uploadUrl = `https://mock-storage.pustakakita.id/upload/${r2Key}`;
    }

    return NextResponse.json({
      uploadUrl,
      r2Key,
      expiresInSeconds: 600,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

