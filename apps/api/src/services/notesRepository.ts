import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  type QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import type { CreateNoteData, Note } from "@notes/shared";
import { v7 as uuidv7 } from "uuid";
import { ddb } from "../lib/dynamo";
import { config } from "../lib/config";

/**
 * Data access for the notes table.
 *
 * Key design: `userId` (partition key) + `noteId` (sort key). Every operation is
 * scoped to one user's partition, which is also what enforces authorization.
 */

/**
 * Saves a new note for a user.
 *
 * @param userId - Owner of the note (from the verified JWT).
 * @param data - Validated note fields.
 * @returns The stored note.
 */
export async function createNote(userId: string, data: CreateNoteData): Promise<Note> {
  const note: Note = {
    userId,
    noteId: uuidv7(), // time-ordered, so the sort key also orders notes by creation time
    title: data.title,
    content: data.content,
    ...(data.attachmentKey ? { attachmentKey: data.attachmentKey } : {}),
    createdAt: new Date().toISOString(),
  };

  await ddb.send(
    new PutCommand({
      TableName: config.tableName,
      Item: note,
      ConditionExpression: "attribute_not_exists(noteId)", // never overwrite an existing note
    }),
  );
  return note;
}

/**
 * Lists all notes of one user, newest first.
 *
 * Uses `Query` (reads only this user's partition) rather than `Scan` (reads the
 * whole table), and follows `LastEvaluatedKey` until every page is read.
 *
 * @param userId - Owner whose notes to return.
 */
export async function listNotes(userId: string): Promise<Note[]> {
  const notes: Note[] = [];
  let startKey: QueryCommandOutput["LastEvaluatedKey"];

  do {
    const page = await ddb.send(
      new QueryCommand({
        TableName: config.tableName,
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
        ScanIndexForward: false, // descending sort key = newest first
        ExclusiveStartKey: startKey,
      }),
    );
    notes.push(...((page.Items ?? []) as Note[]));
    startKey = page.LastEvaluatedKey;
  } while (startKey);

  return notes;
}

/**
 * Reads one note.
 *
 * @param userId - Owner of the note.
 * @param noteId - Id of the note.
 * @returns The note, or `undefined` if this user has no such note.
 */
export async function getNote(userId: string, noteId: string): Promise<Note | undefined> {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: config.tableName, Key: { userId, noteId } }),
  );
  return Item as Note | undefined;
}

/**
 * Deletes one note.
 *
 * @param userId - Owner of the note.
 * @param noteId - Id of the note.
 * @returns The deleted note (so callers can clean up its attachment), or `undefined` if it did not exist.
 */
export async function deleteNote(userId: string, noteId: string): Promise<Note | undefined> {
  const { Attributes } = await ddb.send(
    new DeleteCommand({
      TableName: config.tableName,
      Key: { userId, noteId },
      ReturnValues: "ALL_OLD",
    }),
  );
  return Attributes as Note | undefined;
}
