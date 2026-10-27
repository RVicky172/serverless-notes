output "api_url" {
  description = "Base URL of the HTTP API."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "user_pool_id" {
  description = "Cognito user pool id."
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_client_id" {
  description = "Cognito app client id used by the web app."
  value       = aws_cognito_user_pool_client.web.id
}

output "uploads_bucket" {
  description = "Private bucket for note attachments."
  value       = aws_s3_bucket.uploads.bucket
}

output "notes_table" {
  description = "DynamoDB table that stores notes."
  value       = aws_dynamodb_table.notes.name
}

output "site_bucket" {
  description = "Bucket that holds the built React app."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "Used to invalidate the CDN cache after a frontend deploy."
  value       = aws_cloudfront_distribution.site.id
}

output "site_url" {
  description = "Public HTTPS URL of the web app."
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}
