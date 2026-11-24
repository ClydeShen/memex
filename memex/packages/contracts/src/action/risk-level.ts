import { z } from "zod";

export const riskLevelSchema = z
  .enum(["read-only", "reversible", "irreversible", "external-send", "self-modify"])
  .describe("The Policy decides by this level. Only the user can execute a self-modify Action.");

export type RiskLevel = z.infer<typeof riskLevelSchema>;
