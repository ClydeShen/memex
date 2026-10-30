import { expect, test } from "vitest";
import { actionDefinitionSchema } from "./action-definition.ts";

const definition = {
  name: "move",
  paramsSchema: { type: "object", properties: { to: { type: "string" } }, required: ["to"] },
  risk: "reversible",
};

test("accepts an ActionDefinition with each risk level", () => {
  for (const risk of ["read-only", "reversible", "irreversible", "external-send", "self-modify"]) {
    expect(actionDefinitionSchema.safeParse({ ...definition, risk }).success).toBe(true);
  }
});

test("rejects an unknown risk level and a missing params schema", () => {
  expect(actionDefinitionSchema.safeParse({ ...definition, risk: "safe" }).success).toBe(false);
  const { paramsSchema: _, ...withoutParamsSchema } = definition;
  expect(actionDefinitionSchema.safeParse(withoutParamsSchema).success).toBe(false);
});
