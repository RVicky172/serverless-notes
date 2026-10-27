import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import type { z } from "zod";
import { badRequest, HttpError } from "./errors";

/** An API Gateway HTTP API (payload v2.0) event whose JWT was already verified by the authorizer. */
export type AuthorizedEvent = APIGatewayProxyEventV2WithJWTAuthorizer;

/** The response shape API Gateway expects back from Lambda. */
export type HttpResult = APIGatewayProxyStructuredResultV2;

/**
 * Builds a JSON response.
 *
 * @param statusCode - HTTP status code.
 * @param body - Value to serialize. Omit it for bodiless responses such as 204.
 */
export function json(statusCode: number, body?: unknown): HttpResult {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

/**
 * Returns the caller's unique Cognito user id (the `sub` claim).
 *
 * The JWT authorizer has verified the token before Lambda runs, so this value
 * can be trusted. Never take the user id from the request body.
 *
 * @param event - The incoming API Gateway event.
 * @throws {HttpError} 401 if the claim is missing (route not protected by the authorizer).
 */
export function getUserId(event: AuthorizedEvent): string {
  const sub = event.requestContext.authorizer.jwt.claims["sub"];
  if (typeof sub !== "string" || sub.length === 0) throw new HttpError(401, "Unauthorized");
  return sub;
}

/** Decodes the raw request body, handling API Gateway's optional base64 encoding. */
function readBody(event: AuthorizedEvent): string {
  if (!event.body) return "{}";
  return event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
}

/**
 * Validates a value against a zod schema, converting failures to a 400 error.
 *
 * @param schema - The zod schema to apply.
 * @param value - Untrusted input.
 * @returns The parsed (and possibly transformed) value.
 * @throws {HttpError} 400 listing every validation issue.
 */
export function validate<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  const issues = result.error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
  throw badRequest(issues[0]?.message ?? "Invalid request", issues);
}

/**
 * Parses the JSON body and validates it.
 *
 * @param event - The incoming API Gateway event.
 * @param schema - Schema describing the expected body.
 * @throws {HttpError} 400 if the body is not JSON or does not match the schema.
 */
export function parseBody<T extends z.ZodType>(event: AuthorizedEvent, schema: T): z.output<T> {
  let raw: unknown;
  try {
    raw = JSON.parse(readBody(event));
  } catch {
    throw badRequest("Body must be valid JSON");
  }
  return validate(schema, raw);
}

/**
 * Reads and validates a path parameter, for example `{id}` in `/notes/{id}`.
 *
 * @param event - The incoming API Gateway event.
 * @param name - Parameter name as written in the route.
 * @param schema - Schema the value must satisfy.
 */
export function getPathParam<T extends z.ZodType>(
  event: AuthorizedEvent,
  name: string,
  schema: T,
): z.output<T> {
  return validate(schema, event.pathParameters?.[name]);
}
