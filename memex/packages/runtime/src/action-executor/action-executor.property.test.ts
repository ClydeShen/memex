import { randomUUIDv7 } from "node:crypto";
import type {
  ActionDefinition,
  ActionEnvironment,
  ActionPolicy,
  ActionRequest,
  Decision,
  Event,
  StepResult,
} from "@memex/contracts";
import { err, ok } from "@memex/contracts";
import fc from "fast-check";
import { expect, test } from "vitest";
import type { EventLog, NewEvent } from "../event-log/event-log.ts";
import { type ActionOrigin, createActionExecutor } from "./action-executor.ts";

const SEED = 20261125;
const RUNS = 50;

const MOVE: ActionDefinition = { name: "move", paramsSchema: {}, risk: "reversible" };

const STEP_RESULT: StepResult = { observations: [], valid: true, cost: 1, goalReached: false };

const decisionArbitrary: fc.Arbitrary<Decision> = fc.record({
  outcome: fc.constantFrom("allow", "deny", "ask"),
  reason: fc.string({ minLength: 1 }),
});

const originArbitrary: fc.Arbitrary<ActionOrigin> = fc.constantFrom("strategy", "user");

const paramsArbitrary: fc.Arbitrary<Record<string, number>> = fc.dictionary(
  fc.constantFrom("to", "from", "speed"),
  fc.integer(),
);

type Recorder = {
  readonly appended: unknown[];
  readonly steps: unknown[];
  readonly eventLog: EventLog;
  readonly environment: ActionEnvironment;
};

type LogBehavior = "accepts" | "refuses";

const createRecorder = (logBehavior: LogBehavior): Recorder => {
  const appended: unknown[] = [];
  const steps: unknown[] = [];
  const eventLog: EventLog = {
    append: async (event: NewEvent) => {
      if (logBehavior === "refuses") {
        return err({ kind: "invalid-event", message: "the log refused the event" });
      }
      appended.push(event);
      return ok(randomUUIDv7());
    },
    read: async function* (): AsyncGenerator<Event> {
      yield* [];
    },
  };
  const environment: ActionEnvironment = {
    step: async (request: ActionRequest) => {
      steps.push(request);
      return STEP_RESULT;
    },
  };
  return { appended, steps, eventLog, environment };
};

const createExecutorFor = (
  recorder: Recorder,
  policy: ActionPolicy,
): ReturnType<typeof createActionExecutor> =>
  createActionExecutor({
    definitions: [MOVE],
    eventLog: recorder.eventLog,
    environment: recorder.environment,
    policy,
    clock: { now: () => "2026-01-01T00:00:00Z" },
    instance: "instance-1",
  });

test("writes the log and steps only when the Policy allows", async () => {
  await fc.assert(
    fc.asyncProperty(
      decisionArbitrary,
      originArbitrary,
      paramsArbitrary,
      async (decision, origin, params) => {
        const recorder = createRecorder("accepts");
        const executor = createExecutorFor(recorder, { authorize: async () => decision });
        const result = await executor.submit({ name: "move", params }, origin);
        const expectedCount = decision.outcome === "allow" ? 1 : 0;
        expect(recorder.appended).toHaveLength(expectedCount);
        expect(recorder.steps).toHaveLength(expectedCount);
        expect(result.ok).toBe(decision.outcome === "allow");
      },
    ),
    { seed: SEED, numRuns: RUNS },
  );
});

test("does not step when the log write fails", async () => {
  await fc.assert(
    fc.asyncProperty(originArbitrary, paramsArbitrary, async (origin, params) => {
      const recorder = createRecorder("refuses");
      const allow: ActionPolicy = {
        authorize: async () => ({ outcome: "allow", reason: "allowed" }),
      };
      const result = await createExecutorFor(recorder, allow).submit(
        { name: "move", params },
        origin,
      );
      expect(recorder.steps).toHaveLength(0);
      expect(result.ok === false && result.error.kind).toBe("log-failed");
    }),
    { seed: SEED, numRuns: RUNS },
  );
});
