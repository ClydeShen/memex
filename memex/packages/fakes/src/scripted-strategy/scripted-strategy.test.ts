import type { ActionRequest, StepContext } from "@memex/contracts";
import { expect, test } from "vitest";
import { createScriptedStrategy } from "./scripted-strategy.ts";

const OPEN_DOOR: ActionRequest = { name: "open-door", params: {} };
const CLOSE_DOOR: ActionRequest = { name: "close-door", params: {} };

const contextAt = (step: number): StepContext => ({
  state: {
    goal: { id: "goal-1", description: "Open the door.", params: {} },
    recentObservations: [],
    step,
  },
  budget: { remainingSteps: 10 },
  services: {},
});

test("submits the scripted Action of the current step", () => {
  const strategy = createScriptedStrategy([OPEN_DOOR, CLOSE_DOOR]);
  expect(strategy.step(contextAt(0))).toEqual({ actions: [OPEN_DOOR], done: false });
  expect(strategy.step(contextAt(1))).toEqual({ actions: [CLOSE_DOOR], done: true });
});

test("stops with no Action when the script has run out", () => {
  const strategy = createScriptedStrategy([OPEN_DOOR]);
  expect(strategy.step(contextAt(1))).toEqual({ actions: [], done: true });
});

test("the same context gives the same decision", () => {
  const strategy = createScriptedStrategy([OPEN_DOOR]);
  expect(strategy.step(contextAt(0))).toEqual(strategy.step(contextAt(0)));
});
