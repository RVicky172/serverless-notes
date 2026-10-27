import { sanitizeFileName } from "@notes/shared";
import { randomUUID } from "node:crypto";

/**
 * Attachment keys are always prefixed with the owner's user id (`{userId}/...`),
 * so a user can only ever be handed URLs for their own files.
 */

/**
 * Builds a unique S3 key for a new attachment.
 *
 * @param userId - Owner of the file.
 * @param fileName - Original file name (sanitized before use).
 * @returns A key such as `{userId}/{uuid}-report.pdf`.
 */
export function buildAttachmentKey(userId: string, fileName: string): string {
  return `${userId}/${randomUUID()}-${sanitizeFileName(fileName)}`;
}

/**
 * Checks that an S3 key lives under a user's prefix.
 *
 * @param key - S3 object key supplied by the client.
 * @param userId - The caller's user id.
 */
export function isOwnedBy(key: string, userId: string): boolean {
  return key.startsWith(`${userId}/`) && !key.includes("..");
}
