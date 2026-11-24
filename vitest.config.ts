import { defineConfig } from "vitest/config";

// No custom reporters: Vitest switches to its short "agent" output when a coding agent runs it,
// and a reporters setting turns that off.
export default defineConfig({
  test: {
    include: ["memex/**/*.test.ts", "factory/validation/**/*.test.ts", "harness/**/*.test.ts"],
  },
});
