import { describe, expect, test } from "vitest";
import { API_VERSION, resourceSchema } from "./resource.ts";

const environment = {
  apiVersion: API_VERSION,
  kind: "Environment",
  metadata: { name: "one-room" },
  spec: { type: "environment.micro-world", config: { rooms: 1 } },
} as const;

const experiment = {
  apiVersion: API_VERSION,
  kind: "Experiment",
  metadata: { name: "smoke" },
  spec: { environment: "one-room", strategy: "scripted", seed: 7, maxSteps: 10 },
} as const;

describe("resourceSchema", () => {
  test("accepts each of the four kinds", () => {
    const strategy = { ...environment, kind: "Strategy", metadata: { name: "scripted" } };
    const provider = { ...environment, kind: "Provider", metadata: { name: "policy-allow" } };
    for (const resource of [environment, experiment, strategy, provider]) {
      expect(resourceSchema.safeParse(resource).success).toBe(true);
    }
  });

  test("fills in the optional config and providers", () => {
    const parsed = resourceSchema.parse({
      ...environment,
      spec: { type: "environment.micro-world" },
    });
    expect(parsed.spec).toEqual({ type: "environment.micro-world", config: {} });
    const run = resourceSchema.parse(experiment);
    expect(run.kind === "Experiment" && run.spec.providers).toEqual([]);
  });

  test("rejects another apiVersion, an unknown kind and a type without a category", () => {
    expect(resourceSchema.safeParse({ ...environment, apiVersion: "memex.dev/v1" }).success).toBe(
      false,
    );
    expect(resourceSchema.safeParse({ ...environment, kind: "Runtime" }).success).toBe(false);
    expect(
      resourceSchema.safeParse({ ...environment, spec: { type: "micro-world" } }).success,
    ).toBe(false);
  });

  test("rejects a name that is not a lowercase label, and an unknown field", () => {
    expect(
      resourceSchema.safeParse({ ...environment, metadata: { name: "One_Room" } }).success,
    ).toBe(false);
    expect(
      resourceSchema.safeParse({ ...experiment, spec: { ...experiment.spec, steps: 3 } }).success,
    ).toBe(false);
  });

  test("rejects an Experiment without a positive step limit", () => {
    expect(
      resourceSchema.safeParse({ ...experiment, spec: { ...experiment.spec, maxSteps: 0 } })
        .success,
    ).toBe(false);
  });
});
