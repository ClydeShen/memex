import { expect, test } from "vitest";

test("the public entry point loads", async () => {
  await expect(import("./index.ts")).resolves.toBeTypeOf("object");
});
