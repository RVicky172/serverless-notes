import {
  apiPaths,
  DEFAULT_CONTENT_TYPE,
  type CreateNoteInput,
  type Note,
  type NoteWithDownloadUrl,
  type UploadUrlResponse,
} from "@notes/shared";
import { apiRequest } from "../../lib/apiClient";

// Response bodies are typed by the shared contract in @notes/shared.

/** Fetches the signed-in user's notes, newest first. */
export async function listNotes(): Promise<Note[]> {
  return (await apiRequest(apiPaths.notes)) as Note[];
}

/**
 * Fetches one note, including a temporary download URL for its attachment.
 *
 * @param id - The note id.
 */
export async function getNote(id: string): Promise<NoteWithDownloadUrl> {
  return (await apiRequest(apiPaths.note(id))) as NoteWithDownloadUrl;
}

/**
 * Creates a note.
 *
 * @param input - Title, content and optional attachment key from {@link uploadAttachment}.
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  return (await apiRequest(apiPaths.notes, { method: "POST", body: input })) as Note;
}

/**
 * Deletes a note and its attachment.
 *
 * @param id - The note id.
 */
export async function deleteNote(id: string): Promise<void> {
  await apiRequest(apiPaths.note(id), { method: "DELETE" });
}

/**
 * Uploads a file in two steps: ask the API for a presigned URL, then PUT the
 * file straight to S3. The file never passes through API Gateway or Lambda.
 *
 * @param file - The file chosen by the user.
 * @returns The S3 key to store as the note's `attachmentKey`.
 */
export async function uploadAttachment(file: File): Promise<string> {
  const contentType = file.type || DEFAULT_CONTENT_TYPE;
  const { uploadUrl, key } = (await apiRequest(apiPaths.uploads, {
    method: "POST",
    body: { fileName: file.name, contentType },
  })) as UploadUrlResponse;

  // The Content-Type header must match the one that was signed, or S3 returns 403.
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!response.ok) throw new Error(`Upload to S3 failed (${response.status})`);
  return key;
}
