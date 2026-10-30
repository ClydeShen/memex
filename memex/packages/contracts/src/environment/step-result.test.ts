import { expect, test } from "vitest";
import { stepResultSchema } from "./step-result.ts";

const result = { observations: [], valid: true, cost: 1, goalReached: true };

test("accepts a StepResult", () => {
  expect(stepResultSchema.parse(result)).toEqual(result);
});

test("rejects a negative cost and a missing goalReached", () => {
  expect(stepResultSchema.safeParse({ ...result, cost: -1 }).success).toBe(false);
  const { goalReached: _, ...withoutGoalReached } = result;
  expect(stepResultSchema.safeParse(withoutGoalReached).success).toBe(false);
});
