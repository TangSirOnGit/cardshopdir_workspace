import { z } from "zod"
import { hasAllowedProtocol, isOwnUploadUrl } from "@/lib/safe-url"

/**
 * Field rules for a product submission, shared by the create and resubmit
 * routes.
 *
 * The `max()` values mirror the column widths in lib/db/schema.ts: without
 * them an over-long field reaches Postgres and surfaces as an unhandled 22001,
 * i.e. a 500 for what is really a 400.
 */
export const submissionFields = {
  name: z.string().trim().min(1, "Name is required").max(100),
  tagline: z.string().trim().min(1, "Tagline is required").max(200),
  websiteUrl: z
    .string()
    .trim()
    .min(1, "Website URL is required")
    .max(2048)
    .refine(hasAllowedProtocol, "Website URL must be http(s)"),
  thumbnailUrl: z
    .string()
    .trim()
    .min(1, "Thumbnail is required")
    .max(2048)
    .refine(isOwnUploadUrl, "Thumbnail must be uploaded through /api/upload"),
  description: z.string().max(20_000).optional().nullable(),
}

export const createSubmissionSchema = z.object({
  ...submissionFields,
  tier: z.enum(["free", "boost", "highlight"]).optional(),
})

/** Every field optional — a revision may change only what the admin flagged. */
export const resubmitSchema = z.object({
  name: submissionFields.name.optional(),
  tagline: submissionFields.tagline.optional(),
  websiteUrl: submissionFields.websiteUrl.optional(),
  thumbnailUrl: submissionFields.thumbnailUrl.optional(),
  description: submissionFields.description,
})
