provider "aws" {
  region = var.region

  # Same tags on every resource: makes cost and ownership easy to see in billing.
  default_tags {
    tags = {
      Project = var.project_name
      Stage   = var.stage
      Managed = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  # Prefix for every resource name, for example "serverless-notes-dev".
  name       = "${var.project_name}-${var.stage}"
  account_id = data.aws_caller_identity.current.account_id

  # Output of `pnpm --filter @notes/api build`: one folder per handler.
  api_dist = "${path.module}/../../apps/api/dist"
}
