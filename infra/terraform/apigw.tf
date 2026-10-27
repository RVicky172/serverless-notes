resource "aws_apigatewayv2_api" "http" {
  name          = "${local.name}-api"
  protocol_type = "HTTP"

  # Lets the React app (a different origin) call the API from the browser.
  cors_configuration {
    allow_origins = var.cors_allowed_origins
    allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers = ["authorization", "content-type"]
    max_age       = 300
  }
}

# The JWT authorizer: API Gateway verifies the Cognito ID token BEFORE invoking Lambda.
# Invalid or missing tokens get a 401 and never reach (or bill) your functions.
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.http.id
  name             = "cognito-jwt"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.web.id]
    issuer   = "https://${aws_cognito_user_pool.this.endpoint}"
  }
}

resource "aws_apigatewayv2_integration" "fn" {
  for_each = local.functions

  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.fn[each.key].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "fn" {
  for_each = local.functions

  api_id             = aws_apigatewayv2_api.http.id
  route_key          = each.value.route
  target             = "integrations/${aws_apigatewayv2_integration.fn[each.key].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  # Basic protection against runaway clients (and runaway bills).
  default_route_settings {
    throttling_burst_limit = 50
    throttling_rate_limit  = 20
  }
}

# Without this, API Gateway is not allowed to invoke the functions (you would see 500s).
resource "aws_lambda_permission" "apigw" {
  for_each = local.functions

  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fn[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
