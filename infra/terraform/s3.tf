# Private bucket that stores note attachments.
resource "aws_s3_bucket" "uploads" {
  bucket        = "${local.name}-uploads-${local.account_id}"
  force_destroy = true # lets `terraform destroy` delete it even if it has files
}

# Guarantees the bucket can never be made public by mistake.
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# The browser PUTs and GETs files directly with presigned URLs, so S3 must allow
# cross-origin requests from the web app.
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_methods = ["GET", "PUT"]
    allowed_origins = var.cors_allowed_origins
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}

# Clean up uploads that were started but never finished.
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "abort-incomplete-multipart-uploads"
    status = "Enabled"
    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}
