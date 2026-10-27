import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_USER_POOL_ID: z.string().min(1),
  VITE_CLIENT_ID: z.string().min(1),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
  throw new Error(
    "Missing or invalid frontend configuration. Run `pnpm env:web` after `terraform apply` " +
      "to generate apps/web/.env.local, then restart the dev server.",
  );
}

/**
 * Validated frontend configuration.
 *
 * Vite copies these values into the JavaScript bundle at build time, so rebuild
 * after regenerating `.env.local` (for example after recreating the infrastructure).
 */
export const env = {
  /** API Gateway base URL, without a trailing slash. */
  apiUrl: parsed.data.VITE_API_URL.replace(/\/+$/, ""),
  /** Cognito user pool id. */
  userPoolId: parsed.data.VITE_USER_POOL_ID,
  /** Cognito app client id (no secret; browsers cannot keep one). */
  clientId: parsed.data.VITE_CLIENT_ID,
} as const;
