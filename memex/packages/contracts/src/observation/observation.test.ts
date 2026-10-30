import { expect, test } from "vitest";
import { observationSchema } from "./observation.ts";

const observation = {
  id: "obs-1",
  source: "environment",
  recordedAt: "2026-01-01T00:00:00Z",
  payload: { room: "start", doors: ["exit"] },
};

test("accepts an Observation with a JSON payload", () => {
  expect(observationSchema.parse(observation)).toEqual(observation);
});

test("rejects a time without a time zone and a payload that is not JSON", () => {
  expect(
    observationSchema.safeParse({ ...observation, recordedAt: "2026-01-01 00:00" }).success,
  ).toBe(false);
  expect(observationSchema.safeParse({ ...observation, payload: () => "room" }).success).toBe(
    false,
  );
});
