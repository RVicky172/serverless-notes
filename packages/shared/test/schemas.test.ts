import { describe, expect, it } from "vitest";
import {
  apiPaths,
  createNoteSchema,
  NOTE_LIMITS,
  noteIdSchema,
  sanitizeFileName,
  uploadUrlRequestSchema,
} from "../src";

describe("createNoteSchema", () => {
  it("trims the title and defaults content to an empty string", () => {
    expect(createNoteSchema.parse({ title: "  Hello  " })).toEqual({ title: "Hello", content: "" });
  });

  it("rejects a blank title", () => {
    const result = createNoteSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("title is required");
  });

  it("rejects a title that is too long", () => {
    const title = "x".repeat(NOTE_LIMITS.titleMaxLength + 1);
    expect(createNoteSchema.safeParse({ title }).success).toBe(false);
  });
});

describe("noteIdSchema", () => {
  it("accepts a UUID and rejects anything else", () => {
    expect(noteIdSchema.safeParse("0192f1d2-7a3b-7c4d-8e5f-0123456789ab").success).toBe(true);
    expect(noteIdSchema.safeParse("../etc/passwd").success).toBe(false);
  });
});

describe("uploadUrlRequestSchema", () => {
  it("accepts a file name and MIME type", () => {
    const body = { fileName: "a.txt", contentType: "text/plain" };
    expect(uploadUrlRequestSchema.parse(body)).toEqual(body);
  });

  it("rejects a malformed content type", () => {
    const body = { fileName: "a.txt", contentType: "not a mime" };
    expect(uploadUrlRequestSchema.safeParse(body).success).toBe(false);
  });
});

describe("sanitizeFileName", () => {
  it("replaces unsafe characters with underscores", () => {
    expect(sanitizeFileName("my report (1).pdf")).toBe("my_report__1_.pdf");
  });
});

describe("apiPaths.note", () => {
  it("URL-encodes the id", () => {
    expect(apiPaths.note("a/b")).toBe("/notes/a%2Fb");
  });
});
