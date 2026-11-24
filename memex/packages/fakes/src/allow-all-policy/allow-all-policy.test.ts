import { expect, test } from "vitest";
import { createAllowAllPolicy } from "./allow-all-policy.ts";

test("allows every Action and says why", async () => {
  const decision = await createAllowAllPolicy().authorize({ name: "move", params: {} }, "agent", {
    name: "move",
    paramsSchema: {},
    risk: "self-modify",
  });
  expect(decision).toEqual({ outcome: "allow", reason: "every Action is allowed" });
});
