# @notes/web

React 19 single-page app: Amplify Auth (Cognito) for sign-in, TanStack Query for server state, Tailwind CSS 4 for styling.

```
src/features/auth/    authService (Amplify), AuthProvider, useAuth, useLoginFlow, LoginPage
src/features/notes/   notesApi, query hooks, NotesPage / NoteForm / NoteList / NoteCard
src/components/       AppHeader and UI primitives (Button, TextField, Alert, Card)
src/lib/              env validation, API client, query client, Amplify setup
```

```bash
pnpm env:web                      # from the repo root: writes .env.local from Terraform outputs
pnpm --filter @notes/web dev      # http://localhost:5173
pnpm --filter @notes/web test
```
