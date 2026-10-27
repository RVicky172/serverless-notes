import { S3Client } from "@aws-sdk/client-s3";

// Created once per Lambda container (outside the handler), so warm invocations reuse it.
// Kept apart from the DynamoDB client so handlers that never touch S3 do not bundle it.

/** S3 client used for presigned URLs and attachment cleanup. */
export const s3 = new S3Client({});
