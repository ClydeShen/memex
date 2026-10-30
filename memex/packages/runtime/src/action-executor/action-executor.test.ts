import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  ActionDefinition,
  ActionRequest,
  Decision,
  Event,
  StepResult,
} from "@memex/contracts";
import { afterEach, beforeEach, expect, test } from "vitest";
import { createEventLog, type EventLog } from "../event-log/event-log.ts";
import {
  type ActionEnvironment,
  type ActionPolicy,
  createActionExecutor,
} from "./action-executor.ts";
import { createAllowAllPolicy } from "./allow-all-policy.ts";

let dir = "";
let eventLog: EventLog;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "action-executor-"));
  eventLog = createEventLog(join(dir, "events.jsonl"));
});

afterEach(async () => {
  await rm(dir, { recursive: true });
});

const readEvents = async (): Promise<readonly Event[]> => {
  const events: Event[] = [];
  for await (const event of eventLog.read()) events.push(event);
  return events;
};

const MOVE: ActionDefinition = { name: "move", paramsSchema: {}, risk: "reversible" };

const STEP_RESULT: StepResult = {
  observations: [
    {
      id: "observation-1",
      source: "environment",
      recordedAt: "2026-01-01T00:00:01Z",
      payload: { room: "a" },
    },
  ],
  valid: true,
  cost: 1,
  goalReached: true,
};

const createExecutor = (overrides: {
  readonly environment?: ActionEnvironment;
  readonly policy?: ActionPolicy;
}): ReturnType<typeof createActionExecutor> =>
  createActionExecutor({
    definitions: [MOVE],
    eventLog,
    environment: overrides.environment ?? { step: async () => STEP_RESULT },
    policy: overrides.policy ?? createAllowAllPolicy(),
    clock: { now: () => "2026-01-01T00:00:00Z" },
    instance: "instance-1",
  });

test("records an Action that a Strategy submits as done by the agent", async () => {
  const result = await createExecutor({}).submit({ name: "move", params: { to: "a" } }, "strategy");
  expect(result.ok).toBe(true);
  const events = await readEvents();
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    type: "memex.action.executed",
    memexactor: "agent",
    memexinstance: "instance-1",
    data: { name: "move", params: { to: "a" } },
  });
});

test("rejects an unknown Action name and writes no event", async () => {
  let stepped = false;
  const executor = createExecutor({
    environment: {
      step: async () => {
        stepped = true;
        return STEP_RESULT;
      },
    },
  });
  const result = await executor.submit({ name: "fly", params: {} }, "strategy");
  expect(result).toEqual({
    ok: false,
    error: {
      kind: "unknown-action",
      name: "fly",
      message: 'No Action is defined with the name "fly".',
    },
  });
  expect(await readEvents()).toEqual([]);
  expect(stepped).toBe(false);
});

test("returns the Observations that the Environment step produced", async () => {
  const result = await createExecutor({}).submit({ name: "move", params: {} }, "strategy");
  expect(result).toEqual({
    ok: true,
    value: { status: "executed", observations: STEP_RESULT.observations },
  });
});

test("asks the Policy about the request, the actor and the definition", async () => {
  const asked: unknown[] = [];
  const policy: ActionPolicy = {
    authorize: async (request: ActionRequest, actor: string, definition: ActionDefinition) => {
      asked.push({ request, actor, definition });
      return { outcome: "allow", reason: "test" };
    },
  };
  await createExecutor({ policy }).submit({ name: "move", params: { to: "a" } }, "strategy");
  expect(asked).toEqual([
    { request: { name: "move", params: { to: "a" } }, actor: "agent", definition: MOVE },
  ]);
});

test("writes the event before the Environment executes the Action", async () => {
  let eventsAtStep = -1;
  const environment: ActionEnvironment = {
    step: async () => {
      eventsAtStep = (await readEvents()).length;
      return STEP_RESULT;
    },
  };
  await createExecutor({ environment }).submit({ name: "move", params: {} }, "strategy");
  expect(eventsAtStep).toBe(1);
});

test("does not execute an Action that the Policy does not allow", async () => {
  const deny: Decision = { outcome: "deny", reason: "not today" };
  let stepped = false;
  const executor = createExecutor({
    policy: { authorize: async () => deny },
    environment: {
      step: async () => {
        stepped = true;
        return STEP_RESULT;
      },
    },
  });
  const result = await executor.submit({ name: "move", params: {} }, "strategy");
  expect(result.ok === false && result.error).toMatchObject({ kind: "not-allowed" });
  expect(await readEvents()).toEqual([]);
  expect(stepped).toBe(false);
});
