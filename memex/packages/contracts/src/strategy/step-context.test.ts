import { expect, test } from "vitest";
import { stepContextSchema } from "./step-context.ts";

const context = {
  state: {
    goal: { id: "goal-1", description: "Reach the exit room", params: {} },
    recentObservations: [],
    step: 0,
  },
  budget: { remainingSteps: 10 },
};

test("accepts the data part of a step context", () => {
  expect(stepContextSchema.parse(context)).toEqual(context);
});

test("rejects a negative step and a state without a Goal", () => {
  expect(
    stepContextSchema.safeParse({ ...context, state: { ...context.state, step: -1 } }).success,
  ).toBe(false);
  const { goal: _, ...withoutGoal } = context.state;
  expect(stepContextSchema.safeParse({ ...context, state: withoutGoal }).success).toBe(false);
});
