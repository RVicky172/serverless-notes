import { use } from "react";
import { AuthContext, type AuthContextValue } from "./authContext";

/**
 * Reads the authentication state.
 *
 * @throws {Error} When used outside `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
