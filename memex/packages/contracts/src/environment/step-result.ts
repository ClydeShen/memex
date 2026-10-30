import { z } from "zod";
import { observationSchema } from "../observation/observation.ts";

// The answer of the Environment to one Action.
export const stepResultSchema = z.strictObject({
  observations: z.array(observationSchema),
  valid: z
    .boolean()
    .describe("False when the Action was not allowed; the World is then unchanged."),
  cost: z.number().nonnegative(),
  goalReached: z.boolean().describe("True when the World is in the target state of the Goal."),
});

export type StepResult = z.infer<typeof stepResultSchema>;
