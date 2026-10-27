resource "aws_dynamodb_table" "notes" {
  name         = "${local.name}-notes"
  billing_mode = "PAY_PER_REQUEST" # no capacity planning, pay per request
  hash_key     = "userId"          # partition key: all of a user's notes live together
  range_key    = "noteId"          # sort key: time-ordered UUIDv7, so Query returns notes by age

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "noteId"
    type = "S"
  }
}
