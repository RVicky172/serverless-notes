import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Handlers read these at import time, exactly like they do in Lambda.
    env: { TABLE_NAME: "test-notes", BUCKET_NAME: "test-uploads", AWS_REGION: "us-east-1" },
    coverage: { include: ["src/**"] },
  },
});
