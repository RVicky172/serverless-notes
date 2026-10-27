#!/usr/bin/env bash
# Builds the React app and publishes it to S3 + CloudFront.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
tf() { terraform -chdir="$ROOT/infra/terraform" output -raw "$1"; }

# Vite bakes the variables into the bundle at build time, so regenerate them first.
bash "$ROOT/scripts/gen-env.sh"
pnpm --dir "$ROOT" --filter @notes/web build

# Hashed assets can be cached forever; index.html must always be revalidated.
aws s3 sync "$ROOT/apps/web/dist" "s3://$(tf site_bucket)" --delete \
  --exclude "*.map" --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"
aws s3 cp "$ROOT/apps/web/dist/index.html" "s3://$(tf site_bucket)/index.html" \
  --cache-control "no-cache"

# MSYS_NO_PATHCONV stops Git Bash on Windows from rewriting "/index.html" into a Windows path.
MSYS_NO_PATHCONV=1 aws cloudfront create-invalidation --paths "/index.html" \
  --distribution-id "$(tf cloudfront_distribution_id)" >/dev/null

echo "Deployed: $(tf site_url)"
