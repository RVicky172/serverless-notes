# @notes/shared

The contract between the web app and the API, consumed as TypeScript source by both:

- **Types:** `Note`, `NoteWithDownloadUrl`, `UploadUrlResponse`, `ApiErrorBody`
- **Schemas (zod):** `createNoteSchema`, `uploadUrlRequestSchema`, `noteIdSchema`
- **Constants:** `NOTE_LIMITS`, `UPLOAD_LIMITS`, `apiPaths`

Changing a schema here changes validation in the browser form and in the Lambda at the same time.
