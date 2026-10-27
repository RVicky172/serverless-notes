import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../notesApi";

const notesKey = ["notes"] as const;

/** A note being created from the form, with an optional file to attach. */
export interface NewNote {
  title: string;
  content: string;
  file?: File | undefined;
}

/** Loads the signed-in user's notes (cached and shared by every component). */
export function useNotes() {
  return useQuery({ queryKey: notesKey, queryFn: api.listNotes });
}

/** Uploads the attachment (if any) to S3, then saves the note in DynamoDB. */
export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, content, file }: NewNote) => {
      const attachmentKey = file ? await api.uploadAttachment(file) : undefined;
      return api.createNote({ title, content, attachmentKey });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
  });
}

/** Deletes a note (and its attachment), then refreshes the list. */
export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
  });
}

/**
 * Opens a note's attachment in a new tab using a fresh presigned URL.
 *
 * The tab is opened synchronously (inside the click) so popup blockers allow it,
 * then pointed at the URL once the API responds.
 */
export function useOpenAttachment() {
  return useMutation({
    mutationFn: async (id: string) => {
      const tab = window.open("about:blank", "_blank");
      try {
        const { downloadUrl } = await api.getNote(id);
        if (!downloadUrl) throw new Error("This note has no attachment");
        if (tab) {
          tab.opener = null;
          tab.location.href = downloadUrl;
        }
      } catch (error) {
        tab?.close();
        throw error;
      }
    },
  });
}
