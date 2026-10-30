import { z } from "zod";
import { actionRequestSchema } from "../action/action-request.ts";

export const stepDecisionSchema = z.strictObject({
  actions: z.array(actionRequestSchema).describe("The Actions to submit in this step, in order."),
  done: z.boolean().describe("True when the Strategy stops the loop."),
});

export type StepDecision = z.infer<typeof stepDecisionSchema>;
