import { expect, test } from "vitest";
import { eventSchema } from "./event.ts";

const event = {
  specversion: "1.0",
  id: "01890a5d-ac96-774b-bcce-b302099a8057",
  source: "/memex/runtime/action-executor",
  type: "memex.action.executed",
  time: "2026-01-01T00:00:01Z",
  datacontenttype: "application/json",
  data: { name: "move", params: { to: "exit" } },
  memexactor: "agent",
  memexinstance: "instance-1",
  memexparent: "01890a5d-ac96-774b-bcce-b302099a8056",
};

test("accepts a CloudEvents event with the three extension attributes", () => {
  expect(eventSchema.parse(event)).toEqual(event);
});

test("accepts the first event, which has no parent", () => {
  const { memexparent: _, ...first } = event;
  expect(eventSchema.safeParse({ ...first, type: "memex.experiment.started" }).success).toBe(true);
});

test("rejects an id that is not a UUIDv7, another specversion and a type outside memex", () => {
  expect(
    eventSchema.safeParse({ ...event, id: "550e8400-e29b-41d4-a716-446655440000" }).success,
  ).toBe(false);
  expect(eventSchema.safeParse({ ...event, specversion: "0.3" }).success).toBe(false);
  expect(eventSchema.safeParse({ ...event, type: "com.example.action" }).success).toBe(false);
});

test("rejects an extension attribute name that CloudEvents does not allow", () => {
  expect(
    eventSchema.safeParse({ ...event, ...Object.fromEntries([["memex_actor", "agent"]]) }).success,
  ).toBe(false);
});
