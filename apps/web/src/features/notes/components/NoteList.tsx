import { Alert } from "../../../components/ui/Alert";
import { Card } from "../../../components/ui/Card";
import { errorMessage } from "../../../lib/errors";
import { useNotes } from "../hooks/useNotes";
import { NoteCard } from "./NoteCard";

/** The signed-in user's notes, with loading, error and empty states. */
export function NoteList() {
  const { data: notes, error, isPending } = useNotes();

  if (isPending) return <p className="text-sm text-slate-500">Loading notes…</p>;
  if (error) return <Alert>{errorMessage(error, "Could not load your notes")}</Alert>;
  if (notes.length === 0) {
    return <p className="text-sm text-slate-500">No notes yet. Add your first one above.</p>;
  }

  return (
    <Card>
      <h2 className="sr-only">Your notes</h2>
      {notes.map((note) => (
        <NoteCard key={note.noteId} note={note} />
      ))}
    </Card>
  );
}
