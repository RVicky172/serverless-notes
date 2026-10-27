#!/usr/bin/env bash
# End-to-end test of auth + API + DynamoDB + S3 using only the AWS CLI, curl and jq.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
tf() { terraform -chdir="$ROOT/infra/terraform" output -raw "$1"; }

API=$(tf api_url)
POOL=$(tf user_pool_id)
CLIENT=$(tf user_pool_client_id)
EMAIL="${SMOKE_EMAIL:-tester@example.com}"
PASSWORD="${SMOKE_PASSWORD:-Test@12345}"
TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

expect_status() { # expect_status <expected> <actual> <step>
  if [[ "$1" != "$2" ]]; then echo "FAIL: $3 returned HTTP $2 (expected $1)" >&2; exit 1; fi
  echo "   ok (HTTP $2)"
}

echo "== 1. Create a confirmed test user"
aws cognito-idp admin-create-user --user-pool-id "$POOL" --username "$EMAIL" \
  --message-action SUPPRESS >/dev/null 2>&1 || true
aws cognito-idp admin-set-user-password --user-pool-id "$POOL" --username "$EMAIL" \
  --password "$PASSWORD" --permanent

echo "== 2. Call the API without a token (expect 401)"
expect_status 401 "$(curl -s -o /dev/null -w "%{http_code}" "$API/notes")" "GET /notes (anonymous)"

echo "== 3. Sign in and get an ID token"
TOKEN=$(aws cognito-idp initiate-auth --client-id "$CLIENT" \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME="$EMAIL",PASSWORD="$PASSWORD" \
  --query 'AuthenticationResult.IdToken' --output text)
AUTH=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

echo "== 4. Ask for a presigned S3 upload URL"
UPLOAD=$(curl -s -X POST "$API/uploads" "${AUTH[@]}" \
  -d '{"fileName":"hello.txt","contentType":"text/plain"}')
UPLOAD_URL=$(jq -r .uploadUrl <<<"$UPLOAD")
KEY=$(jq -r .key <<<"$UPLOAD")

echo "== 5. Upload a file straight to S3"
echo "hello from serverless" >"$TMP_FILE"
expect_status 200 "$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$UPLOAD_URL" \
  -H "Content-Type: text/plain" --data-binary @"$TMP_FILE")" "S3 PUT"

echo "== 6. Validation: create a note without a title (expect 400)"
expect_status 400 "$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/notes" "${AUTH[@]}" \
  -d '{"content":"no title"}')" "POST /notes (invalid)"

echo "== 7. Create a note that points to the file"
NOTE=$(curl -s -X POST "$API/notes" "${AUTH[@]}" \
  -d "{\"title\":\"First note\",\"content\":\"Stored in DynamoDB\",\"attachmentKey\":\"$KEY\"}")
jq . <<<"$NOTE"
ID=$(jq -r .noteId <<<"$NOTE")

echo "== 8. List notes"
curl -s "$API/notes" "${AUTH[@]}" | jq .

echo "== 9. Get one note (includes a temporary download URL)"
curl -s "$API/notes/$ID" "${AUTH[@]}" | jq .

echo "== 10. Delete the note (also deletes the S3 file)"
expect_status 204 "$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API/notes/$ID" \
  "${AUTH[@]}")" "DELETE /notes/{id}"

echo "All smoke tests passed."
