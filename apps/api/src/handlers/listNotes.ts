import { createHandler } from "../lib/handler";
import { getUserId, json } from "../lib/http";
import * as notes from "../services/notesRepository";

/**
 * `GET /notes` — lists the signed-in user's notes, newest first.
 *
 * Responses: `200` with an array of {@link @notes/shared!Note}.
 */
export const handler = createHandler(async (event) => {
  return json(200, await notes.listNotes(getUserId(event)));
});
