resource "aws_cognito_user_pool" "this" {
  name                     = "${local.name}-users"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  deletion_protection      = "INACTIVE" # lets `terraform destroy` remove it (learning project)

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

# The "app client" the React app (and the CLI smoke test) signs in with.
resource "aws_cognito_user_pool_client" "web" {
  name            = "${local.name}-web"
  user_pool_id    = aws_cognito_user_pool.this.id
  generate_secret = false # browser apps cannot keep a secret

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",      # used by the React app (password never leaves the browser)
    "ALLOW_USER_PASSWORD_AUTH", # lets scripts/smoke-test.sh sign in from the CLI
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  # Do not reveal whether an email is registered.
  prevent_user_existence_errors = "ENABLED"

  id_token_validity      = 60 # minutes
  access_token_validity  = 60 # minutes
  refresh_token_validity = 30 # days
  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }
}
