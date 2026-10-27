#!/usr/bin/env bash
# Writes apps/web/.env.local from the Terraform outputs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
tf() { terraform -chdir="$ROOT/infra/terraform" output -raw "$1"; }

cat > "$ROOT/apps/web/.env.local" <<ENV
VITE_API_URL=$(tf api_url)
VITE_USER_POOL_ID=$(tf user_pool_id)
VITE_CLIENT_ID=$(tf user_pool_client_id)
ENV

echo "Wrote apps/web/.env.local"
