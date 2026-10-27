/** HTTP paths of the REST API, relative to the API base URL. */
export const apiPaths = {
  notes: "/notes",
  /**
   * Path of a single note.
   *
   * @param id - The note id.
   * @returns `/notes/{id}` with the id URL-encoded.
   */
  note: (id: string): string => `/notes/${encodeURIComponent(id)}`,
  uploads: "/uploads",
} as const;

/** One field-level validation problem. */
export interface ApiIssue {
  /** Dotted path of the invalid field, for example `title`. */
  path: string;
  message: string;
}

/** JSON body of every non-2xx API response. */
export interface ApiErrorBody {
  message: string;
  /** Present on 400 responses caused by schema validation. */
  issues?: ApiIssue[];
}
