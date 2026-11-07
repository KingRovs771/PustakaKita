import crypto from "crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const PEPPER = process.env.NISN_PEPPER || "default_local_dev_pepper_do_not_use_in_prod";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_local_jwt_secret_must_be_32_bytes_long"
);

// Rust WebAssembly Cryptography Acceleration (PRD OPSI A)
let wasmCrypto: {
  hash_nisn: (nisn: string, pepper: string) => string;
  verify_nisn_hash: (nisn: string, pepper: string, hash: string) => boolean;
  validate_nisn_format: (nisn: string) => boolean;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  wasmCrypto = require("./wasm_crypto/pustakakita_crypto.js");
} catch {
  // Graceful fallback to pure Node.js crypto if Wasm is not available
  wasmCrypto = null;
}

/**
 * Privacy-Preserving NISN Hash: HMAC-SHA256(NISN, NISN_PEPPER)
 * Executed via Rust WebAssembly with constant-time security.
 * Never stores raw NISN in database, logs, or JWT claims.
 */
export function hashNISN(rawNisn: string): string {
  const normalized = rawNisn.replace(/\D/g, "").slice(0, 10);
  if (wasmCrypto) {
    try {
      return wasmCrypto.hash_nisn(normalized, PEPPER);
    } catch {
      // fallback if wasm raises validation error
    }
  }
  return crypto.createHmac("sha256", PEPPER).update(normalized).digest("hex");
}

/**
 * Verify NISN Hash using constant-time comparison
 */
export function verifyNISN(rawNisn: string, expectedHash: string): boolean {
  const normalized = rawNisn.replace(/\D/g, "").slice(0, 10);
  if (wasmCrypto) {
    try {
      return wasmCrypto.verify_nisn_hash(normalized, PEPPER, expectedHash);
    } catch {
      // fallback
    }
  }
  const computed = hashNISN(normalized);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedHash));
}

/**
 * Hash PIN using bcrypt (Cost factor 10)
 */
export async function hashPIN(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(pin, salt);
}

/**
 * Verify PIN with bcrypt hash
 */
export async function verifyPIN(pin: string, hashedPin: string): Promise<boolean> {
  return await bcrypt.compare(pin, hashedPin);
}

export interface StudentJWTPayload {
  nisnHash: string;
  name: string;
  grade: "SD" | "SMP" | "SMA";
  className: string;
  role: "student";
}

export interface AdminJWTPayload {
  adminId: string;
  username: string;
  role: "librarian" | "principal";
}

/**
 * Generate Access Token (7 days for persistent session)
 */
export async function signAccessToken(payload: StudentJWTPayload | AdminJWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Generate Refresh Token (7 days)
 */
export async function signRefreshToken(nisnHashOrAdminId: string): Promise<string> {
  return await new SignJWT({ sub: nisnHashOrAdminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify JWT Token
 */
export async function verifyToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as T;
  } catch {
    return null;
  }
}

/**
 * Extract and verify Admin payload from Authorization header or cookie
 */
export async function getAdminFromRequest(req: Request): Promise<AdminJWTPayload | null> {
  try {
    const authHeader = req.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match =
        cookieHeader.match(/accessToken=([^;]+)/) ||
        cookieHeader.match(/admin_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) return null;
    const payload = await verifyToken<AdminJWTPayload>(token);
    if (!payload || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

