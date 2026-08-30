import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { env } from "@/lib/env"

const isR2Configured =
  env.R2_ACCOUNT_ID &&
  env.R2_ACCESS_KEY_ID &&
  env.R2_SECRET_ACCESS_KEY &&
  env.R2_BUCKET_NAME &&
  env.R2_PUBLIC_URL

const r2 = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null

async function uploadLocal(
  key: string,
  body: Buffer,
): Promise<string> {
  const dir = join(process.cwd(), "public", "uploads", key.substring(0, key.lastIndexOf("/")))
  await mkdir(dir, { recursive: true })

  const filepath = join(process.cwd(), "public", "uploads", key)
  await writeFile(filepath, body)

  return `/uploads/${key}`
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  if (!r2) {
    return uploadLocal(key, body)
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  )

  return `${env.R2_PUBLIC_URL}/${key}`
}
