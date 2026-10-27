import { HttpError } from "./errors";
import { json, type AuthorizedEvent, type HttpResult } from "./http";

/** Business logic of one API route. */
export type RouteHandler = (event: AuthorizedEvent) => Promise<HttpResult>;

/**
 * Wraps a route so that every error becomes a proper JSON response.
 *
 * - {@link HttpError} → its own status code and message.
 * - Anything else → logged with the request id, then a generic 500 (internals never leak).
 *
 * Lambda is configured with JSON log format, so `console.error` output is structured in CloudWatch.
 *
 * @param route - The route's business logic.
 * @returns A Lambda handler for API Gateway.
 */
export function createHandler(route: RouteHandler): RouteHandler {
  return async (event) => {
    try {
      return await route(event);
    } catch (error) {
      if (error instanceof HttpError) {
        return json(error.statusCode, { message: error.message, issues: error.issues });
      }
      console.error("Unhandled error", {
        requestId: event.requestContext.requestId,
        routeKey: event.routeKey,
        error,
      });
      return json(500, { message: "Internal server error" });
    }
  };
}
