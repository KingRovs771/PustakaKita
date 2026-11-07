import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin || !admin.adminId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, username, full_name, is_active
      FROM admin_users
      WHERE id = ${admin.adminId}
      LIMIT 1;
    `;

    if (rows.length === 0 || !rows[0].is_active) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = rows[0];
    let resolvedFullName = user.full_name;
    try {
      const schoolRows = await sql`
        SELECT librarian_name, principal_name
        FROM school_settings
        WHERE id = 1
        LIMIT 1;
      `;
      if (schoolRows.length > 0 && schoolRows[0].librarian_name) {
        resolvedFullName = schoolRows[0].librarian_name;
      }
    } catch {}

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: resolvedFullName,
        role: "librarian",
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

