import { z } from "zod";
import { actionNameSchema } from "./action-name.ts";
import { riskLevelSchema } from "./risk-level.ts";

export const actionDefinitionSchema = z.strictObject({
  name: actionNameSchema,
  paramsSchema: z.record(z.string(), z.json()).describe("The JSON Schema of the params."),
  risk: riskLevelSchema,
});

export type ActionDefinition = z.infer<typeof actionDefinitionSchema>;
