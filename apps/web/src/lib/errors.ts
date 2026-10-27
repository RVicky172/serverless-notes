/**
 * Turns any thrown value into a message that is safe to show to the user.
 *
 * @param error - The caught value.
 * @param fallback - Message to use when `error` carries none.
 */
export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
