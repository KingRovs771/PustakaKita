import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Berhasil keluar dari akun." });
  response.cookies.delete("accessToken");
  response.cookies.delete("admin_token");
  response.cookies.delete("refreshToken");
  return response;
}
