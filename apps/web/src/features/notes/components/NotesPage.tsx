import { NoteForm } from "./NoteForm";
import { NoteList } from "./NoteList";

/** Main screen: create a note, then browse the list below. */
export function NotesPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">My notes</h1>
      <NoteForm />
      <NoteList />
    </section>
  );
}
