import { expect, test } from "vitest";
import { decisionSchema } from "./decision.ts";

test("accepts each outcome with a reason", () => {
  for (const outcome of ["allow", "deny", "ask"]) {
    expect(
      decisionSchema.safeParse({ outcome, reason: "the policy allows everything" }).success,
    ).toBe(true);
  }
});

test("rejects a decision without a reason and an unknown outcome", () => {
  expect(decisionSchema.safeParse({ outcome: "allow", reason: "" }).success).toBe(false);
  expect(decisionSchema.safeParse({ outcome: "maybe", reason: "unsure" }).success).toBe(false);
});
