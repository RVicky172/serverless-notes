import { noteIdSchema } from "@notes/shared";
import { notFound } from "../lib/errors";
import { createHandler } from "../lib/handler";
import { getPathParam, getUserId, json } from "../lib/http";
import { deleteAttachment } from "../services/attachments";
import * as notes from "../services/notesRepository";

/**
 * `DELETE /notes/{id}` — deletes a note and its attachment.
 *
 * Responses: `204` (no body), `400` on a malformed id, `404` if not found.
 */
export const handler = createHandler(async (event) => {
  const userId = getUserId(event);
  const noteId = getPathParam(event, "id", noteIdSchema);

  const deleted = await notes.deleteNote(userId, noteId);
  if (!deleted) throw notFound("Note not found");

  if (deleted.attachmentKey) await deleteAttachment(deleted.attachmentKey);
  return json(204);
});
