import { useState } from "react";
import { useAuth } from "../features/auth/useAuth";
import { Button } from "./ui/Button";

/** Top bar with the app name and a sign-out button. */
export function AppHeader() {
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleSignOut(): Promise<void> {
    setPending(true);
    try {
      await signOut();
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <span className="font-semibold text-indigo-600">Serverless Notes</span>
        <Button variant="secondary" pending={pending} onClick={() => void handleSignOut()}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
