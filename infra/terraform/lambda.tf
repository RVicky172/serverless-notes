# One entry per handler in apps/api/src/handlers. The key must match the file name.
# Each entry gets its own zip, function, log group, integration, route and permission.
locals {
  functions = {
    createNote   = { route = "POST /notes" }
    listNotes    = { route = "GET /notes" }
    getNote      = { route = "GET /notes/{id}" }
    deleteNote   = { route = "DELETE /notes/{id}" }
    getUploadUrl = { route = "POST /uploads" }
  }
}

# Zip each esbuild bundle (dist/<name>/index.mjs + source map).
data "archive_file" "fn" {
  for_each = local.functions

  type        = "zip"
  source_dir  = "${local.api_dist}/${each.key}"
  output_path = "${path.module}/build/${each.key}.zip"
}

# ---------- IAM: what the functions are allowed to do ----------

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${local.name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

# Lets the functions write logs to CloudWatch.
resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Least privilege: only the actions the code uses, only on this table and this bucket.
data "aws_iam_policy_document" "app" {
  statement {
    sid = "NotesTable"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:DeleteItem",
    ]
    resources = [aws_dynamodb_table.notes.arn]
  }

  statement {
    sid       = "Attachments"
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.uploads.arn}/*"]
  }
}

resource "aws_iam_role_policy" "app" {
  name   = "app-access"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.app.json
}

# ---------- The functions ----------

resource "aws_cloudwatch_log_group" "fn" {
  for_each = local.functions

  name              = "/aws/lambda/${local.name}-${each.key}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "fn" {
  for_each = local.functions

  function_name    = "${local.name}-${each.key}"
  role             = aws_iam_role.lambda.arn
  runtime          = var.lambda_runtime
  architectures    = ["arm64"] # Graviton: cheaper per GB-second than x86
  handler          = "index.handler"
  filename         = data.archive_file.fn[each.key].output_path
  source_code_hash = data.archive_file.fn[each.key].output_base64sha256 # redeploy when code changes
  timeout          = 10
  memory_size      = 256

  # Structured JSON logs: console.info/error objects become searchable fields.
  logging_config {
    log_format            = "JSON"
    log_group             = aws_cloudwatch_log_group.fn[each.key].name
    application_log_level = "INFO"
    system_log_level      = "WARN"
  }

  environment {
    variables = {
      TABLE_NAME   = aws_dynamodb_table.notes.name
      BUCKET_NAME  = aws_s3_bucket.uploads.bucket
      NODE_OPTIONS = "--enable-source-maps" # stack traces point at the TypeScript source
    }
  }

  depends_on = [aws_iam_role_policy_attachment.logs]
}
