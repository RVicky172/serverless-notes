import { z } from "zod";

/** Validation limits for attachment uploads. */
export const UPLOAD_LIMITS = {
  fileNameMaxLength: 255,
  contentTypeMaxLength: 255,
} as const;

/** Content type used when the browser cannot detect one. */
export const DEFAULT_CONTENT_TYPE = "application/octet-stream";

/** Request body schema for `POST /uploads`. */
export const uploadUrlRequestSchema = z.object({
  fileName: z.string().trim().min(1, "fileName is required").max(UPLOAD_LIMITS.fileNameMaxLength),
  contentType: z
    .string()
    .max(UPLOAD_LIMITS.contentTypeMaxLength)
    .regex(/^[\w.+-]+\/[\w.+-]+$/, "contentType must be a MIME type such as text/plain"),
});

/** Body of `POST /uploads`. */
export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;

/** Response of `POST /uploads`. */
export interface UploadUrlResponse {
  /** Presigned S3 PUT URL. Upload with the same `Content-Type` that was requested. */
  uploadUrl: string;
  /** S3 object key to store as the note's `attachmentKey`. */
  key: string;
}

/**
 * Replaces every character that is not safe in an S3 key with `_`.
 *
 * @param fileName - Original file name chosen by the user.
 * @returns A file name containing only letters, digits, `.`, `_` and `-`.
 * @example
 * ```ts
 * sanitizeFileName("my report (1).pdf"); // "my_report__1_.pdf"
 * ```
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}
