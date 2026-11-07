import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const region = process.env.AWS_REGION || "ap-southeast-1";

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || "pustakakita";

export function isS3Configured(): boolean {
  return Boolean(endpoint && accessKeyId && secretAccessKey);
}

export const s3Client = new S3Client({
  endpoint: endpoint || "https://s3.ap-southeast-1.amazonaws.com",
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true, // S3 compatible storage (Neon Object Storage / Cloudflare R2 / MinIO)
});

/**
 * Upload a Buffer directly to S3 / R2 bucket
 */
export async function uploadBufferToS3(
  r2Key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ key: string; bucket: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: r2Key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3Client.send(command);
  return {
    key: r2Key,
    bucket: BUCKET_NAME,
  };
}

/**
 * Download an object from S3 / R2 as a Buffer for streaming to PDF.js / Next Image
 */
export async function getObjectBufferFromS3(
  r2Key: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: r2Key,
  });
  const res = await s3Client.send(command);
  if (!res.Body) {
    throw new Error("Objek S3 kosong.");
  }
  const byteArray = await res.Body.transformToByteArray();
  return {
    buffer: Buffer.from(byteArray),
    contentType: res.ContentType || "application/octet-stream",
  };
}

/**
 * Generate Pre-Signed URL for client reading a book (TTL: 30 minutes / 1800 seconds)
 */
export async function getBookReadUrl(
  r2Key: string,
  expiresInSeconds = 1800
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: r2Key,
    ResponseContentDisposition: "inline",
  });
  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generate Pre-Signed URL for admin uploading a book file (TTL: 10 minutes / 600 seconds)
 */
export async function getBookUploadUrl(
  r2Key: string,
  contentType: string,
  expiresInSeconds = 600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: r2Key,
    ContentType: contentType,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Verify that an uploaded file exists and retrieve its size & content-type
 */
export async function verifyBookObject(r2Key: string) {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: r2Key,
  });
  const res = await s3Client.send(command);
  return {
    contentLength: res.ContentLength || 0,
    contentType: res.ContentType,
    lastModified: res.LastModified,
  };
}
