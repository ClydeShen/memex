import { expect, test } from "vitest";
import { goalSchema } from "./goal.ts";

const goal = { id: "goal-1", description: "Reach the exit room", params: { room: "exit" } };

test("accepts a Goal", () => {
  expect(goalSchema.parse(goal)).toEqual(goal);
});

test("rejects a Goal without a description or with params that are not JSON", () => {
  expect(goalSchema.safeParse({ ...goal, description: "" }).success).toBe(false);
  expect(goalSchema.safeParse({ ...goal, params: { at: new Date(0) } }).success).toBe(false);
});
