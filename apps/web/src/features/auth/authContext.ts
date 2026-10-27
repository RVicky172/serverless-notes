import { createContext } from "react";

/** `loading` while the stored session is checked on startup. */
export type AuthStatus = "loading" | "signedIn" | "signedOut";

/** Value exposed by {@link AuthContext}. */
export interface AuthContextValue {
  status: AuthStatus;
  /** Call after a successful sign-in to show the app. */
  markSignedIn: () => void;
  /** Signs out and clears all cached user data. */
  signOut: () => Promise<void>;
}

/** React context holding the authentication state. Read it with `useAuth()`. */
export const AuthContext = createContext<AuthContextValue | null>(null);
