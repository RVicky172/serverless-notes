import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { UploadUrlRequest, UploadUrlResponse } from "@notes/shared";
import { buildAttachmentKey } from "../lib/attachmentKeys";
import { config } from "../lib/config";
import { s3 } from "../lib/s3";

/** Attachment storage in the private S3 uploads bucket. */

/**
 * Creates a presigned PUT URL so the browser can upload straight to S3.
 * The file never passes through API Gateway or Lambda (no 10 MB payload limit).
 *
 * @param userId - Owner of the upload.
 * @param request - File name and content type. The browser must upload with this exact `Content-Type`.
 */
export async function createUploadUrl(
  userId: string,
  request: UploadUrlRequest,
): Promise<UploadUrlResponse> {
  const key = buildAttachmentKey(userId, request.fileName);
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: config.bucketName, Key: key, ContentType: request.contentType }),
    { expiresIn: config.presignedUrlTtlSeconds },
  );
  return { uploadUrl, key };
}

/**
 * Creates a short-lived presigned GET URL for an attachment.
 *
 * @param key - S3 object key of the attachment.
 */
export function createDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: config.bucketName, Key: key }), {
    expiresIn: config.presignedUrlTtlSeconds,
  });
}

/**
 * Deletes an attachment from S3.
 *
 * @param key - S3 object key of the attachment.
 */
export async function deleteAttachment(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: key }));
}
