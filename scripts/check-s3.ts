import { s3Client, BUCKET_NAME } from "../lib/s3";
import { ListBucketsCommand, CreateBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function checkS3() {
  console.log(`Checking S3 connection to ${process.env.AWS_ENDPOINT_URL_S3}...`);
  try {
    const listRes = await s3Client.send(new ListBucketsCommand({}));
    const buckets = listRes.Buckets?.map((b) => b.Name) || [];
    console.log("Available Buckets:", buckets);

    if (!buckets.includes(BUCKET_NAME)) {
      console.log(`Bucket "${BUCKET_NAME}" does not exist yet. Creating...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`✓ Bucket "${BUCKET_NAME}" created successfully.`);
    } else {
      console.log(`✓ Bucket "${BUCKET_NAME}" is ready.`);
    }

    const objects = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME }));
    console.log(`Current objects in bucket: ${objects.KeyCount || 0}`);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("S3 test error:", error.message);
  }
}

checkS3();
