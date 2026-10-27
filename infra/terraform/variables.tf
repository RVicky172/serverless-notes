variable "region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "ap-south-1" # Mumbai
}

variable "project_name" {
  description = "Prefix for every resource name."
  type        = string
  default     = "serverless-notes"

  validation {
    condition     = can(regex("^[a-z0-9-]{3,30}$", var.project_name))
    error_message = "project_name must be 3-30 lowercase letters, digits or hyphens (it is used in S3 bucket names)."
  }
}

variable "stage" {
  description = "Deployment stage, for example dev or prod. Lets several copies live side by side."
  type        = string
  default     = "dev"

  validation {
    condition     = can(regex("^[a-z0-9]{2,10}$", var.stage))
    error_message = "stage must be 2-10 lowercase letters or digits."
  }
}

variable "lambda_runtime" {
  description = "Lambda Node.js runtime. Keep in sync with the esbuild target in apps/api/scripts/build.ts."
  type        = string
  default     = "nodejs24.x"
}

variable "cors_allowed_origins" {
  description = "Origins allowed to call the API and the uploads bucket. Restrict to your CloudFront URL in production."
  type        = list(string)
  default     = ["*"]
}

variable "log_retention_days" {
  description = "How long CloudWatch keeps Lambda logs."
  type        = number
  default     = 7
}
