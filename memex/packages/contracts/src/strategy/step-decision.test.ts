import { expect, test } from "vitest";
import { stepDecisionSchema } from "./step-decision.ts";

test("accepts a StepDecision", () => {
  const decision = { actions: [{ name: "move", params: { to: "exit" } }], done: false };
  expect(stepDecisionSchema.parse(decision)).toEqual(decision);
});

test("rejects an Action that names its own actor and a missing done", () => {
  expect(
    stepDecisionSchema.safeParse({
      actions: [{ name: "move", params: {}, actor: "user" }],
      done: true,
    }).success,
  ).toBe(false);
  expect(stepDecisionSchema.safeParse({ actions: [] }).success).toBe(false);
});
