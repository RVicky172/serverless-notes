import type { ApiErrorBody, ApiIssue } from "@notes/shared";
import { getIdToken } from "../features/auth/authService";
import { env } from "./env";

/** An API call that returned a non-2xx status. */
export class ApiError extends Error {
  /**
   * @param status - HTTP status code.
   * @param message - Message returned by the API.
   * @param issues - Field-level validation problems, if any.
   */
  constructor(
    readonly status: number,
    message: string,
    readonly issues?: ApiIssue[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Options for {@link apiRequest}. */
export interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  /** Serialized as JSON. */
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Calls the notes API with the signed-in user's Cognito **ID token**.
 *
 * The API Gateway JWT authorizer checks the token's `aud` claim, which only ID
 * tokens carry, so sending the access token would always return 401.
 *
 * @param path - Path relative to the API base URL, for example `/notes`.
 * @param options - HTTP method, JSON body and abort signal.
 * @returns The parsed JSON body, or `undefined` for 204 responses.
 * @throws {ApiError} On any non-2xx response.
 */
export async function apiRequest(path: string, options: RequestOptions = {}): Promise<unknown> {
  const token = await getIdToken();
  if (!token) throw new ApiError(401, "Your session has expired. Please sign in again.");

  const response = await fetch(`${env.apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: options.body === undefined ? null : JSON.stringify(options.body),
    signal: options.signal ?? null,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as Partial<ApiErrorBody>;
    throw new ApiError(
      response.status,
      error.message ?? `Request failed (${response.status})`,
      error.issues,
    );
  }
  return response.status === 204 ? undefined : response.json();
}
