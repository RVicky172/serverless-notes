import { useState } from "react";
import { errorMessage } from "../../lib/errors";
import * as auth from "./authService";

/** The three screens of the login flow. */
export type LoginMode = "signIn" | "signUp" | "confirm";

/** Values entered in the login form. */
export interface LoginFields {
  email: string;
  password: string;
  code: string;
}

/**
 * State machine for sign-in, sign-up and email confirmation.
 *
 * signUp → (Cognito emails a code) → confirm → signIn → `onSignedIn()`.
 * Signing in to an unconfirmed account jumps to `confirm`.
 *
 * @param onSignedIn - Called once the user is signed in.
 */
export function useLoginFlow(onSignedIn: () => void) {
  const [mode, setMode] = useState<LoginMode>("signIn");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);

  async function runStep(fields: LoginFields): Promise<void> {
    if (mode === "signUp") {
      await auth.signUp(fields.email, fields.password);
      setNotice(`We emailed a verification code to ${fields.email}.`);
      setMode("confirm");
    } else if (mode === "confirm") {
      await auth.confirmSignUp(fields.email, fields.code);
      setNotice("Email confirmed. You can sign in now.");
      setMode("signIn");
    } else if ((await auth.signIn(fields.email, fields.password)) === "signedIn") {
      onSignedIn();
    } else {
      setNotice("Please confirm your email with the code we sent you.");
      setMode("confirm");
    }
  }

  async function submit(fields: LoginFields): Promise<void> {
    setError(undefined);
    setNotice(undefined);
    setPending(true);
    try {
      await runStep(fields);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  function toggleMode(): void {
    setError(undefined);
    setNotice(undefined);
    setMode(mode === "signIn" ? "signUp" : "signIn");
  }

  return { mode, error, notice, pending, submit, toggleMode };
}
