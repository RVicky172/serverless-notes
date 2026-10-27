import { createNoteSchema } from "@notes/shared";
import { badRequest } from "../lib/errors";
import { createHandler } from "../lib/handler";
import { getUserId, json, parseBody } from "../lib/http";
import { isOwnedBy } from "../lib/attachmentKeys";
import * as notes from "../services/notesRepository";

/**
 * `POST /notes` — creates a note, optionally pointing at an uploaded attachment.
 *
 * Responses: `201` with the saved {@link @notes/shared!Note}, `400` on invalid input.
 */
export const handler = createHandler(async (event) => {
  const userId = getUserId(event);
  const data = parseBody(event, createNoteSchema);

  // Never trust the client: an attachment must live under this user's S3 prefix,
  // otherwise a user could attach (and later download) someone else's file.
  if (data.attachmentKey && !isOwnedBy(data.attachmentKey, userId)) {
    throw badRequest("Invalid attachmentKey");
  }

  return json(201, await notes.createNote(userId, data));
});
