import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  build: { sourcemap: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    env: {
      VITE_API_URL: "https://api.test",
      VITE_USER_POOL_ID: "us-east-1_test",
      VITE_CLIENT_ID: "test-client",
    },
  },
});
