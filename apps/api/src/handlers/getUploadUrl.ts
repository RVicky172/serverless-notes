import { uploadUrlRequestSchema } from "@notes/shared";
import { createHandler } from "../lib/handler";
import { getUserId, json, parseBody } from "../lib/http";
import { createUploadUrl } from "../services/attachments";

/**
 * `POST /uploads` — returns a presigned URL the browser uses to PUT a file straight to S3.
 *
 * Responses: `200` with an {@link @notes/shared!UploadUrlResponse}, `400` on invalid input.
 */
export const handler = createHandler(async (event) => {
  const userId = getUserId(event);
  const request = parseBody(event, uploadUrlRequestSchema);
  return json(200, await createUploadUrl(userId, request));
});
