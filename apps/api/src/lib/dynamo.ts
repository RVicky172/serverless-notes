import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Created once per Lambda container (outside the handler), so warm invocations
// reuse the connection. Only cold starts pay the setup cost.

/** DynamoDB document client: reads and writes plain JS objects instead of attribute maps. */
export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
