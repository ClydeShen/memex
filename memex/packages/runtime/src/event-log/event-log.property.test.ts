import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Event } from "@memex/contracts";
import fc from "fast-check";
import { expect, test } from "vitest";
import { createEventLog, type EventLog, type NewEvent } from "./event-log.ts";

const SEED = 20261125;
const RUNS = 25;
const MAX_OPERATIONS = 12;
const MAX_CONCURRENT_APPENDS = 8;

const validEventArbitrary: fc.Arbitrary<NewEvent> = fc.record({
  specversion: fc.constant("1.0" as const),
  source: fc.constantFrom("/memex/runtime/test", "/memex/runtime/other"),
  type: fc.constantFrom("memex.action.executed", "memex.goal.set"),
  time: fc.constant("2026-01-01T00:00:00Z"),
  datacontenttype: fc.constant("application/json" as const),
  data: fc.record({ step: fc.integer(), label: fc.string() }),
  memexactor: fc.constantFrom("agent", "user"),
  memexinstance: fc.constant("instance-1"),
});

const invalidPartArbitrary: fc.Arbitrary<Partial<NewEvent>> = fc.constantFrom(
  { type: "not-a-memex-type" },
  { source: "" },
  { time: "yesterday" },
);

const invalidEventArbitrary: fc.Arbitrary<NewEvent> = fc
  .tuple(validEventArbitrary, invalidPartArbitrary)
  .map(([valid, part]) => ({ ...valid, ...part }));

type Operation =
  | { readonly kind: "append"; readonly event: NewEvent }
  | { readonly kind: "append-invalid"; readonly event: NewEvent }
  | { readonly kind: "reopen" };

const operationArbitrary: fc.Arbitrary<Operation> = fc.oneof(
  validEventArbitrary.map((event): Operation => ({ kind: "append", event })),
  invalidEventArbitrary.map((event): Operation => ({ kind: "append-invalid", event })),
  fc.constant<Operation>({ kind: "reopen" }),
);

const readAll = async (eventLog: EventLog): Promise<readonly Event[]> => {
  const events: Event[] = [];
  for await (const event of eventLog.read()) {
    events.push(event);
  }
  return events;
};

const withLogPath = async (run: (path: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), "event-log-property-"));
  try {
    await run(join(dir, "events.jsonl"));
  } finally {
    await rm(dir, { recursive: true });
  }
};

const expectParentChain = (events: readonly Event[]): void => {
  expect(events[0]?.memexparent).toBeUndefined();
  for (const [index, event] of events.slice(1).entries()) {
    expect(event.memexparent).toBe(events[index]?.id);
  }
};

const dataAfterStorage = (event: NewEvent): unknown => JSON.parse(JSON.stringify(event.data));

const applyOperation = async (
  operation: Operation,
  path: string,
  eventLog: EventLog,
  accepted: NewEvent[],
): Promise<EventLog> => {
  if (operation.kind === "reopen") {
    return createEventLog(path);
  }
  const result = await eventLog.append(operation.event);
  expect(result.ok).toBe(operation.kind === "append");
  if (result.ok) {
    accepted.push(operation.event);
  }
  return eventLog;
};

const expectMatchesModel = async (
  eventLog: EventLog,
  accepted: readonly NewEvent[],
): Promise<void> => {
  const events = await readAll(eventLog);
  expect(events.map((event) => event.data)).toEqual(accepted.map(dataAfterStorage));
  expectParentChain(events);
};

const runOperations = async (
  operations: readonly Operation[],
  path: string,
  eventLog: EventLog,
  accepted: NewEvent[],
): Promise<void> => {
  const [operation, ...rest] = operations;
  if (operation === undefined) {
    return;
  }
  const next = await applyOperation(operation, path, eventLog, accepted);
  await expectMatchesModel(next, accepted);
  return runOperations(rest, path, next, accepted);
};

test("matches a model of append, invalid append, read and reopen", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(operationArbitrary, { maxLength: MAX_OPERATIONS }),
      async (operations) =>
        withLogPath(async (path) => runOperations(operations, path, createEventLog(path), [])),
    ),
    { seed: SEED, numRuns: RUNS },
  );
});

test("concurrent appends keep one chain in the order of the calls", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.oneof(validEventArbitrary, invalidEventArbitrary), {
        maxLength: MAX_CONCURRENT_APPENDS,
      }),
      async (events) =>
        withLogPath(async (path) => {
          const eventLog = createEventLog(path);
          const results = await Promise.all(events.map((event) => eventLog.append(event)));
          const written = await readAll(eventLog);
          const acceptedIds = results.flatMap((result) => (result.ok ? [result.value] : []));
          expect(written.map((event) => event.id)).toEqual(acceptedIds);
          expectParentChain(written);
        }),
    ),
    { seed: SEED, numRuns: RUNS },
  );
});
