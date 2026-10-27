import type { AuthorizedEvent } from "../src/lib/http";

/** Default signed-in user for tests. */
export const USER_ID = "user-123";

interface EventOptions {
  body?: unknown;
  pathParameters?: Record<string, string>;
  sub?: string;
}

/**
 * Builds a minimal API Gateway HTTP API event, as it arrives after the JWT authorizer.
 *
 * @param options - Body, path parameters and the `sub` claim to use.
 */
export function makeEvent({
  body,
  pathParameters,
  sub = USER_ID,
}: EventOptions = {}): AuthorizedEvent {
  return {
    routeKey: "TEST /route",
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    isBase64Encoded: false,
    pathParameters,
    requestContext: {
      requestId: "req-1",
      authorizer: { jwt: { claims: { sub }, scopes: [] } },
    },
  } as unknown as AuthorizedEvent;
}

/**
 * Parses the JSON body of a handler response.
 *
 * @param result - The handler's return value.
 */
export function bodyOf(result: { body?: string }): unknown {
  return JSON.parse(result.body ?? "null");
}
