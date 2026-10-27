import { noteIdSchema, type NoteWithDownloadUrl } from "@notes/shared";
import { notFound } from "../lib/errors";
import { createHandler } from "../lib/handler";
import { getPathParam, getUserId, json } from "../lib/http";
import { createDownloadUrl } from "../services/attachments";
import * as notes from "../services/notesRepository";

/**
 * `GET /notes/{id}` — returns one note plus a temporary (5 minute) download URL for its attachment.
 *
 * Responses: `200` with a {@link @notes/shared!NoteWithDownloadUrl}, `400` on a malformed id, `404` if not found.
 */
export const handler = createHandler(async (event) => {
  const userId = getUserId(event);
  const noteId = getPathParam(event, "id", noteIdSchema);

  const note = await notes.getNote(userId, noteId);
  if (!note) throw notFound("Note not found");

  const result: NoteWithDownloadUrl = note.attachmentKey
    ? { ...note, downloadUrl: await createDownloadUrl(note.attachmentKey) }
    : note;
  return json(200, result);
});
