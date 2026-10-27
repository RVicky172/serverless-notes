# @notes/api

AWS Lambda handlers for the notes REST API (API Gateway HTTP API, payload v2.0).

```
src/handlers/   one file per route, each exporting `handler`
src/services/   notesRepository (DynamoDB) and attachments (S3)
src/lib/        config, SDK clients, errors, HTTP helpers, createHandler wrapper
scripts/build.ts  esbuild: src/handlers/<name>.ts → dist/<name>/index.mjs
```

```bash
pnpm --filter @notes/api build   # bundle for Terraform
pnpm --filter @notes/api test    # unit tests with mocked AWS SDK
```

To add a route, create `src/handlers/<name>.ts`, then add one line to `local.functions` in `infra/terraform/lambda.tf`.
