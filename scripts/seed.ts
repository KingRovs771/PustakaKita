import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "crypto";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(dbUrl);
const pepper = process.env.NISN_PEPPER || "";

function hashNISN(nisn: string) {
  return crypto.createHmac("sha256", pepper).update(nisn).digest("hex");
}

async function seed() {
  console.log("Seeding test accounts into Neon...");

  // 1. Seed Student: Budi Santoso (NISN: 0094827165, PIN: 123456)
  const budiNisnHash = hashNISN("0094827165");
  const budiPinHash = await bcrypt.hash("123456", 10);

  await sql`
    INSERT INTO students (nisn_hash, pin_hash, full_name, grade, class_name, is_active, created_at)
    VALUES (${budiNisnHash}, ${budiPinHash}, 'Budi Santoso', 8, 'Kelas 8A', true, NOW())
    ON CONFLICT (nisn_hash) DO NOTHING;
  `;
  console.log("✓ Student 'Budi Santoso' seeded (NISN: 0094827165, PIN: 123456).");

  // 2. Seed Admin: Pustakawan & Kepala Sekolah (Password: sekolah123)
  const adminPassHash = await bcrypt.hash("sekolah123", 10);

  await sql`
    INSERT INTO admin_users (username, password_hash, role, full_name, is_active)
    VALUES 
      ('pustakawan', ${adminPassHash}, 'librarian', 'Ibu Rina Kusuma, S.Pd', true),
      ('kepsek', ${adminPassHash}, 'principal', 'Drs. Hendra Wijaya, M.Pd', true)
    ON CONFLICT (username) DO NOTHING;
  `;
  console.log("✓ Admin users seeded ('pustakawan' & 'kepsek' with password 'sekolah123').");

  // 3. Seed Books from catalog
  const categories = await sql`SELECT id, name FROM categories`;
  const catMap: Record<string, string> = {};
  categories.forEach((c) => {
    catMap[c.name.toLowerCase()] = c.id;
  });

  const fiksiId = catMap["fiksi & sastra"];
  const sainsId = catMap["sains & alam"];
  const sejarahId = catMap["sejarah nusantara"];
  const komikId = catMap["komik edukasi"];

  await sql`
    INSERT INTO books (
      title, author, category_id, isbn, r2_key, cover_url, source_type, grade_level, 
      total_pages, estimated_read_minutes, vocabulary_level, synopsis, is_published
    )
    VALUES 
      (
        'Laskar Pelangi: Jejak Mimpi Anak Pulau',
        'Andrea Hirata',
        ${fiksiId},
        '978-602-291-662-8',
        'books/laskar-pelangi.pdf',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
        'bse',
        'SMP',
        24,
        45,
        'Menengah (SMP)',
        'Kisah inspiratif sepuluh anak di Pulau Belitung yang berjuang menempuh pendidikan di sekolah sederhana.',
        true
      ),
      (
        'Eksplorasi Sains: Rahasia Ekosistem Laut Indonesia',
        'Dr. Pratiwi Sudarmono',
        ${sainsId},
        '978-602-427-311-5',
        'books/ekosistem-laut.pdf',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80',
        'bse',
        'SMP',
        24,
        35,
        'Ilmiah Populer',
        'Selami keindahan Segitiga Terumbu Karang dunia yang berada tepat di perairan Nusantara!',
        true
      ),
      (
        'Jejak Kapal Pinisi & Jalur Rempah Nusantara',
        'Prof. Bambang Purwanto',
        ${sejarahId},
        '978-602-244-890-1',
        'books/jalur-rempah.pdf',
        'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
        'bse',
        'SMA',
        30,
        50,
        'Lanjutan (SMA)',
        'Mengungkap bagaimana rempah-rempah Nusantara menggerakkan peradaban maritim dunia.',
        true
      ),
      (
        'Komik Sains: Petualangan Detektif Angka & Gravitasi',
        'Kak Riko',
        ${komikId},
        '978-623-881-102-4',
        'books/komik-gravitasi.pdf',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
        'internal',
        'SD',
        18,
        20,
        'Mudah (SD)',
        'Mengapa buah mangga selalu jatuh ke bawah? Ikuti serunya petualangan fisika bergambar!',
        true
      )
    ON CONFLICT (r2_key) DO NOTHING;
  `;
  console.log("✓ 4 Sample books seeded into Neon database.");

  console.log("\nAll initial data seeded successfully!");
}

seed().catch(console.error);

