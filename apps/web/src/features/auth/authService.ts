import {
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
} from "aws-amplify/auth";

/**
 * Thin wrapper around Amplify Auth (Cognito). Keeping every Amplify call here
 * means components never depend on the auth library directly.
 */

/** What the UI should do after a sign-in attempt. */
export type SignInOutcome = "signedIn" | "confirmSignUp";

/**
 * Registers a new user. Cognito then emails a 6-digit verification code.
 *
 * @param email - Used as the username.
 * @param password - Must satisfy the pool's password policy (8+ chars, upper, lower, number).
 */
export async function signUp(email: string, password: string): Promise<void> {
  await amplifySignUp({
    username: email,
    password,
    options: { userAttributes: { email } },
  });
}

/**
 * Confirms a new account with the code Cognito emailed.
 *
 * @param email - The username used at sign-up.
 * @param code - The 6-digit code from the email.
 */
export async function confirmSignUp(email: string, code: string): Promise<void> {
  await amplifyConfirmSignUp({ username: email, confirmationCode: code });
}

/**
 * Signs in with email and password (SRP, so the password never leaves the browser).
 *
 * @param email - The username.
 * @param password - The password.
 * @returns `"confirmSignUp"` when the account still needs its email code.
 * @throws {Error} On wrong credentials or an unsupported next step (for example MFA).
 */
export async function signIn(email: string, password: string): Promise<SignInOutcome> {
  const { isSignedIn, nextStep } = await amplifySignIn({ username: email, password });
  if (isSignedIn) return "signedIn";
  if (nextStep.signInStep === "CONFIRM_SIGN_UP") return "confirmSignUp";
  throw new Error(`Unsupported sign-in step: ${nextStep.signInStep}`);
}

/** Signs out and removes the stored tokens from the browser. */
export async function signOut(): Promise<void> {
  await amplifySignOut();
}

/**
 * Returns the current Cognito ID token (a JWT), refreshing it if it has expired.
 *
 * @returns The token, or `undefined` when nobody is signed in.
 */
export async function getIdToken(): Promise<string | undefined> {
  const session = await fetchAuthSession();
  return session.tokens?.idToken?.toString();
}
