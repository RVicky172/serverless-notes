# Copy to <stage>.tfvars and run: terraform apply -var-file=<stage>.tfvars
region               = "ap-south-1"
stage                = "prod"
cors_allowed_origins = ["https://d1234abcd.cloudfront.net"]
log_retention_days   = 30
