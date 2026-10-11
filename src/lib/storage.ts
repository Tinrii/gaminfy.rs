import "server-only";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

let client: S3Client | undefined;

function r2() {
  const e = env();
  if (!e.R2_ACCOUNT_ID || !e.R2_ACCESS_KEY_ID || !e.R2_SECRET_ACCESS_KEY || !e.R2_BUCKET || !e.R2_PUBLIC_URL) {
    return null;
  }
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: e.R2_ACCESS_KEY_ID, secretAccessKey: e.R2_SECRET_ACCESS_KEY },
  });
  return { client, bucket: e.R2_BUCKET, publicUrl: e.R2_PUBLIC_URL.replace(/\/$/, "") };
}

export function uploadsEnabled(): boolean {
  return r2() !== null;
}

/** Stores a file under a random, never-reused key and returns its public URL. */
export async function putPublicObject(
  folder: "products" | "categories",
  body: Buffer,
  contentType: string,
  extension: string,
): Promise<string> {
  const store = r2();
  if (!store) throw new Error("Image uploads are not configured (R2_* environment variables).");

  const key = `${folder}/${randomUUID()}.${extension}`;
  await store.client.send(
    new PutObjectCommand({
      Bucket: store.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Keys are unique per upload, so the file itself never changes.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${store.publicUrl}/${key}`;
}
