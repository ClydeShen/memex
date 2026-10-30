import { expect, test } from "vitest";
import { actionRequestSchema } from "./action-request.ts";

test("accepts an ActionRequest and fills in empty params", () => {
  expect(actionRequestSchema.parse({ name: "move", params: { to: "exit" } })).toEqual({
    name: "move",
    params: { to: "exit" },
  });
  expect(actionRequestSchema.parse({ name: "claim.form" })).toEqual({
    name: "claim.form",
    params: {},
  });
});

test("rejects a request that names its own actor", () => {
  const result = actionRequestSchema.safeParse({ name: "move", params: {}, actor: "user" });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.code).toBe("unrecognized_keys");
});

test("rejects a name that is not lowercase", () => {
  expect(actionRequestSchema.safeParse({ name: "Move", params: {} }).success).toBe(false);
});
