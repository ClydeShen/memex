import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import { createEventLog, type NewEvent } from "./event-log.ts";

let dir = "";
let path = "";

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "event-log-"));
  path = join(dir, "events.jsonl");
});

afterEach(async () => {
  await rm(dir, { recursive: true });
});

const EVENT_COUNT = 5;
const STEPS = Array.from({ length: EVENT_COUNT }, (_, index) => index);

const newEvent = (step: number): NewEvent => ({
  specversion: "1.0",
  source: "/memex/runtime/test",
  type: "memex.action.executed",
  time: "2026-01-01T00:00:01Z",
  datacontenttype: "application/json",
  data: { step },
  memexactor: "agent",
  memexinstance: "instance-1",
});

const collect = async <T>(items: AsyncIterable<T>): Promise<T[]> => {
  const all: T[] = [];
  for await (const item of items) all.push(item);
  return all;
};

test("reads back the appended events in order, each pointing to the previous one", async () => {
  const log = createEventLog(path);
  const ids: string[] = [];
  for (const step of STEPS) {
    const result = await log.append(newEvent(step));
    if (!result.ok) throw new Error(result.error.message);
    ids.push(result.value);
  }
  const events = await collect(log.read());
  expect(events.map((event) => event.id)).toEqual(ids);
  expect(events.map((event) => event.data)).toEqual(STEPS.map((step) => ({ step })));
  expect(events.map((event) => event.memexparent)).toEqual([undefined, ...ids.slice(0, -1)]);
});

test("writes exactly one complete JSON event on each line", async () => {
  const log = createEventLog(path);
  await Promise.all(STEPS.map((step) => log.append(newEvent(step))));
  const text = await readFile(path, "utf8");
  const lines = text.split("\n");
  expect(lines.pop()).toBe("");
  expect(lines).toHaveLength(STEPS.length);
  for (const line of lines) expect(JSON.parse(line)).toMatchObject({ specversion: "1.0" });
});

test("rejects an event that does not match the schema and does not write it", async () => {
  const log = createEventLog(path);
  const result = await log.append({ ...newEvent(1), type: "not-memex" });
  expect(result.ok).toBe(false);
  expect(await collect(log.read())).toEqual([]);
  await expect(readFile(path, "utf8")).rejects.toThrow();
});

test("continues the chain of an existing file", async () => {
  const first = await createEventLog(path).append(newEvent(1));
  const second = await createEventLog(path).append(newEvent(2));
  if (!first.ok || !second.ok) throw new Error("append failed");
  const events = await collect(createEventLog(path).read());
  expect(events.at(-1)?.memexparent).toBe(first.value);
});
