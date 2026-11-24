import { z } from "zod";
import { goalSchema } from "../goal/goal.ts";
import { observationSchema } from "../observation/observation.ts";

export const cognitiveStateSchema = z.strictObject({
  goal: goalSchema,
  recentObservations: z.array(observationSchema).describe("The latest Observations, newest last."),
  step: z.int().nonnegative().describe("How many steps the loop has already taken."),
});

export type CognitiveState = z.infer<typeof cognitiveStateSchema>;
