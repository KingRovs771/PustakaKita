import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("ERROR: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runMigration() {
  console.log("Connecting to Neon Postgres...");
  const schemaPath = path.join(process.cwd(), "lib", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  // Split by statements (or execute directly if supported)
  const statements = schemaSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} schema statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await sql.query(stmt);
      console.log(`✓ Statement ${i + 1}/${statements.length} executed successfully.`);
    } catch (err: unknown) {
      const error = err as Error;
      // Skip if extension already exists or language error
      if (error.message?.includes("already exists") || error.message?.includes("extension")) {
        console.log(`- Statement ${i + 1} skipped or already exists: ${error.message}`);
      } else {
        console.error(`✗ Error on statement ${i + 1}:`, error.message);
      }
    }
  }

  // Seed default categories if empty
  console.log("Seeding default categories...");
  const existingCategories = await sql`SELECT count(*) FROM categories`;
  if (parseInt(existingCategories[0].count) === 0) {
    await sql`
      INSERT INTO categories (name, icon, color_hex, sort_order) VALUES
      ('Fiksi & Sastra', 'Sparkles', '#7C3AED', 1),
      ('Sains & Alam', 'Atom', '#0284C7', 2),
      ('Sejarah Nusantara', 'Compass', '#B45309', 3),
      ('Komik Edukasi', 'Smile', '#E11D48', 4);
    `;
    console.log("✓ Categories seeded successfully.");
  } else {
    console.log("- Categories already present, skipping seed.");
  }

  console.log("\nMigration completed successfully!");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
