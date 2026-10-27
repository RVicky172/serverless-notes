import type { Note } from "@notes/shared";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { errorMessage } from "../../../lib/errors";
import { useDeleteNote, useOpenAttachment } from "../hooks/useNotes";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/**
 * One note in the list, with actions to open its attachment and delete it.
 *
 * @param props - Component props.
 * @param props.note - The note to show.
 */
export function NoteCard({ note }: { note: Note }) {
  const deleteNote = useDeleteNote();
  const openAttachment = useOpenAttachment();
  const error = deleteNote.error ?? openAttachment.error;

  function handleDelete(): void {
    if (window.confirm(`Delete "${note.title}"?`)) deleteNote.mutate(note.noteId);
  }

  return (
    <article className="space-y-3 border-t border-slate-200 py-4 first:border-t-0">
      <header className="flex items-baseline justify-between gap-4">
        <h3 className="font-semibold break-words">{note.title}</h3>
        <time dateTime={note.createdAt} className="shrink-0 text-xs text-slate-500">
          {dateFormat.format(new Date(note.createdAt))}
        </time>
      </header>

      {note.content && <p className="text-sm whitespace-pre-wrap text-slate-700">{note.content}</p>}

      <div className="flex gap-2">
        {note.attachmentKey && (
          <Button
            variant="secondary"
            pending={openAttachment.isPending}
            onClick={() => {
              openAttachment.mutate(note.noteId);
            }}
          >
            Open attachment
          </Button>
        )}
        <Button variant="danger" pending={deleteNote.isPending} onClick={handleDelete}>
          Delete
        </Button>
      </div>

      {error && <Alert>{errorMessage(error)}</Alert>}
    </article>
  );
}
