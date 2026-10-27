import { useState, type SubmitEvent } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { TextField } from "../../../components/ui/TextField";
import { useAuth } from "../useAuth";
import { useLoginFlow, type LoginMode } from "../useLoginFlow";

const titles: Record<LoginMode, string> = {
  signIn: "Sign in",
  signUp: "Create an account",
  confirm: "Confirm your email",
};

/** Sign-in, sign-up and email confirmation screen. */
export function LoginPage() {
  const { markSignedIn } = useAuth();
  const { mode, error, notice, pending, submit, toggleMode } = useLoginFlow(markSignedIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submit({ email, password, code });
  }

  return (
    <main className="mx-auto mt-16 max-w-sm px-4">
      <p className="mb-6 text-center text-sm font-semibold tracking-wide text-indigo-600 uppercase">
        Serverless Notes
      </p>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-xl font-bold">{titles[mode]}</h1>

          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
          />

          {mode === "confirm" ? (
            <TextField
              label="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
              }}
              required
            />
          ) : (
            <TextField
              label="Password"
              type="password"
              autoComplete={mode === "signUp" ? "new-password" : "current-password"}
              minLength={8}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              required
            />
          )}

          {notice && <Alert tone="info">{notice}</Alert>}
          {error && <Alert>{error}</Alert>}

          <Button type="submit" pending={pending} className="w-full">
            Continue
          </Button>

          {mode !== "confirm" && (
            <Button variant="link" onClick={toggleMode} className="w-full">
              {mode === "signIn" ? "Need an account? Sign up" : "Have an account? Sign in"}
            </Button>
          )}
        </form>
      </Card>
    </main>
  );
}
