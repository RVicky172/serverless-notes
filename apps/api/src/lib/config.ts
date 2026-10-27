/**
 * Reads a required environment variable.
 *
 * @param name - Variable name, for example `TABLE_NAME`.
 * @returns The variable's value.
 * @throws {Error} When the variable is missing or empty (a deployment mistake, so fail fast).
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

/** Runtime configuration. Values are injected by Terraform (see `infra/terraform/lambda.tf`). */
export const config = {
  /** DynamoDB table that stores notes. */
  tableName: requireEnv("TABLE_NAME"),
  /** Private S3 bucket that stores attachments. */
  bucketName: requireEnv("BUCKET_NAME"),
  /** Lifetime of presigned upload and download URLs. */
  presignedUrlTtlSeconds: 300,
} as const;
