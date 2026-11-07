import { neon, neonConfig } from "@neondatabase/serverless";

// Optional: Enable connection caching if available
neonConfig.fetchConnectionCache = true;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("WARNING: DATABASE_URL is not set. Database queries will fail.");
}

// Neon serverless SQL driver (tagged template literal)
export const sql = neon(databaseUrl || "");

