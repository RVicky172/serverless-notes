# Architecture

## Request flow

1. The browser loads the React app from **CloudFront**. The files live in a private S3 bucket that only CloudFront can read (Origin Access Control).
2. The user signs in with **Cognito** through Amplify Auth (SRP, so the password never leaves the browser). Cognito returns an ID token (a JWT, valid for 60 minutes) and a refresh token. Amplify refreshes the ID token automatically.
3. The app calls **API Gateway** with `Authorization: Bearer <ID token>`.
4. The **JWT authorizer** checks the token's signature, issuer, audience and expiry against Cognito's public keys. An invalid token gets a 401 and Lambda never runs, so it is never billed.
5. API Gateway invokes the route's **Lambda** function with the verified claims. `sub` is the unique user id.
6. Lambda reads or writes **DynamoDB**, always using the `userId` from the token and never from the request body.
7. For files, Lambda returns a **presigned S3 URL**, and the browser uploads or downloads directly, bypassing API Gateway's 10 MB payload limit.

> **ID token, not access token.** The authorizer checks the `aud` claim against the app client id. Only Cognito **ID** tokens carry `aud`; access tokens carry `client_id`. Sending an access token always returns 401.

## Monorepo structure

| Workspace       | Responsibility                                                                |
| --------------- | ----------------------------------------------------------------------------- |
| `@notes/shared` | The contract: `Note` types, zod request schemas, validation limits, API paths |
| `@notes/api`    | One Lambda per route. Thin handlers → services (DynamoDB / S3) → AWS SDK v3   |
| `@notes/web`    | React app organised by feature (`auth`, `notes`) plus shared UI primitives    |

`@notes/shared` is consumed as TypeScript source (its `exports` point at `src/index.ts`). Vite and esbuild compile it as part of each app, so it has no build step of its own. The **same zod schema** validates a note in the browser form and in the `createNote` Lambda.

### API layers

```
handlers/   one file per route: parse input → call a service → return JSON
services/   notesRepository (DynamoDB) and attachments (S3 presigned URLs)
lib/        config (env vars), SDK clients, HttpError, request helpers, createHandler wrapper
```

`createHandler()` wraps every route. It converts `HttpError` into the matching status code and turns anything unexpected into a logged, generic 500, so internals never leak to the client.

### Build and deploy of the Lambdas

`apps/api/scripts/build.ts` bundles each handler with esbuild into `dist/<name>/index.mjs` (ESM, minified, with source map). Terraform zips each folder separately, so a function only ships the code it imports. The DynamoDB-only handlers do not include the S3 client. `NODE_OPTIONS=--enable-source-maps` makes stack traces in CloudWatch point at the TypeScript lines.

## Data model

DynamoDB table `<project>-<stage>-notes`, on-demand billing:

| Attribute       | Key           | Notes                                                      |
| --------------- | ------------- | ---------------------------------------------------------- |
| `userId`        | partition key | Cognito `sub`. All of a user's notes share one partition   |
| `noteId`        | sort key      | UUID **v7**, time-ordered, so `Query` returns notes by age |
| `title`         |               | 1–200 characters                                           |
| `content`       |               | Up to 10,000 characters                                    |
| `attachmentKey` |               | Optional S3 key, always `{userId}/{uuid}-{fileName}`       |
| `createdAt`     |               | ISO-8601 timestamp                                         |

"List my notes" is a single `Query` on the user's partition with `ScanIndexForward: false` (newest first), following `LastEvaluatedKey` for large result sets. There is no `Scan` and no in-memory sort.

## Security design

- **Authentication** (who are you?) is handled by Cognito and the API Gateway JWT authorizer.
- **Authorization** (what may you touch?) comes from the key design. Every DynamoDB key contains the caller's `userId`, and every S3 key starts with `{userId}/`. `createNote` rejects an `attachmentKey` outside the caller's prefix, so a user cannot attach, and later download, someone else's file.
- **Least-privilege IAM:** the Lambda role can only `PutItem/GetItem/Query/DeleteItem` on the notes table and `PutObject/GetObject/DeleteObject` in the uploads bucket.
- **Private buckets:** both buckets block all public access. Uploads are only reachable through 5-minute presigned URLs. The site bucket is only readable by its CloudFront distribution.
- **Input validation:** every body and path parameter is validated with zod. Note ids must be UUIDs, and file names are sanitised before they become S3 keys.
- **Throttling:** the API stage limits bursts to 50 requests and sustained traffic to 20 requests per second.
- **Cognito client:** no secret (browsers cannot keep one), and `prevent_user_existence_errors` stops it revealing which emails are registered.

## Hardening for production

- Set `cors_allowed_origins` to your CloudFront URL (see `infra/terraform/example.tfvars`).
- Store Terraform state remotely (S3 backend with locking) and use one `.tfvars` file per stage.
- Add a custom domain (Route 53 + ACM), AWS WAF, CloudWatch alarms on Lambda errors, and X-Ray tracing.
- Remove `ALLOW_USER_PASSWORD_AUTH` from the Cognito client once you no longer need the CLI smoke test.
