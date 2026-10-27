import { z } from "zod";

/** Validation limits for notes, shared by the API and the web form. */
export const NOTE_LIMITS = {
  titleMaxLength: 200,
  contentMaxLength: 10_000,
  attachmentKeyMaxLength: 1024,
} as const;

/**
 * A note as stored in DynamoDB and returned by the API.
 *
 * The table key is `userId` (partition key) + `noteId` (sort key).
 */
export interface Note {
  /** Cognito `sub` of the owner. Always taken from the verified JWT, never from the request. */
  userId: string;
  /** Time-ordered UUID (v7), so sorting by `noteId` also sorts by creation time. */
  noteId: string;
  title: string;
  content: string;
  /** S3 object key of the optional attachment. Always starts with `${userId}/`. */
  attachmentKey?: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
}

/** A single note returned by `GET /notes/{id}`, with a short-lived download link for its attachment. */
export interface NoteWithDownloadUrl extends Note {
  /** Presigned S3 GET URL, present only when the note has an attachment. */
  downloadUrl?: string;
}

/** Request body schema for `POST /notes`. */
export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(NOTE_LIMITS.titleMaxLength),
  content: z.string().max(NOTE_LIMITS.contentMaxLength).default(""),
  attachmentKey: z.string().min(1).max(NOTE_LIMITS.attachmentKeyMaxLength).optional(),
});

/** What a client sends to `POST /notes` (`content` may be omitted). */
export type CreateNoteInput = z.input<typeof createNoteSchema>;

/** A validated `POST /notes` body, after defaults are applied. */
export type CreateNoteData = z.output<typeof createNoteSchema>;

/** Schema for the `{id}` path parameter of `/notes/{id}`. */
export const noteIdSchema = z.uuid("Invalid note id");
