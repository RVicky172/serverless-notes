import { AppHeader } from "./components/AppHeader";
import { LoginPage } from "./features/auth/components/LoginPage";
import { useAuth } from "./features/auth/useAuth";
import { NotesPage } from "./features/notes/components/NotesPage";

/** Root component: shows the login screen or the notes, depending on the session. */
export function App() {
  const { status } = useAuth();

  if (status === "loading") {
    return <p className="mt-16 text-center text-sm text-slate-500">Loading…</p>;
  }
  if (status === "signedOut") return <LoginPage />;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <NotesPage />
      </main>
    </>
  );
}
