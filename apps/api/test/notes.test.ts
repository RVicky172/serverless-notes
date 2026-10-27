import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Note } from "@notes/shared";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler as createNote } from "../src/handlers/createNote";
import { handler as deleteNote } from "../src/handlers/deleteNote";
import { handler as getNote } from "../src/handlers/getNote";
import { handler as listNotes } from "../src/handlers/listNotes";
import { bodyOf, makeEvent, USER_ID } from "./fixtures";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(() => Promise.resolve("https://signed.example/url")),
}));

const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);
const NOTE_ID = "0192f1d2-7a3b-7c4d-8e5f-0123456789ab";

const storedNote: Note = {
  userId: USER_ID,
  noteId: NOTE_ID,
  title: "First",
  content: "Hello",
  attachmentKey: `${USER_ID}/file.txt`,
  createdAt: "2026-10-27T10:00:00.000Z",
};

beforeEach(() => {
  ddbMock.reset();
  s3Mock.reset();
});

describe("POST /notes", () => {
  it("stores the note under the caller's user id and returns 201", async () => {
    ddbMock.on(PutCommand).resolves({});

    const res = await createNote(makeEvent({ body: { title: " Title ", content: "Body" } }));

    expect(res.statusCode).toBe(201);
    expect(bodyOf(res)).toMatchObject({ userId: USER_ID, title: "Title", content: "Body" });
    const put = ddbMock.commandCalls(PutCommand)[0]!.args[0].input;
    expect(put.Item).toMatchObject({ userId: USER_ID, title: "Title" });
  });

  it("returns 400 when the title is missing", async () => {
    const res = await createNote(makeEvent({ body: { content: "no title" } }));
    expect(res.statusCode).toBe(400);
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
  });

  it("returns 400 when the body is not JSON", async () => {
    const res = await createNote(makeEvent({ body: "{not json" }));
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res)).toMatchObject({ message: "Body must be valid JSON" });
  });

  it("rejects an attachment key that belongs to another user", async () => {
    const res = await createNote(
      makeEvent({ body: { title: "x", attachmentKey: "someone-else/file.txt" } }),
    );
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res)).toMatchObject({ message: "Invalid attachmentKey" });
  });
});

describe("GET /notes", () => {
  it("queries only the caller's partition, newest first, across all pages", async () => {
    ddbMock
      .on(QueryCommand)
      .resolvesOnce({ Items: [storedNote], LastEvaluatedKey: { userId: USER_ID, noteId: "a" } })
      .resolvesOnce({ Items: [{ ...storedNote, noteId: "older" }] });

    const res = await listNotes(makeEvent());

    expect(res.statusCode).toBe(200);
    expect(bodyOf(res) as Note[]).toHaveLength(2);
    const query = ddbMock.commandCalls(QueryCommand)[0]!.args[0].input;
    expect(query.ExpressionAttributeValues).toEqual({ ":u": USER_ID });
    expect(query.ScanIndexForward).toBe(false);
  });
});

describe("GET /notes/{id}", () => {
  it("returns the note with a presigned download URL", async () => {
    ddbMock.on(GetCommand).resolves({ Item: storedNote });

    const res = await getNote(makeEvent({ pathParameters: { id: NOTE_ID } }));

    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toMatchObject({
      noteId: NOTE_ID,
      downloadUrl: "https://signed.example/url",
    });
  });

  it("returns 404 when the note does not exist", async () => {
    ddbMock.on(GetCommand).resolves({});
    const res = await getNote(makeEvent({ pathParameters: { id: NOTE_ID } }));
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for a malformed id", async () => {
    const res = await getNote(makeEvent({ pathParameters: { id: "not-a-uuid" } }));
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /notes/{id}", () => {
  it("deletes the note and its attachment, returning 204", async () => {
    ddbMock.on(DeleteCommand).resolves({ Attributes: storedNote });
    s3Mock.on(DeleteObjectCommand).resolves({});

    const res = await deleteNote(makeEvent({ pathParameters: { id: NOTE_ID } }));

    expect(res.statusCode).toBe(204);
    expect(res.body).toBeUndefined();
    expect(s3Mock.commandCalls(DeleteObjectCommand)[0]!.args[0].input.Key).toBe(
      storedNote.attachmentKey,
    );
  });

  it("returns 404 when the note does not exist", async () => {
    ddbMock.on(DeleteCommand).resolves({});
    const res = await deleteNote(makeEvent({ pathParameters: { id: NOTE_ID } }));
    expect(res.statusCode).toBe(404);
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0);
  });
});

describe("error handling", () => {
  it("hides unexpected errors behind a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    ddbMock.on(QueryCommand).rejects(new Error("boom: table details"));

    const res = await listNotes(makeEvent());

    expect(res.statusCode).toBe(500);
    expect(bodyOf(res)).toEqual({ message: "Internal server error" });
  });
});
