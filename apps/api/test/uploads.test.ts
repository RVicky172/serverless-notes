import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { UploadUrlResponse } from "@notes/shared";
import { describe, expect, it, vi } from "vitest";
import { handler as getUploadUrl } from "../src/handlers/getUploadUrl";
import { isOwnedBy } from "../src/lib/attachmentKeys";
import { bodyOf, makeEvent, USER_ID } from "./fixtures";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(() => Promise.resolve("https://signed.example/put")),
}));

describe("POST /uploads", () => {
  it("returns a presigned URL and a key under the caller's prefix", async () => {
    const res = await getUploadUrl(
      makeEvent({ body: { fileName: "my report.pdf", contentType: "application/pdf" } }),
    );

    expect(res.statusCode).toBe(200);
    const body = bodyOf(res) as UploadUrlResponse;
    expect(body.uploadUrl).toBe("https://signed.example/put");
    expect(body.key).toMatch(new RegExp(`^${USER_ID}/[0-9a-f-]{36}-my_report\\.pdf$`));

    // The Content-Type is part of the signature, so the browser must send the same header.
    const command = vi.mocked(getSignedUrl).mock.calls[0]![1];
    expect(command.input).toMatchObject({ Key: body.key, ContentType: "application/pdf" });
  });

  it("returns 400 when fileName or contentType is missing", async () => {
    const res = await getUploadUrl(makeEvent({ body: { fileName: "a.txt" } }));
    expect(res.statusCode).toBe(400);
  });
});

describe("isOwnedBy", () => {
  it("accepts only keys under the user's prefix", () => {
    expect(isOwnedBy(`${USER_ID}/a.txt`, USER_ID)).toBe(true);
    expect(isOwnedBy("other/a.txt", USER_ID)).toBe(false);
    expect(isOwnedBy(`${USER_ID}-evil/a.txt`, USER_ID)).toBe(false);
    expect(isOwnedBy(`${USER_ID}/../other/a.txt`, USER_ID)).toBe(false);
  });
});
