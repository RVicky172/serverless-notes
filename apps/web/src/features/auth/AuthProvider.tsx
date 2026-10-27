import { useQueryClient } from "@tanstack/react-query";
import { Hub } from "aws-amplify/utils";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthStatus } from "./authContext";
import * as auth from "./authService";

/**
 * Provides the authentication state to the app.
 *
 * Checks for an existing session on startup and switches to `signedOut` when
 * Amplify reports a sign-out or a failed token refresh.
 *
 * @param props - Component props.
 * @param props.children - The app.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    auth
      .getIdToken()
      .then((token) => {
        setStatus(token ? "signedIn" : "signedOut");
      })
      .catch(() => {
        setStatus("signedOut");
      });

    return Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedOut" || payload.event === "tokenRefresh_failure") {
        queryClient.clear();
        setStatus("signedOut");
      }
    });
  }, [queryClient]);

  const markSignedIn = useCallback(() => {
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    queryClient.clear(); // the next user must never see this user's cached notes
    setStatus("signedOut");
  }, [queryClient]);

  const value = useMemo(() => ({ status, markSignedIn, signOut }), [status, markSignedIn, signOut]);
  return <AuthContext value={value}>{children}</AuthContext>;
}
