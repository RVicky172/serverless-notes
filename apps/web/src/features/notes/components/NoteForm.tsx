import { createNoteSchema, NOTE_LIMITS } from "@notes/shared";
import { useState, type SubmitEvent } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { TextAreaField, TextField } from "../../../components/ui/TextField";
import { errorMessage } from "../../../lib/errors";
import { useCreateNote } from "../hooks/useNotes";

/** Form for creating a note with an optional file attachment. */
export function NoteForm() {
  const createNote = useCreateNote();
  const [validationError, setValidationError] = useState<string>();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");

    // Validate with the same schema the API uses, before uploading anything.
    const parsed = createNoteSchema.safeParse({
      title: data.get("title"),
      content: data.get("content"),
    });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message);
      return;
    }
    setValidationError(undefined);

    createNote.mutate(
      { ...parsed.data, file: file instanceof File && file.size > 0 ? file : undefined },
      {
        onSuccess: () => {
          form.reset();
        },
      },
    );
  }

  const error =
    validationError ??
    (createNote.error ? errorMessage(createNote.error, "Could not save the note") : undefined);

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4" aria-label="New note">
        <h2 className="text-lg font-semibold">New note</h2>
        <TextField
          label="Title"
          name="title"
          maxLength={NOTE_LIMITS.titleMaxLength}
          placeholder="Shopping list"
          required
        />
        <TextAreaField
          label="Content"
          name="content"
          maxLength={NOTE_LIMITS.contentMaxLength}
          placeholder="Write something…"
        />
        <div className="space-y-1">
          <label htmlFor="note-file" className="block text-sm font-medium text-slate-700">
            Attachment (optional)
          </label>
          <input
            id="note-file"
            name="file"
            type="file"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-slate-200"
          />
        </div>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" pending={createNote.isPending}>
          Add note
        </Button>
      </form>
    </Card>
  );
}
