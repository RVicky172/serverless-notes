import type { ApiIssue } from "@notes/shared";

/**
 * An error that maps directly to an HTTP response.
 * Throw it anywhere inside a handler; `createHandler` (lib/handler) turns it into JSON.
 *
 * @example
 * ```ts
 * throw new HttpError(404, "Note not found");
 * ```
 */
export class HttpError extends Error {
  /**
   * @param statusCode - HTTP status to return, for example 400 or 404.
   * @param message - Human-readable message sent to the client.
   * @param issues - Optional field-level validation problems.
   */
  constructor(
    readonly statusCode: number,
    message: string,
    readonly issues?: ApiIssue[],
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Creates a 400 Bad Request error.
 *
 * @param message - What is wrong with the request.
 * @param issues - Optional field-level validation problems.
 */
export const badRequest = (message: string, issues?: ApiIssue[]): HttpError =>
  new HttpError(400, message, issues);

/**
 * Creates a 404 Not Found error.
 *
 * @param message - What could not be found.
 */
export const notFound = (message: string): HttpError => new HttpError(404, message);
