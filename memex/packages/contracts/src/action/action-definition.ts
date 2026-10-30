import { z } from "zod";
import { actionNameSchema } from "./action-request.ts";

export const riskLevelSchema = z
  .enum(["read-only", "reversible", "irreversible", "external-send", "self-modify"])
  .describe("The Policy decides by this level. Only the user can execute a self-modify Action.");

export const actionDefinitionSchema = z.strictObject({
  name: actionNameSchema,
  paramsSchema: z.record(z.string(), z.json()).describe("The JSON Schema of the params."),
  risk: riskLevelSchema,
});

export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type ActionDefinition = z.infer<typeof actionDefinitionSchema>;
